"""
macOS Platform Provider
Maintains native NSProcessInfo thermalState monitoring via Objective-C runtime
and respects Apple Silicon sensor security boundaries.
"""
import ctypes
import ctypes.util
import subprocess
from typing import Dict, Any
from .base import PlatformProvider, sys_platform

class MacOSPlatformProvider(PlatformProvider):
    """Platform implementation for macOS (Intel & Apple Silicon)."""

    def get_os_name(self) -> str:
        ver = sys_platform.mac_ver()[0] if hasattr(sys_platform, 'mac_ver') else ""
        return f"macOS {ver}" if ver else "macOS"

    def get_device_prefix(self) -> str:
        return "MAC"

    def get_device_model(self) -> str:
        # Try getting friendly computer name
        try:
            cmd = ["scutil", "--get", "ComputerName"]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=1.0)
            if res.returncode == 0 and res.stdout.strip():
                return res.stdout.strip()
        except Exception:
            pass

        # Try sysctl hardware model
        try:
            cmd = ["sysctl", "-n", "hw.model"]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=1.0)
            if res.returncode == 0 and res.stdout.strip():
                return f"Mac ({res.stdout.strip()})"
        except Exception:
            pass

        return sys_platform.node() or "MacBook Workstation"

    def get_thermal_pressure(self) -> Dict[str, Any]:
        """
        Query native macOS thermal pressure state via Objective-C NSProcessInfo.
        Values:
          0: Nominal (Normal thermal envelope)
          1: Fair (Elevated thermal activity, minor throttling)
          2: Serious (High thermal pressure, heavy throttling)
          3: Critical (Critical thermal pressure, thermal safety limit)
        """
        try:
            objc_lib = ctypes.util.find_library("objc")
            if not objc_lib:
                return {
                    "level": 0,
                    "label": "NOMINAL",
                    "available": False,
                    "note": "objc runtime not found",
                }

            objc = ctypes.cdll.LoadLibrary(objc_lib)
            objc.objc_getClass.restype = ctypes.c_void_p
            objc.sel_registerName.restype = ctypes.c_void_p
            objc.objc_msgSend.restype = ctypes.c_void_p
            objc.objc_msgSend.argtypes = [ctypes.c_void_p, ctypes.c_void_p]

            NSProcessInfo = objc.objc_getClass(b"NSProcessInfo")
            sel_processInfo = objc.sel_registerName(b"processInfo")
            proc_info = objc.objc_msgSend(NSProcessInfo, sel_processInfo)

            sel_thermalState = objc.sel_registerName(b"thermalState")
            objc.objc_msgSend.restype = ctypes.c_long
            thermal_state = int(objc.objc_msgSend(proc_info, sel_thermalState))

            labels = {
                0: "NOMINAL",
                1: "FAIR",
                2: "SERIOUS",
                3: "CRITICAL",
            }

            return {
                "level": thermal_state,
                "label": labels.get(thermal_state, "UNKNOWN"),
                "available": True,
                "note": "Queried natively via NSProcessInfo.thermalState (non-privileged API)",
            }
        except Exception as exc:
            return {
                "level": 0,
                "label": "NOMINAL",
                "available": False,
                "note": f"NSProcessInfo thermal query failed: {str(exc)}",
            }

    def get_cpu_temperature(self) -> Dict[str, Any]:
        """
        macOS temperature requirements:
        Apple Silicon (M-series) restricts direct die-temperature sensor reads
        to superuser (root / SMC kernel driver).
        In compliance with security requirements, we do NOT fabricate readings.
        """
        # Check if running on Apple Silicon
        is_arm = sys_platform.machine() in ("arm64", "aarch64") if hasattr(sys_platform, 'machine') else True
        if is_arm:
            return {
                "temp_c": None,
                "available": False,
                "reason": (
                    "macOS on Apple Silicon restricts direct die-temperature sensor reads to superuser "
                    "(root / SMC kernel driver). Thermal pressure is monitored natively via NSProcessInfo."
                ),
            }

        # On Intel Mac, attempt standard sensors if available
        return super().get_cpu_temperature()
