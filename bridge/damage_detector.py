#!/usr/bin/env python3
"""
Real-time Damage Detection Interface
Bridges computer vision output to adaptive flight replanning.
Supports: local YOLO model, remote API (Roboflow/custom), mock mode for testing
"""

import asyncio
import base64
import json
import logging
import time
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional, List, Callable
from pathlib import Path

logger = logging.getLogger(__name__)


class DamageType(str, Enum):
    CRACK       = "crack"
    SPALLING    = "delamination"
    CORROSION   = "corrosion"
    DEFORMATION = "deformation"
    EFFLORESCENCE = "efflorescence"
    UNKNOWN     = "unknown"


@dataclass
class DamageRecord:
    """单次损伤发现记录"""
    timestamp: float
    component: str          # 桥梁构件（如 "pier_column"）
    damage_type: str        # DamageType value
    severity: int           # 1-5
    confidence: float       # 0.0-1.0（模型置信度）
    lat: float
    lon: float
    altitude: float
    description: str = ""
    image_path: str = ""    # 存档图像路径
    requires_replan: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


class DamageDetector:
    """
    损伤检测引擎
    
    支持三种后端：
    - "mock"   : 测试模式，随机生成损伤（用于算法验证）
    - "yolo"   : 本地 YOLOv8 模型推理
    - "api"    : 远端检测 API（如 Roboflow）
    """

    def __init__(self, backend: str = "mock", model_path: str = None,
                 api_endpoint: str = None, api_key: str = None):
        self.backend = backend
        self.model_path = model_path
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.model = None
        self._damage_callbacks: List[Callable] = []

        if backend == "yolo":
            self._load_yolo_model()
        
        logger.info(f"DamageDetector initialized with backend: {backend}")

    def _load_yolo_model(self):
        """加载本地 YOLOv8 桥梁损伤检测模型"""
        try:
            from ultralytics import YOLO
            if self.model_path and Path(self.model_path).exists():
                self.model = YOLO(self.model_path)
                logger.info(f"YOLO model loaded: {self.model_path}")
            else:
                # 尝试下载预训练桥梁损伤检测模型
                logger.warning("Model path not found, using base YOLOv8n as placeholder")
                self.model = YOLO("yolov8n.pt")
        except ImportError:
            logger.error("ultralytics not installed. Run: pip install ultralytics")
            self.backend = "mock"

    def register_damage_callback(self, callback: Callable):
        """注册损伤发现回调函数（供自适应规划器订阅）"""
        self._damage_callbacks.append(callback)

    async def analyze_frame(self, image_data: bytes,
                            current_location: dict,
                            component_context: str = "unknown") -> Optional[DamageRecord]:
        """
        分析单帧图像，返回损伤记录（如检测到损伤）
        
        Args:
            image_data: JPEG/PNG 图像字节
            current_location: {"lat": ..., "lon": ..., "alt": ...}
            component_context: 当前巡检构件名称
        """
        if self.backend == "mock":
            return await self._mock_detect(current_location, component_context)
        elif self.backend == "yolo":
            return await self._yolo_detect(image_data, current_location, component_context)
        elif self.backend == "api":
            return await self._api_detect(image_data, current_location, component_context)
        return None

    async def _mock_detect(self, location: dict, component: str) -> Optional[DamageRecord]:
        """
        测试模式：以低概率随机生成损伤记录
        用于在没有真实图像数据时验证自适应重规划算法
        """
        import random
        # 5% 概率触发损伤发现（用于算法流程验证）
        if random.random() > 0.05:
            return None
        
        damage_types = list(DamageType)
        dtype = random.choice(damage_types[:-1])  # 排除 UNKNOWN
        severity = random.randint(1, 4)
        
        record = DamageRecord(
            timestamp=time.time(),
            component=component,
            damage_type=dtype.value,
            severity=severity,
            confidence=round(random.uniform(0.65, 0.95), 2),
            lat=location.get("lat", 0.0),
            lon=location.get("lon", 0.0),
            altitude=location.get("alt", 0.0),
            description=f"[MOCK] {dtype.value} detected on {component}, severity L{severity}",
            requires_replan=(severity >= 3)
        )
        
        # 触发所有已注册的回调
        for cb in self._damage_callbacks:
            await cb(record)
        
        logger.info(f"[MOCK] Damage detected: {record.damage_type} L{record.severity} "
                    f"at ({record.lat:.6f}, {record.lon:.6f})")
        return record

    async def _yolo_detect(self, image_data: bytes, location: dict,
                           component: str) -> Optional[DamageRecord]:
        """本地 YOLO 模型推理"""
        if not self.model:
            return None
        try:
            import numpy as np
            import cv2
            
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(None, self.model.predict, img)
            
            if not results or len(results[0].boxes) == 0:
                return None
            
            # 取置信度最高的检测结果
            boxes = results[0].boxes
            best_idx = boxes.conf.argmax().item()
            conf = boxes.conf[best_idx].item()
            cls_id = int(boxes.cls[best_idx].item())
            
            # 类别映射（需根据实际训练数据集调整）
            class_map = {0: "crack", 1: "spalling", 2: "corrosion",
                         3: "deformation", 4: "efflorescence"}
            damage_type = class_map.get(cls_id, "unknown")
            
            # 简单面积-严重度映射
            area_ratio = (boxes.xywhn[best_idx][2] * boxes.xywhn[best_idx][3]).item()
            severity = min(5, max(1, int(area_ratio * 20) + 1))
            
            record = DamageRecord(
                timestamp=time.time(),
                component=component,
                damage_type=damage_type,
                severity=severity,
                confidence=round(conf, 3),
                lat=location.get("lat", 0.0),
                lon=location.get("lon", 0.0),
                altitude=location.get("alt", 0.0),
                description=f"YOLO detected {damage_type} (conf={conf:.2f}) on {component}",
                requires_replan=(severity >= 3)
            )
            
            for cb in self._damage_callbacks:
                await cb(record)
            
            return record
            
        except Exception as e:
            logger.error(f"YOLO detection error: {e}")
            return None

    async def _api_detect(self, image_data: bytes, location: dict,
                          component: str) -> Optional[DamageRecord]:
        """调用远端检测 API（Roboflow 或自建推理服务）"""
        try:
            import httpx
            
            b64_image = base64.b64encode(image_data).decode("utf-8")
            payload = {
                "image": b64_image,
                "component": component,
                "confidence": 0.5
            }
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.api_endpoint, json=payload, headers=headers)
                resp.raise_for_status()
                result = resp.json()
            
            if not result.get("detected", False):
                return None
            
            record = DamageRecord(
                timestamp=time.time(),
                component=component,
                damage_type=result.get("damage_type", "unknown"),
                severity=result.get("severity", 1),
                confidence=result.get("confidence", 0.0),
                lat=location.get("lat", 0.0),
                lon=location.get("lon", 0.0),
                altitude=location.get("alt", 0.0),
                description=result.get("description", ""),
                requires_replan=(result.get("severity", 1) >= 3)
            )
            
            for cb in self._damage_callbacks:
                await cb(record)
            
            return record
            
        except Exception as e:
            logger.error(f"API detection error: {e}")
            return None