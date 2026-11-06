"""
Windows Platform Provider
Investigates Windows thermal interfaces (ACPI Thermal Zones / WMI) without fabricating data,
and provides native Windows system telemetry.
"""
import subprocess
from typing import Dict, Any, Optional
import psutil
from .base import PlatformProvider, sys_platform

class WindowsPlatformProvider(PlatformProvider):
    """Platform implementation for Microsoft Windows."""

    def get_os_name(self) -> str:
        ver = sys_platform.win32_ver() if hasattr(sys_platform, 'win32_ver') else ("", "")
        edition = ver[0] or "Windows"
        release = ver[1] or ""
        return f"Microsoft Windows {edition} ({release})".strip()

    def get_device_prefix(self) -> str:
        return "PC"

    def get_device_model(self) -> str:
        # Try getting OEM model via wmic or PowerShell if accessible
        try:
            cmd = ["powershell", "-NoProfile", "-Command", "Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object -ExpandProperty Model"]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=1.5)
            if res.returncode == 0 and res.stdout.strip():
                return res.stdout.strip()
        except Exception:
            pass

        return sys_platform.node() or "Windows PC Workstation"

    def get_thermal_pressure(self) -> Dict[str, Any]:
        """
        Evaluate thermal pressure on Windows based on CPU clock throttling and core load.
        """
        try:
            freq = psutil.cpu_freq()
            cpu_pct = psutil.cpu_percent(interval=None)

            level = 0
            label = "NOMINAL"
            note = "Standard Windows thermal envelope"

            if freq and freq.max and freq.current:
                # If current frequency is significantly throttled under load
                if cpu_pct > 85.0 and freq.current < (freq.max * 0.70):
                    level = 2
                    label = "SERIOUS"
                    note = f"Thermal throttling detected: CPU frequency constrained to {int(freq.current)}MHz (max: {int(freq.max)}MHz)"
                elif cpu_pct > 75.0:
                    level = 1
                    label = "FAIR"
                    note = "Elevated workload, monitoring thermal profile"
            elif cpu_pct > 90.0:
                level = 1
                label = "FAIR"
                note = "High CPU load profile"

            return {
                "level": level,
                "label": label,
                "available": True,
                "note": note,
            }
        except Exception as exc:
            return {
                "level": 0,
                "label": "NOMINAL",
                "available": False,
                "note": f"Thermal assessment note: {str(exc)}",
            }

    def get_cpu_temperature(self) -> Dict[str, Any]:
        """
        Investigate supported Windows thermal interfaces:
        1. psutil.sensors_temperatures() if available
        2. WMI MSAcpi_ThermalZoneTemperature via PowerShell
        Does not fabricate CPU temperature. Returns None if sensor is missing or restricted.
        """
        # 1. First check psutil built-in sensors
        base_result = super().get_cpu_temperature()
        if base_result["available"] and base_result["temp_c"] is not None:
            return base_result

        # 2. Check WMI ACPI Thermal Zone
        try:
            cmd = [
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CurrentTemperature",
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=1.5)
            if res.returncode == 0 and res.stdout.strip():
                # Value is in tenths of Kelvin: e.g. 3010 is 301.0 K = 27.85 C
                raw_val = float(res.stdout.strip().split()[0])
                if raw_val > 2500 and raw_val < 4500: # Sanity check: ~ -23C to 176C
                    celsius = round((raw_val / 10.0) - 273.15, 1)
                    return {
                        "temp_c": celsius,
                        "available": True,
                        "reason": "Queried via Windows WMI MSAcpi_ThermalZoneTemperature",
                    }
        except Exception:
            pass

        return {
            "temp_c": None,
            "available": False,
            "reason": (
                "Windows ACPI thermal zones require manufacturer WMI driver or elevated administrator access. "
                "Unprivileged access is restricted to protect system stability."
            ),
        }
