"""Platform abstraction modules for cross-platform hardware monitoring."""
from .base import PlatformProvider
from .macos import MacOSPlatformProvider
from .windows import WindowsPlatformProvider

def get_platform_provider() -> PlatformProvider:
    import sys
    if sys.platform == 'darwin':
        return MacOSPlatformProvider()
    elif sys.platform.startswith('win'):
        return WindowsPlatformProvider()
    else:
        # Fallback to base
        return PlatformProvider()

__all__ = ['PlatformProvider', 'MacOSPlatformProvider', 'WindowsPlatformProvider', 'get_platform_provider']
