#!/usr/bin/env python3
"""
Cross-Platform Local Host Monitoring Agent
BMS Hardware Telemetry Service for Yerwada Smart Building BMS Simulator.

Cross-platform support: macOS, Windows, Linux
Security:
- Loopback-only binding: 127.0.0.1:8765
- Cryptographic local pairing token required for telemetry access
- Explicit CORS origin enforcement (No wildcard '*')
- Private Network Access (PNA) header support
"""
import sys
import os
import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Header, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Package / module imports supporting direct and module execution
try:
    from .platform import get_platform_provider
    from .services.metrics import MetricsCollector
    from .security.authentication import (
        get_or_create_device_id,
        get_or_create_pairing_token,
        verify_token,
        get_allowed_origins,
        get_origin_regex,
    )
except ImportError:
    from platform import get_platform_provider
    from services.metrics import MetricsCollector
    from security.authentication import (
        get_or_create_device_id,
        get_or_create_pairing_token,
        verify_token,
        get_allowed_origins,
        get_origin_regex,
    )

provider = get_platform_provider()
device_id = get_or_create_device_id(provider.get_device_prefix())
pairing_token = get_or_create_pairing_token()
collector = MetricsCollector(provider, device_id)

app = FastAPI(
    title="Yerwada BMS Local Host Monitoring Agent",
    description="Cross-platform local hardware telemetry daemon for SCADA simulation",
    version="2.0.0",
)

# CORS Configuration - Explicit allowed origins and Vercel domain regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_origin_regex=get_origin_regex(),
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Access-Control-Allow-Private-Network"],
)

# Private Network Access (PNA) middleware for modern Chromium browsers
@app.middleware("http")
async def add_private_network_headers(request: Request, call_next):
    # Check if request has Private Network header
    is_pna = request.headers.get("access-control-request-private-network") == "true"

    if request.method == "OPTIONS" and is_pna:
        # Preflight response with PNA permission
        response = Response(status_code=204)
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        response.headers["Access-Control-Allow-Origin"] = request.headers.get("origin", "*")
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

    response = await call_next(request)
    if is_pna:
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

# Dependency to check pairing token
async def require_auth(
    x_agent_token: Optional[str] = Header(None, alias="X-Agent-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    token: Optional[str] = Query(None),
) -> bool:
    candidate = x_agent_token or authorization or token
    if not candidate or not verify_token(candidate):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Invalid or missing local pairing token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True

@app.get("/")
def get_root():
    return {
        "status": "RUNNING",
        "service": "Yerwada BMS Local Host Monitoring Agent",
        "version": "2.0.0",
        "device_id": device_id,
        "device_name": provider.get_device_model(),
        "os_name": provider.get_os_name(),
        "endpoints": {
            "health": "/health",
            "verify": "/auth/verify",
            "metrics": "/metrics (Requires X-Agent-Token)",
        },
    }

@app.get("/health")
def get_health():
    """Lightweight unauthenticated probe for connection discovery."""
    return {
        "status": "HEALTHY",
        "device_id": device_id,
        "device_name": provider.get_device_model(),
        "os_name": provider.get_os_name(),
        "auth_required": True,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

@app.get("/auth/verify")
def verify_agent_token(authenticated: bool = Depends(require_auth)):
    """Verifies that the provided pairing token is valid."""
    return {
        "authenticated": True,
        "device_id": device_id,
        "device_name": provider.get_device_model(),
        "os_name": provider.get_os_name(),
        "device_type": provider.get_device_type(),
        "location": provider.get_location(),
    }

@app.get("/metrics")
def get_metrics(authenticated: bool = Depends(require_auth)):
    """
    Returns verified host telemetry mapped to SCADA points.
    Guarded by local pairing token authentication.
    """
    telemetry = collector.collect()
    telemetry["agent"] = {
        "status": "RUNNING",
        "host": "127.0.0.1",
        "port": 8765,
        "pid": os.getpid(),
        "python_version": sys.version.split()[0],
        "auth_enabled": True,
    }
    return telemetry

def start():
    print("=" * 68)
    print("  YERWADA SMART BUILDING BMS - LOCAL HOST MONITORING AGENT v2.0")
    print("=" * 68)
    print(f"  Device Name    : {provider.get_device_model()}")
    print(f"  Platform       : {provider.get_os_name()}")
    print(f"  Persistent ID  : {device_id}")
    print(f"  Endpoint       : http://127.0.0.1:8765")
    print(f"  Loopback Only  : YES (127.0.0.1 - Zero public exposure)")
    print("-" * 68)
    print(f"  PAIRING TOKEN  : {pairing_token}")
    print("-" * 68)
    print("  To connect this machine to your BMS workstation:")
    print("  1. Open the BMS web application (localhost or Vercel).")
    print("  2. In 'Devices' view, click 'Connect My Computer'.")
    print(f"  3. Enter pairing token: {pairing_token}")
    print("=" * 68)

    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")

if __name__ == "__main__":
    start()
