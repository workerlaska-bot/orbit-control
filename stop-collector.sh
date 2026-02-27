#!/bin/bash
# stop-collector.sh
# Orbit Control Collector stop script

cd "$(dirname "$0")"
PID_FILE="$(pwd)/collector.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Stopping Orbit Control Collector (PID: $PID)"
        kill "$PID"
        rm "$PID_FILE"
        echo "✅ Collector stopped"
    else
        echo "⚠️ Collector not running (stale PID: $PID)"
        rm "$PID_FILE"
    fi
else
    echo "ℹ️ No PID file found"
    echo "   Collector may not be running or was stopped manually"
fi

# Also kill any leftover node collector processes
pkill -f "node collector.js" 2>/dev/null || true