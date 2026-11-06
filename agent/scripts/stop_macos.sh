#!/usr/bin/env bash
# macOS Shutdown Script for Yerwada BMS Monitoring Agent
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

PID_FILE="${AGENT_DIR}/agent.pid"

if [ -f "${PID_FILE}" ]; then
  PID=$(cat "${PID_FILE}")
  if ps -p "${PID}" > /dev/null 2>&1; then
    echo "Stopping BMS Monitoring Agent (PID: ${PID})..."
    kill "${PID}" || true
    sleep 0.5
    if ps -p "${PID}" > /dev/null 2>&1; then
      kill -9 "${PID}" || true
    fi
    echo "✓ BMS Monitoring Agent stopped."
  else
    echo "Process ${PID} not found. Cleaning stale PID file."
  fi
  rm -f "${PID_FILE}"
else
  # Fallback check for any stray agent processes on port 8765
  STRAY_PID=$(lsof -ti :8765 || true)
  if [ -n "${STRAY_PID}" ]; then
    echo "Terminating process on port 8765 (PID: ${STRAY_PID})..."
    kill -9 "${STRAY_PID}" || true
    echo "✓ Process terminated."
  else
    echo "BMS Monitoring Agent is not running."
  fi
fi
