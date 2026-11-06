#!/usr/bin/env bash
# macOS Startup Script for Yerwada BMS Monitoring Agent
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${AGENT_DIR}/.." && pwd)"

cd "${AGENT_DIR}"

PID_FILE="${AGENT_DIR}/agent.pid"
LOG_FILE="${AGENT_DIR}/agent.log"
TOKEN_FILE="${AGENT_DIR}/pairing_token.txt"

# Check if already running
if [ -f "${PID_FILE}" ]; then
  OLD_PID=$(cat "${PID_FILE}")
  if ps -p "${OLD_PID}" > /dev/null 2>&1; then
    echo "BMS Monitoring Agent is already running (PID: ${OLD_PID})."
    if [ -f "${TOKEN_FILE}" ]; then
      cat "${TOKEN_FILE}"
    fi
    exit 0
  fi
fi

# Ensure Python 3 virtual environment
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment in ${AGENT_DIR}/venv..."
  python3 -m venv venv
  ./venv/bin/pip install --upgrade pip > /dev/null 2>&1
  ./venv/bin/pip install -r requirements.txt
fi

echo "Starting Yerwada BMS Local Host Monitoring Agent on 127.0.0.1:8765..."

# Run python agent in background with project root in PYTHONPATH
export PYTHONPATH="${PROJECT_ROOT}:${PYTHONPATH}"
cd "${PROJECT_ROOT}"
nohup "${AGENT_DIR}/venv/bin/python3" -m agent.main > "${LOG_FILE}" 2>&1 &
AGENT_PID=$!
echo "${AGENT_PID}" > "${PID_FILE}"
cd "${AGENT_DIR}"

# Wait for agent to bind and initialize
sleep 1.5

if ps -p "${AGENT_PID}" > /dev/null 2>&1; then
  echo "✓ BMS Monitoring Agent started successfully (PID: ${AGENT_PID})."
  echo "  Listening on: http://127.0.0.1:8765"
  echo "  Log file    : ${LOG_FILE}"
  echo ""
  if [ -f "${TOKEN_FILE}" ]; then
    cat "${TOKEN_FILE}"
  fi
else
  echo "✗ Failed to start agent. Inspect log output:"
  cat "${LOG_FILE}"
  exit 1
fi
