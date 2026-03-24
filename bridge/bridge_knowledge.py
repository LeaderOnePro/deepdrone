#!/usr/bin/env python3
"""
Bridge Domain Knowledge Base
Provides domain-specific system prompts for bridge SHM inspection.
References: JTG/T H21-2011 (Chinese standard), FHWA Bridge Inspector's Manual
"""

# ── 桥梁构件标准术语库（中英双语）──────────────────────────────────────
BRIDGE_COMPONENTS = {
    # 上部结构
    "superstructure": {
        "zh": "上部结构", "en": "superstructure",
        "sub": {
            "deck":         {"zh": "桥面板",   "en": "bridge deck"},
            "girder":       {"zh": "主梁",     "en": "main girder"},
            "t_beam":       {"zh": "T梁",      "en": "T-beam"},
            "box_girder":   {"zh": "箱梁",     "en": "box girder"},
            "flange":       {"zh": "翼缘板",   "en": "flange plate"},
            "web":          {"zh": "腹板",     "en": "web plate"},
            "diaphragm":    {"zh": "横隔板",   "en": "diaphragm"},
            "bearing":      {"zh": "支座",     "en": "bearing"},
            "expansion_joint": {"zh": "伸缩缝", "en": "expansion joint"},
        }
    },
    # 下部结构
    "substructure": {
        "zh": "下部结构", "en": "substructure",
        "sub": {
            "pier":         {"zh": "桥墩",     "en": "pier"},
            "pier_cap":     {"zh": "盖梁",     "en": "pier cap"},
            "column":       {"zh": "墩柱",     "en": "pier column"},
            "tie_beam":     {"zh": "系梁",     "en": "tie beam"},
            "abutment":     {"zh": "桥台",     "en": "abutment"},
            "pile_cap":     {"zh": "承台",     "en": "pile cap"},
            "foundation":   {"zh": "基础",     "en": "foundation"},
        }
    },
    # 附属结构
    "accessories": {
        "zh": "附属结构", "en": "accessories",
        "sub": {
            "railing":      {"zh": "栏杆",     "en": "railing"},
            "curb":         {"zh": "缘石",     "en": "curb"},
            "drainage":     {"zh": "排水系统", "en": "drainage system"},
            "cable":        {"zh": "拉索",     "en": "cable"},
            "hanger":       {"zh": "吊杆",     "en": "hanger rod"},
            "pylon":        {"zh": "索塔",     "en": "pylon"},
        }
    }
}

# ── 损伤类型分级（参照 JTG/T H21-2011 五级分类）──────────────────────
DAMAGE_TAXONOMY = {
    "crack": {
        "zh": "裂缝", "en": "crack",
        "severity": {
            1: {"zh": "细微裂缝（宽度<0.1mm）",  "en": "hairline crack (<0.1mm)"},
            2: {"zh": "轻微裂缝（0.1-0.3mm）",   "en": "minor crack (0.1-0.3mm)"},
            3: {"zh": "中等裂缝（0.3-0.5mm）",   "en": "moderate crack (0.3-0.5mm)"},
            4: {"zh": "严重裂缝（>0.5mm）",      "en": "severe crack (>0.5mm)"},
            5: {"zh": "贯穿裂缝（危及安全）",    "en": "through crack (safety risk)"},
        }
    },
    "spalling": {
        "zh": "剥落", "en": "spalling/delamination",
        "severity": {1: "轻微", 2: "中等", 3: "严重", 4: "大面积", 5: "结构性"}
    },
    "corrosion": {
        "zh": "锈蚀", "en": "corrosion/rust",
        "severity": {1: "表面锈迹", 2: "轻度锈蚀", 3: "中度锈蚀", 4: "重度锈蚀", 5: "截面损失"}
    },
    "deformation": {
        "zh": "变形", "en": "deformation/deflection",
        "severity": {1: "微小", 2: "轻微", 3: "明显", 4: "严重", 5: "失稳"}
    },
    "efflorescence": {
        "zh": "渗水泛碱", "en": "efflorescence/leakage",
        "severity": {1: "痕迹", 2: "轻微", 3: "中等", 4: "严重", 5: "大量涌水"}
    },
}

