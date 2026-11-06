#!/usr/bin/env bash
# Forwarder to scripts/start_macos.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/scripts/start_macos.sh" "$@"
