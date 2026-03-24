#!/usr/bin/env python3
"""
Bridge Inspection Logger
Records inspection sessions and generates structured SHM reports.
Output format compatible with JTG/T H21-2011 damage rating system.
"""

import json
import time
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


@dataclass
class InspectionSession:
    session_id: str
    bridge_id: str
    inspector: str
    start_time: float = field(default_factory=time.time)
    end_time: Optional[float] = None
    ai_provider: str = ""
    drone_model: str = ""
    weather: str = ""
    damage_records: List[dict] = field(default_factory=list)
    replan_events: List[dict] = field(default_factory=list)
    total_waypoints: int = 0
    supplementary_waypoints: int = 0
    flight_distance_m: float = 0.0
    notes: str = ""


class InspectionLogger:
    """巡检日志记录器，生成结构化巡检报告"""

    def __init__(self, output_dir: str = "inspection_logs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.current_session: Optional[InspectionSession] = None

    def start_session(self, bridge_id: str, inspector: str = "DeepDrone-Bridge AI",
                      ai_provider: str = "", **kwargs) -> str:
        """开始新巡检会话，返回 session_id"""
        session_id = f"{bridge_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.current_session = InspectionSession(
            session_id=session_id,
            bridge_id=bridge_id,
            inspector=inspector,
            ai_provider=ai_provider,
            **kwargs
        )
        logger.info(f"Inspection session started: {session_id}")
        return session_id

    def log_damage(self, damage_record) -> None:
        """记录损伤发现"""
        if self.current_session:
            self.current_session.damage_records.append(damage_record.to_dict())

    def log_replan_event(self, replan_event: dict) -> None:
        """记录重规划事件"""
        if self.current_session:
            self.current_session.replan_events.append(replan_event)

    def end_session(self) -> dict:
        """结束巡检会话，生成并保存报告"""
        if not self.current_session:
            return {}
        
        self.current_session.end_time = time.time()
        report = self._generate_report(self.current_session)
        
        # 保存 JSON 报告
        report_path = self.output_dir / f"{self.current_session.session_id}_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 生成 Markdown 摘要报告
        md_path = self.output_dir / f"{self.current_session.session_id}_summary.md"
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(self._generate_markdown_report(report))
        
        logger.info(f"Reports saved: {report_path}, {md_path}")
        self.current_session = None
        return report

    def _generate_report(self, session: InspectionSession) -> dict:
        """生成结构化 JSON 报告"""
        damage_by_severity = {f"L{i}": 0 for i in range(1, 6)}
        damage_by_type = {}
        
        for dr in session.damage_records:
            sev_key = f"L{dr.get('severity', 1)}"
            damage_by_severity[sev_key] = damage_by_severity.get(sev_key, 0) + 1
            dtype = dr.get("damage_type", "unknown")
            damage_by_type[dtype] = damage_by_type.get(dtype, 0) + 1

        duration_min = (session.end_time - session.start_time) / 60 if session.end_time else 0
        
        return {
            "report_metadata": {
                "session_id": session.session_id,
                "bridge_id": session.bridge_id,
                "inspector": session.inspector,
                "ai_provider": session.ai_provider,
                "inspection_date": datetime.fromtimestamp(session.start_time).isoformat(),
                "duration_minutes": round(duration_min, 1),
                "standard": "JTG/T H21-2011"
            },
            "flight_statistics": {
                "total_waypoints": session.total_waypoints,
                "supplementary_waypoints_added": session.supplementary_waypoints,
                "adaptive_replan_events": len(session.replan_events),
                "flight_distance_m": round(session.flight_distance_m, 1),
            },
            "damage_summary": {
                "total_findings": len(session.damage_records),
                "by_severity": damage_by_severity,
                "by_type": damage_by_type,
                "max_severity": max(
                    (dr.get("severity", 0) for dr in session.damage_records), default=0
                ),
                "requires_immediate_attention": [
                    dr for dr in session.damage_records if dr.get("severity", 0) >= 4
                ]
            },
            "damage_records": session.damage_records,
            "replan_events": session.replan_events,
        }

    def _generate_markdown_report(self, report: dict) -> str:
        """生成 Markdown 格式巡检摘要（中英双语）"""
        meta = report["report_metadata"]
        stats = report["flight_statistics"]
        dmg = report["damage_summary"]
        
        return f"""# Bridge Inspection Report / 桥梁巡检报告

## 基本信息 / Metadata
| 项目 | 值 |
|------|---|
| 桥梁编号 Bridge ID | {meta['bridge_id']} |
| 巡检日期 Date | {meta['inspection_date']} |
| 巡检时长 Duration | {meta['duration_minutes']} min |
| AI 提供商 AI Provider | {meta['ai_provider']} |
| 执行标准 Standard | {meta['standard']} |

## 飞行统计 / Flight Statistics
| 指标 | 数值 |
|------|------|
| 计划航点数 Planned waypoints | {stats['total_waypoints']} |
| 自适应补充航点 Supplementary waypoints | {stats['supplementary_waypoints_added']} |
| 触发重规划次数 Replan events | {stats['adaptive_replan_events']} |
| 飞行距离 Flight distance | {stats['flight_distance_m']} m |

## 损伤摘要 / Damage Summary
- **发现损伤总数 Total findings**: {dmg['total_findings']}
- **最高损伤等级 Max severity**: L{dmg['max_severity']}

### 损伤等级分布 Severity Distribution
{chr(10).join(f"- {k}: {v} 处" for k, v in dmg['by_severity'].items() if v > 0)}

### 损伤类型分布 Type Distribution  
{chr(10).join(f"- {k}: {v} 处" for k, v in dmg['by_type'].items())}

## 需立即关注的损伤 / Immediate Attention Required (L4-L5)
{self._format_critical_damages(dmg['requires_immediate_attention'])}

---
*Generated by DeepDrone-Bridge AI | LLM-Driven Adaptive UAV Inspection Framework*
"""

    def _format_critical_damages(self, damages: list) -> str:
        if not damages:
            return "无 / None"
        lines = []
        for i, d in enumerate(damages, 1):
            lines.append(
                f"{i}. [{d.get('damage_type','?')} L{d.get('severity','?')}] "
                f"{d.get('component','?')} @ ({d.get('lat',0):.6f}, {d.get('lon',0):.6f}) "
                f"— {d.get('description','')}"
            )
        return "\n".join(lines)