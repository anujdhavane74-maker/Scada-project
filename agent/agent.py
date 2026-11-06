#!/usr/bin/env python3
"""
Legacy entry point for MacBook Host Agent.
Forwards to the new modular, cross-platform main agent implementation.
"""
from agent.main import app, start

if __name__ == "__main__":
    start()
