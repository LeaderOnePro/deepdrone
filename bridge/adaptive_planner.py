#!/usr/bin/env python3
"""
Adaptive Inspection Path Planner
Core algorithm: damage-driven online waypoint replanning via LLM.

This is the primary scientific contribution of DeepDrone-Bridge.
Pipeline:
  DamageRecord → LLM semantic reasoning → supplementary waypoints → MAVLink execution
"""

import asyncio
import logging
import math
import time
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

# 1 度纬度 ≈ 111320 米（用于偏移量计算）
LAT_METER = 1.0 / 111320.0
# 1 度经度（在纬度30°处）≈ 96488 米
LON_METER = 1.0 / 96488.0


@dataclass
class InspectionWaypoint:
    lat: float
    lon: float
    alt: float
    speed: float = 1.0       # m/s
    hover_time: float = 2.0  # 悬停时间（秒），用于稳定图像采集
    label: str = ""          # 航点用途标注（用于报告）
    is_supplementary: bool = False  # 是否为自适应补充航点


@dataclass 
class MissionPlan:
    """完整巡检任务计划"""
    mission_id: str
    bridge_id: str
    planned_waypoints: List[InspectionWaypoint] = field(default_factory=list)
    supplementary_waypoints: List[InspectionWaypoint] = field(default_factory=list)
    completed_waypoints: List[InspectionWaypoint] = field(default_factory=list)
    current_waypoint_index: int = 0
    status: str = "PLANNED"  # PLANNED | EXECUTING | PAUSED | COMPLETED | ABORTED


