#!/usr/bin/env bash
# Forwarder to scripts/stop_macos.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/scripts/stop_macos.sh" "$@"
