"""Security package for local agent authentication, CORS origin control, and identity management."""
from .authentication import (
    get_or_create_device_id,
    get_or_create_pairing_token,
    verify_token,
    get_allowed_origins,
    get_origin_regex,
)

__all__ = [
    'get_or_create_device_id',
    'get_or_create_pairing_token',
    'verify_token',
    'get_allowed_origins',
    'get_origin_regex',
]
