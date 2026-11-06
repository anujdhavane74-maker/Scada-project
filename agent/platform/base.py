"""
Base platform provider defining interface for OS-specific telemetry.
"""
from typing import Dict, Any, Optional
import os
import sys
import psutil

def _get_sys_platform():
    """Safely obtain standard library platform without collision with local package."""
    if 'platform' in sys.modules and hasattr(sys.modules['platform'], 'system'):
        return sys.modules['platform']
    for p in sys.path:
        if ('lib/python' in p or 'lib64/python' in p or 'Lib' in p) and 'site-packages' not in p:
            cand = os.path.join(p, 'platform.py')
            if os.path.exists(cand):
                import importlib.util
                spec = importlib.util.spec_from_file_location('stdlib_platform', cand)
                if spec and spec.loader:
                    m = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(m)
                    return m
    import importlib
    return importlib.import_module('platform')

sys_platform = _get_sys_platform()

class PlatformProvider:
    """Base platform telemetry provider with generic fallbacks."""

    def get_os_name(self) -> str:
        return sys_platform.system() or "Generic OS"

    def get_os_version(self) -> str:
        return sys_platform.release() or "Unknown"

    def get_device_prefix(self) -> str:
        return "PC"

    def get_device_model(self) -> str:
        node = sys_platform.node()
        return node if node else "Generic Workstation"

    def get_device_type(self) -> str:
        return "IT Equipment"

    def get_location(self) -> str:
        return "Monitoring Lab"

    def get_thermal_pressure(self) -> Dict[str, Any]:
        """
        Generic thermal pressure representation.
        Levels: 0 = NOMINAL, 1 = FAIR, 2 = SERIOUS, 3 = CRITICAL
        """
        return {
            "level": 0,
            "label": "NOMINAL",
            "available": False,
            "note": "Generic platform does not expose thermal pressure state.",
        }

    def get_cpu_temperature(self) -> Dict[str, Any]:
        """
        Generic CPU temperature query using psutil if available.
        Does not fabricate values. Returns None if sensor is missing or restricted.
        """
        temp_c = None
        available = False
        reason = "Hardware temperature sensors not supported or restricted on this platform."

        try:
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if temps:
                    for name, entries in temps.items():
                        for entry in entries:
                            if entry.current and entry.current > 0:
                                temp_c = round(entry.current, 1)
                                available = True
                                reason = f"Read from {name} sensor"
                                break
                        if available:
                            break
        except Exception as e:
            reason = f"Temperature query error: {str(e)}"

        return {
            "temp_c": temp_c,
            "available": available,
            "reason": reason,
        }

    def get_battery_status(self) -> Dict[str, Any]:
        """
        Query system battery status.
        """
        try:
            battery = psutil.sensors_battery()
            if battery is None:
                return {
                    "has_battery": False,
                    "percent": 100.0,
                    "is_charging": True,
                    "note": "Desktop / A/C powered workstation (no battery present)",
                }
            return {
                "has_battery": True,
                "percent": round(battery.percent, 1),
                "is_charging": bool(battery.power_plugged),
                "note": "Internal battery",
            }
        except Exception as e:
            return {
                "has_battery": False,
                "percent": 100.0,
                "is_charging": True,
                "note": f"Battery sensor error: {str(e)}",
            }
