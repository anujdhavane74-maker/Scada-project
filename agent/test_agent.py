"""
Unit tests for cross-platform agent, authentication, and platform providers.
"""
import unittest
import sys
import os
from pathlib import Path

# Ensure agent package can be imported
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from agent.security.authentication import (
    get_or_create_device_id,
    get_or_create_pairing_token,
    verify_token,
    get_allowed_origins,
)
from agent.platform.base import PlatformProvider
from agent.platform.macos import MacOSPlatformProvider
from agent.platform.windows import WindowsPlatformProvider
from agent.services.metrics import MetricsCollector
from agent.services.thermal import format_thermal_state

class TestAgentSecurity(unittest.TestCase):
    def test_device_id_format(self):
        dev_id = get_or_create_device_id("MAC")
        self.assertTrue(dev_id.startswith("IT-MAC-"))
        self.assertEqual(len(dev_id), 11)  # IT-MAC-XXXX

    def test_pairing_token_verification(self):
        token = get_or_create_pairing_token()
        self.assertTrue(len(token) >= 16)
        self.assertTrue(verify_token(token))
        self.assertTrue(verify_token(f"Bearer {token}"))
        self.assertFalse(verify_token("invalid_token_xyz"))
        self.assertFalse(verify_token(""))
        self.assertFalse(verify_token(None))

    def test_allowed_origins(self):
        origins = get_allowed_origins()
        self.assertIn("http://localhost:5173", origins)
        self.assertIn("http://127.0.0.1:8765", origins)
        self.assertIn("https://yerwada-bms.vercel.app", origins)
        self.assertNotIn("*", origins)

class TestPlatformProviders(unittest.TestCase):
    def test_base_provider(self):
        p = PlatformProvider()
        self.assertEqual(p.get_device_type(), "IT Equipment")
        self.assertIsNotNone(p.get_os_name())
        batt = p.get_battery_status()
        self.assertIn("has_battery", batt)
        self.assertIn("percent", batt)

    def test_macos_provider(self):
        p = MacOSPlatformProvider()
        self.assertEqual(p.get_device_prefix(), "MAC")
        therm = p.get_thermal_pressure()
        self.assertIn("level", therm)
        self.assertIn("label", therm)
        temp = p.get_cpu_temperature()
        # On Apple silicon or test harness, temperature must not be fabricated
        if not temp["available"]:
            self.assertIsNone(temp["temp_c"])

    def test_windows_provider(self):
        p = WindowsPlatformProvider()
        self.assertEqual(p.get_device_prefix(), "PC")
        therm = p.get_thermal_pressure()
        self.assertIn("level", therm)
        temp = p.get_cpu_temperature()
        # Must not fabricate
        if not temp["available"]:
            self.assertIsNone(temp["temp_c"])

class TestMetricsCollector(unittest.TestCase):
    def test_collector_output(self):
        p = PlatformProvider()
        collector = MetricsCollector(p, "IT-PC-9999")
        data = collector.collect()

        self.assertEqual(data["device_id"], "IT-PC-9999")
        self.assertTrue(data["online"])
        self.assertIn("metrics", data)
        self.assertIn("cpu_usage_percent", data["metrics"])
        self.assertIn("memory_usage_percent", data["metrics"])
        self.assertIn("battery_percent", data["metrics"])
        self.assertIn("points", data)
        self.assertIn("PC01_CPU_USAGE", data["points"])

if __name__ == "__main__":
    unittest.main()