# ── 标准巡检航点模板（可被 LLM 引用和修改）────────────────────────────
INSPECTION_WAYPOINT_TEMPLATES = {
    "pier_column": {
        "description": "单个桥墩柱环形贴近巡检（4个正交视角 + 顶部俯视）",
        "waypoints_offset": [  # 相对于墩柱中心的偏移量(m)
            {"dx": 3.0,  "dy": 0.0,  "dz": 2.0,  "heading": 180, "label": "南侧"},
            {"dx": 0.0,  "dy": 3.0,  "dz": 2.0,  "heading": 270, "label": "东侧"},
            {"dx": -3.0, "dy": 0.0,  "dz": 2.0,  "heading": 0,   "label": "北侧"},
            {"dx": 0.0,  "dy": -3.0, "dz": 2.0,  "heading": 90,  "label": "西侧"},
            {"dx": 0.0,  "dy": 0.0,  "dz": 5.0,  "heading": 0,   "label": "顶部俯视"},
        ]
    },
    "deck_bottom": {
        "description": "桥面板底部 S 形扫描航线",
        "pattern": "serpentine",
        "altitude_offset": -1.5,   # 低于桥面底部 1.5m
        "lateral_spacing": 2.0,    # 横向间距 2m（保证图像重叠率 ≥ 80%）
    },
    "girder_side": {
        "description": "主梁侧面水平巡检",
        "altitude_offset": 0.0,
        "standoff_distance": 1.5,  # 距构件表面距离
        "speed": 0.5,              # 慢速 0.5m/s 确保图像质量
    }
}