class AdaptiveInspectionPlanner:
    """
    自适应巡检路径规划器
    
    科学贡献：
    实现了损伤感知驱动的在线动态航迹重规划，
    填补了现有文献中"先飞行后分析"两阶段范式的缺口。
    """

    # 自适应补充航点的安全参数
    MIN_STANDOFF_DISTANCE = 1.0   # 距构件最近距离 (m)
    CLOSE_RANGE_STANDOFF  = 1.5   # 补充精细巡检距离 (m)
    MAX_SUPPLEMENTARY_PTS = 8     # 每次损伤最多生成的补充航点数
    SEVERITY_REPLAN_THRESHOLD = 3 # ≥ L3 触发自动重规划

    def __init__(self, llm_interface=None):
        """
        Args:
            llm_interface: LLMInterface 实例（可选，用于 LLM 辅助规划）
                           如为 None，则使用纯算法规划
        """
        self.llm_interface = llm_interface
        self.current_mission: Optional[MissionPlan] = None
        self.replan_history: List[Dict] = []
        self._pause_event = asyncio.Event()
        self._pause_event.set()  # 默认不暂停

    def generate_routine_waypoints(self, bridge_info: dict) -> List[InspectionWaypoint]:
        """
        生成常规巡检航点序列
        
        Args:
            bridge_info: {
                "origin_lat": ..., "origin_lon": ..., "deck_alt": ...,
                "length": ...,   # 桥梁全长 (m)
                "width": ...,    # 桥面宽度 (m)
                "pier_count": ..., "pier_positions": [{"lat":..., "lon":...}, ...]
            }
        """
        waypoints = []
        origin_lat = bridge_info["origin_lat"]
        origin_lon = bridge_info["origin_lon"]
        deck_alt   = bridge_info.get("deck_alt", 20.0)
        length     = bridge_info.get("length", 100.0)
        width      = bridge_info.get("width", 10.0)

        # ── 1. 桥面整体俯视扫描（S 形航线）──────────────────────────
        n_lines = max(3, int(width / 2.0) + 1)  # 每 2m 一条航线
        for i in range(n_lines):
            lateral_offset = (-width / 2.0 + i * (width / (n_lines - 1))) * LON_METER
            # 奇偶行交替方向（S 形）
            if i % 2 == 0:
                waypoints.append(InspectionWaypoint(
                    lat=origin_lat, lon=origin_lon + lateral_offset,
                    alt=deck_alt + 5.0, speed=2.0, hover_time=0.5,
                    label=f"deck_scan_line_{i}_start"
                ))
                waypoints.append(InspectionWaypoint(
                    lat=origin_lat + length * LAT_METER,
                    lon=origin_lon + lateral_offset,
                    alt=deck_alt + 5.0, speed=2.0, hover_time=0.5,
                    label=f"deck_scan_line_{i}_end"
                ))
            else:
                waypoints.append(InspectionWaypoint(
                    lat=origin_lat + length * LAT_METER,
                    lon=origin_lon + lateral_offset,
                    alt=deck_alt + 5.0, speed=2.0, hover_time=0.5,
                    label=f"deck_scan_line_{i}_start"
                ))
                waypoints.append(InspectionWaypoint(
                    lat=origin_lat, lon=origin_lon + lateral_offset,
                    alt=deck_alt + 5.0, speed=2.0, hover_time=0.5,
                    label=f"deck_scan_line_{i}_end"
                ))

        # ── 2. 各桥墩环形巡检──────────────────────────────────────
        for pier in bridge_info.get("pier_positions", []):
            pier_wps = self._generate_pier_waypoints(
                pier["lat"], pier["lon"], deck_alt
            )
            waypoints.extend(pier_wps)

        # ── 3. 桥面板底部扫描（贴近飞行）────────────────────────────
        bottom_alt = deck_alt - 1.5
        waypoints.append(InspectionWaypoint(
            lat=origin_lat, lon=origin_lon,
            alt=bottom_alt, speed=0.5, hover_time=1.0,
            label="deck_bottom_scan_start"
        ))
        waypoints.append(InspectionWaypoint(
            lat=origin_lat + length * LAT_METER, lon=origin_lon,
            alt=bottom_alt, speed=0.5, hover_time=2.0,
            label="deck_bottom_scan_end"
        ))

        logger.info(f"Generated {len(waypoints)} routine waypoints for bridge inspection")
        return waypoints

    def _generate_pier_waypoints(self, pier_lat: float, pier_lon: float,
                                  deck_alt: float) -> List[InspectionWaypoint]:
        """生成单个桥墩的环形巡检航点（4正交视角 + 底部 + 顶部）"""
        wps = []
        r = self.CLOSE_RANGE_STANDOFF * 2  # 环形半径 3m

        angles_labels = [
            (0,   "south"),
            (90,  "west"),
            (180, "north"),
            (270, "east"),
        ]
        for angle_deg, label in angles_labels:
            angle_rad = math.radians(angle_deg)
            wps.append(InspectionWaypoint(
                lat=pier_lat + r * math.cos(angle_rad) * LAT_METER,
                lon=pier_lon + r * math.sin(angle_rad) * LON_METER,
                alt=deck_alt * 0.5,  # 墩柱中高度
                speed=0.5, hover_time=3.0,
                label=f"pier_{label}_view"
            ))

        # 顶部俯视
        wps.append(InspectionWaypoint(
            lat=pier_lat, lon=pier_lon,
            alt=deck_alt - 0.5,
            speed=0.3, hover_time=3.0,
            label="pier_top_view"
        ))
        return wps

    async def trigger_adaptive_replan(self, damage_record,
                                       current_location: dict) -> List[InspectionWaypoint]:
        """
        核心方法：损伤触发的自适应重规划
        
        当 DamageDetector 发现 severity >= 3 的损伤时自动调用。
        先暂停当前任务，规划补充航点，执行后恢复。
        
        Args:
            damage_record: DamageRecord 实例
            current_location: 当前无人机 GPS 位置

        Returns:
            supplementary_waypoints: 补充巡检航点列表
        """
        severity = damage_record.severity
        
        if severity < self.SEVERITY_REPLAN_THRESHOLD:
            logger.info(f"Damage L{severity} below replan threshold, logging only")
            return []

        logger.warning(f"ADAPTIVE REPLAN TRIGGERED: {damage_record.damage_type} "
                       f"L{severity} at ({damage_record.lat:.6f}, {damage_record.lon:.6f})")

        # 记录重规划事件（用于论文数据收集）
        replan_event = {
            "timestamp": time.time(),
            "damage_type": damage_record.damage_type,
            "severity": severity,
            "confidence": damage_record.confidence,
            "location": {"lat": damage_record.lat, "lon": damage_record.lon},
            "trigger_location": current_location,
            "method": "llm" if self.llm_interface else "algorithmic"
        }

        if self.llm_interface:
            # ── LLM 辅助规划：让 LLM 根据损伤语义生成更智能的航点 ──
            supp_waypoints = await self._llm_assisted_replan(damage_record)
        else:
            # ── 纯算法规划：确定性几何方法 ──────────────────────────
            supp_waypoints = self._algorithmic_replan(damage_record)

        replan_event["supplementary_count"] = len(supp_waypoints)
        replan_event["waypoints"] = [
            {"lat": w.lat, "lon": w.lon, "alt": w.alt} for w in supp_waypoints
        ]
        self.replan_history.append(replan_event)

        # 注入到当前任务计划
        if self.current_mission:
            self.current_mission.supplementary_waypoints.extend(supp_waypoints)

        logger.info(f"Replan complete: {len(supp_waypoints)} supplementary waypoints generated")
        return supp_waypoints

    def _algorithmic_replan(self, damage_record) -> List[InspectionWaypoint]:
        """
        纯算法自适应重规划（不依赖 LLM）
        在损伤位置周围生成系统性的近距离环绕航点
        """
        d_lat = damage_record.lat
        d_lon = damage_record.lon
        d_alt = damage_record.altitude
        r = self.CLOSE_RANGE_STANDOFF  # 1.5m

        waypoints = []
        
        # 根据严重度决定航点数量和距离
        if damage_record.severity == 3:
            angles = [0, 90, 180, 270, 45]       # 5个视角
            standoff = r
        elif damage_record.severity == 4:
            angles = [0, 60, 120, 180, 240, 300]  # 6个视角
            standoff = r * 0.8
        else:  # severity == 5
            angles = [0, 45, 90, 135, 180, 225, 270, 315]  # 8个全方位视角
            standoff = r * 0.67  # 1.0m（最小安全距离）

        for i, angle_deg in enumerate(angles[:self.MAX_SUPPLEMENTARY_PTS]):
            angle_rad = math.radians(angle_deg)
            waypoints.append(InspectionWaypoint(
                lat=d_lat + standoff * math.cos(angle_rad) * LAT_METER,
                lon=d_lon + standoff * math.sin(angle_rad) * LON_METER,
                alt=d_alt,
                speed=0.3,      # 低速确保图像质量
                hover_time=3.0, # 悬停 3 秒采集多帧
                label=f"supp_{i:02d}_{damage_record.damage_type}_L{damage_record.severity}",
                is_supplementary=True
            ))

        # 增加俯视和仰视两个视角
        waypoints.append(InspectionWaypoint(
            lat=d_lat, lon=d_lon, alt=d_alt + 1.5,
            speed=0.3, hover_time=3.0,
            label=f"supp_top_{damage_record.damage_type}",
            is_supplementary=True
        ))
        waypoints.append(InspectionWaypoint(
            lat=d_lat, lon=d_lon, alt=max(d_alt - 1.5, 2.0),
            speed=0.3, hover_time=3.0,
            label=f"supp_bottom_{damage_record.damage_type}",
            is_supplementary=True
        ))

        return waypoints

    async def _llm_assisted_replan(self, damage_record) -> List[InspectionWaypoint]:
        """
        LLM 辅助自适应重规划
        利用 LLM 的语义理解能力，根据损伤类型和构件位置
        生成更有针对性的补充航点策略
        """
        if not self.llm_interface:
            return self._algorithmic_replan(damage_record)

        prompt = f"""You are a bridge inspection expert. Generate supplementary close-range 
inspection waypoints for the following damage finding.

Damage Record:
- Component: {damage_record.component}
- Damage Type: {damage_record.damage_type}
- Severity: L{damage_record.severity}/5
- Location: lat={damage_record.lat:.6f}, lon={damage_record.lon:.6f}, alt={damage_record.altitude:.1f}m
- Description: {damage_record.description}

Requirements:
1. Generate 5-8 supplementary waypoints for close-range documentation
2. Minimum standoff distance: {self.MIN_STANDOFF_DISTANCE}m from structure
3. Preferred standoff distance: {self.CLOSE_RANGE_STANDOFF}m
4. Speed at each waypoint: 0.3 m/s
5. Hover time: 3.0 seconds per waypoint
6. Consider the geometry of {damage_record.component} for optimal viewing angles

Respond ONLY with valid JSON in this exact format:
{{
  "waypoints": [
    {{"lat": 0.000000, "lon": 0.000000, "alt": 0.0, "label": "description"}},
    ...
  ],
  "strategy": "brief explanation of inspection strategy"
}}"""

        try:
            messages = [{"role": "user", "content": prompt}]
            response = self.llm_interface.chat(messages)
            
            # 解析 LLM 返回的 JSON
            import json, re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if not json_match:
                logger.warning("LLM returned no valid JSON, falling back to algorithmic replan")
                return self._algorithmic_replan(damage_record)
            
            data = json.loads(json_match.group())
            waypoints = []
            for wp in data.get("waypoints", []):
                waypoints.append(InspectionWaypoint(
                    lat=float(wp["lat"]),
                    lon=float(wp["lon"]),
                    alt=float(wp["alt"]),
                    speed=0.3,
                    hover_time=3.0,
                    label=wp.get("label", "llm_supplementary"),
                    is_supplementary=True
                ))
            
            logger.info(f"LLM generated {len(waypoints)} supplementary waypoints. "
                        f"Strategy: {data.get('strategy', 'N/A')}")
            return waypoints

        except Exception as e:
            logger.error(f"LLM-assisted replan failed: {e}, falling back to algorithmic")
            return self._algorithmic_replan(damage_record)

    def get_replan_statistics(self) -> dict:
        """返回重规划统计数据（用于论文实验数据收集）"""
        if not self.replan_history:
            return {"total_replans": 0}
        
        return {
            "total_replans": len(self.replan_history),
            "by_severity": {
                f"L{s}": sum(1 for r in self.replan_history
                             if r.get("severity") == s) for s in range(1, 6)
            },
            "by_damage_type": {
                dtype: sum(1 for r in self.replan_history
                           if r.get("damage_type") == dtype)
                for dtype in ["crack", "spalling", "corrosion", "deformation"]
            },
            "llm_vs_algorithmic": {
                "llm": sum(1 for r in self.replan_history if r.get("method") == "llm"),
                "algorithmic": sum(1 for r in self.replan_history
                                   if r.get("method") == "algorithmic")
            },
            "avg_supplementary_waypoints": sum(
                r.get("supplementary_count", 0) for r in self.replan_history
            ) / len(self.replan_history)
        }