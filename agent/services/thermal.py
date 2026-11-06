"""
Thermal Service
Formats and maps thermal telemetry to SCADA point structures.
"""
from typing import Dict, Any

THERMAL_LEVEL_MAP = {
    0: {"label": "NOMINAL", "severity": "NORMAL", "description": "Operating within safe thermal limits"},
    1: {"label": "FAIR", "severity": "INFO", "description": "Elevated thermal activity, moderate cooling engaged"},
    2: {"label": "SERIOUS", "severity": "WARNING", "description": "Thermal throttling active, high die temperature"},
    3: {"label": "CRITICAL", "severity": "CRITICAL", "description": "Critical thermal ceiling reached, safety throttling"},
}

def format_thermal_state(raw_state: Dict[str, Any]) -> Dict[str, Any]:
    level = raw_state.get("level", 0)
    info = THERMAL_LEVEL_MAP.get(level, THERMAL_LEVEL_MAP[0])
    return {
        "level": level,
        "label": raw_state.get("label", info["label"]),
        "severity": info["severity"],
        "available": raw_state.get("available", False),
        "note": raw_state.get("note", info["description"]),
    }