class BridgeKnowledgeBase:
    """
    桥梁专业知识库，为 LLM 生成专业 System Prompt
    """

    @staticmethod
    def get_bridge_system_prompt(drone_status: str,
                                  inspection_phase: str = "routine",
                                  damage_context: dict = None) -> str:
        """
        生成桥梁巡检专用 System Prompt
        
        Args:
            drone_status: "CONNECTED" or "DISCONNECTED"
            inspection_phase: "routine"(常规) | "targeted"(定向) | "emergency"(应急)
            damage_context: 已发现损伤的上下文信息（用于自适应重规划）
        """
        
        damage_section = ""
        if damage_context:
            damage_section = f"""
ACTIVE DAMAGE ALERT / 当前损伤警报:
- Component / 构件: {damage_context.get('component', 'Unknown')}
- Damage Type / 损伤类型: {damage_context.get('damage_type', 'Unknown')}
- Severity / 严重程度: Level {damage_context.get('severity', 0)}/5
- Location / 位置: {damage_context.get('location', 'Unknown')}
- Action Required / 需要动作: Generate supplementary close-range inspection waypoints
  for this area / 为该区域生成补充近距离巡检航点
"""

        prompt = f"""You are DeepDrone-Bridge AI, a specialized UAV inspection assistant 
for bridge structural health monitoring (SHM), developed by the research team following 
JTG/T H21-2011 Chinese Bridge Inspection Standard and FHWA Bridge Inspector's Reference Manual.

CURRENT DRONE STATUS: {drone_status}
INSPECTION MODE: {inspection_phase.upper()}
{damage_section}

=== BRIDGE DOMAIN KNOWLEDGE ===

STANDARD BRIDGE COMPONENTS (use exact terms in code comments):
Upper Structure: bridge deck(桥面板), main girder(主梁), T-beam(T梁), box girder(箱梁),
  flange plate(翼缘板), web plate(腹板), diaphragm(横隔板), bearing(支座), 
  expansion joint(伸缩缝)
Lower Structure: pier(桥墩), pier cap(盖梁), pier column(墩柱), tie beam(系梁),
  abutment(桥台), pile cap(承台)
Cables/Hangers: cable(拉索), hanger rod(吊杆), pylon(索塔)

DAMAGE CLASSIFICATION (JTG/T H21-2011 5-Level System):
- crack(裂缝): L1(<0.1mm) L2(0.1-0.3mm) L3(0.3-0.5mm) L4(>0.5mm) L5(through crack)
- spalling(剥落): L1-L5 by area percentage
- corrosion(锈蚀): L1(surface rust) to L5(section loss)
- deformation(变形): L1(micro) to L5(instability risk)

FLIGHT SAFETY CONSTRAINTS FOR BRIDGE ENVIRONMENT:
- Minimum standoff distance from structure: 1.0m (hard limit, never closer)
- Maximum speed near bridge members: 1.0 m/s
- GPS shadow zones (under deck): switch to OPTICAL_FLOW or manual if GPS unreliable
- Wind gusts near bridge: reduce speed to 0.3 m/s if wind > 5 m/s
- Never fly under bridge without confirming clearance height
- Emergency RTL altitude: always set > bridge deck height + 10m

=== ADAPTIVE REPLANNING PROTOCOL ===

When damage is detected during inspection:
1. PAUSE current mission (hover in place)
2. Calculate supplementary waypoints within 1.5m of damage location
3. Execute close-range documentation pass (minimum 5 overlapping images)
4. Log damage with GPS coordinates, timestamp, and severity estimate
5. Resume original mission from last completed waypoint
6. Generate end-of-inspection damage summary report

=== AVAILABLE FUNCTIONS ===

Standard drone functions:
- connect_drone(connection_string)
- takeoff(altitude)
- land()
- return_home()  
- fly_to(lat, lon, alt)
- get_location()
- get_battery()
- execute_mission(waypoints)  # waypoints: list of {{lat, lon, alt}} dicts
- disconnect_drone()

Bridge-specific functions (NEW):
- report_damage(component, damage_type, severity, lat, lon, description)
  → Records damage finding with GPS stamp
- get_inspection_summary()
  → Returns current session damage log
- trigger_adaptive_replan(damage_info)
  → Requests LLM to generate supplementary waypoints for damage area
- capture_stereo_image(mode)
  → mode: 'RGB' | 'thermal' | 'crack_enhanced'

=== WAYPOINT FORMAT ===
waypoints = [
    {{"lat": 30.1234, "lon": 120.5678, "alt": 15.0}},  # alt = absolute altitude (m)
]

=== CRITICAL RULES ===
1. DRONE STATUS IS {drone_status} — {"NEVER call connect_drone()" if drone_status == "CONNECTED" else "MUST call connect_drone() first"}
2. Always include battery check before starting inspection sequence
3. Always set RTL_ALTITUDE > bridge_deck_height + 10 before takeoff
4. Always respond in the same language as the user (Chinese ↔ English)
5. Always comment code in both Chinese and English for research documentation
6. Severity L4-L5 damage must trigger immediate adaptive replan + operator alert

=== EXAMPLE: Adaptive Replan on Crack Detection ===

User: "在3号桥墩南侧检测到L3级裂缝，坐标(30.1234, 120.5678)，请生成补充巡检航点"

Response: "检测到3号桥墩南侧L3级裂缝，启动自适应补充巡检流程。
```python
# Adaptive replan: Supplementary close-range inspection for L3 crack
# 自适应重规划：针对L3级裂缝的补充近距离巡检

# Step 1: Log the damage finding / 第一步：记录损伤发现
report_damage(
    component='pier_column',     # 墩柱
    damage_type='crack',         # 裂缝
    severity=3,                  # L3级（0.3-0.5mm）
    lat=30.1234, lon=120.5678,
    description='South face of Pier #3, horizontal crack, estimated width 0.3-0.5mm'
)

# Step 2: Hover and compute supplementary waypoints / 第二步：悬停并计算补充航点
crack_lat, crack_lon, crack_alt = 30.1234, 120.5678, 8.0
offset = 0.000013  # ~1.5m in latitude degrees

supplementary_waypoints = [
    {{"lat": crack_lat - offset, "lon": crack_lon,          "alt": crack_alt}},  # 正南1.5m
    {{"lat": crack_lat - offset, "lon": crack_lon + offset, "alt": crack_alt}},  # 东南
    {{"lat": crack_lat,          "lon": crack_lon + offset, "alt": crack_alt}},  # 正东1.5m
    {{"lat": crack_lat - offset, "lon": crack_lon,          "alt": crack_alt + 1.0}},  # 上方角度
    {{"lat": crack_lat - offset, "lon": crack_lon,          "alt": crack_alt - 1.0}},  # 下方角度
]

# Step 3: Execute supplementary close-range pass / 第三步：执行补充近距离巡检
execute_mission(supplementary_waypoints)

# Step 4: Get battery status / 第四步：检查电量
battery = get_battery()
print(f"Supplementary inspection complete. Battery: {{battery}}")
print("L3级裂缝补充巡检完成，建议安排人工复核。")
```

补充巡检航点已生成（5个航点，最近距离1.5m），采集完成后建议人工复核。"
"""
        return prompt

    @staticmethod
    def get_damage_severity_guidance(severity_level: int) -> dict:
        """返回对应损伤等级的处置建议"""
        guidance = {
            1: {"action": "记录存档", "replan": False,  "alert": False, "priority": "低"},
            2: {"action": "记录并复查", "replan": False, "alert": False, "priority": "较低"},
            3: {"action": "补充巡检", "replan": True,  "alert": False, "priority": "中"},
            4: {"action": "立即补充巡检+通知负责人", "replan": True, "alert": True, "priority": "高"},
            5: {"action": "中止任务+紧急报告", "replan": True,  "alert": True, "priority": "紧急"},
        }
        return guidance.get(severity_level, guidance[1])