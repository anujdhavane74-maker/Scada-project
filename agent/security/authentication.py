"""
Security and Authentication Module
Manages:
- Unique persistent device identifier generation and persistence
- Cryptographically secure pairing token generation and verification
- Explicit CORS origin enforcement (No wildcard CORS)
- Private Network Access (PNA) preflight support
"""
import os
import json
import secrets
import hmac
import hashlib
import uuid
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

CONFIG_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE = CONFIG_DIR / ".agent_config.json"
TOKEN_TXT_FILE = CONFIG_DIR / "pairing_token.txt"

def _load_config() -> Dict[str, Any]:
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def _save_config(config: Dict[str, Any]) -> None:
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save agent config: {e}")

def get_or_create_device_id(platform_prefix: str = "MAC") -> str:
    """
    Generate and persist a unique device ID (e.g. IT-MAC-7A2F, IT-PC-4B91).
    Derives unique component from hardware node hash if new, and stores permanently.
    """
    env_id = os.getenv("BMS_DEVICE_ID")
    if env_id:
        return env_id.strip()

    cfg = _load_config()
    if "device_id" in cfg and cfg["device_id"]:
        return cfg["device_id"]

    # Generate persistent unique identifier
    try:
        node_id = uuid.getnode()
        hash_digest = hashlib.sha256(str(node_id).encode("utf-8")).hexdigest()[:4].upper()
    except Exception:
        hash_digest = secrets.token_hex(2).upper()

    device_id = f"IT-{platform_prefix.upper()}-{hash_digest}"
    cfg["device_id"] = device_id
    cfg["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    _save_config(cfg)
    return device_id

def get_or_create_pairing_token() -> str:
    """
    Generate and persist a cryptographically secure pairing token.
    Saves in .agent_config.json and writes pairing_token.txt for easy operator copy-paste.
    """
    env_token = os.getenv("BMS_AGENT_TOKEN")
    if env_token:
        return env_token.strip()

    cfg = _load_config()
    if "pairing_token" in cfg and cfg["pairing_token"]:
        token = cfg["pairing_token"]
    else:
        token = secrets.token_hex(16)  # 32 hex chars
        cfg["pairing_token"] = token
        cfg["token_created_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        _save_config(cfg)

    # Always ensure pairing_token.txt is up to date for user reference
    try:
        with open(TOKEN_TXT_FILE, "w", encoding="utf-8") as f:
            f.write(
                f"# Yerwada Smart Building BMS - Local Host Agent Pairing Token\n"
                f"# Generated: {cfg.get('token_created_at', 'Now')}\n"
                f"# Enter this token in the BMS Web Application 'Connect My Computer' dialog:\n\n"
                f"{token}\n"
            )
    except Exception:
        pass

    return token

def verify_token(provided_token: Optional[str]) -> bool:
    """
    Verify provided token against stored active pairing token in constant time.
    """
    if not provided_token:
        return False

    active_token = get_or_create_pairing_token()
    clean_provided = provided_token.strip()

    # Support 'Bearer <token>' prefix if sent in Authorization header
    if clean_provided.lower().startswith("bearer "):
        clean_provided = clean_provided[7:].strip()

    return hmac.compare_digest(clean_provided, active_token)

def get_allowed_origins() -> List[str]:
    """
    Return explicit list of allowed origins.
    Never uses wildcard '*'.
    Includes local development origins and configured production origins.
    """
    base_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8765",
        "http://127.0.0.1:8765",
        "https://yerwada-bms.vercel.app",
    ]

    # Additional user or deployment origins via env var
    custom_origins = os.getenv("ALLOWED_ORIGINS", "")
    if custom_origins:
        for orig in custom_origins.split(","):
            cleaned = orig.strip()
            if cleaned and cleaned not in base_origins:
                base_origins.append(cleaned)

    return base_origins

def get_origin_regex() -> str:
    """
    Regex pattern allowing any Vercel deployment preview or production domain.
    E.g. https://*.vercel.app
    """
    return r"^https://.*\.vercel\.app$"
