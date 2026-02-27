#!/bin/bash
# status-collector.sh
# Orbit Control Collector status script

cd "$(dirname "$0")"
PID_FILE="$(pwd)/collector.pid"
LOG_FILE="$(pwd)/collector.log"

echo "🔍 Orbit Control Collector Status"
echo "📊 Dashboard: https://orbit-control-three.vercel.app"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "✅ Running (PID: $PID)"
        
        # Check log file
        if [ -f "$LOG_FILE" ]; then
            LAST_LOG=$(tail -5 "$LOG_FILE" 2>/dev/null | grep -E "Collecting data|✓|✗" | tail -2)
            echo "📝 Last activity:"
            echo "$LAST_LOG" | sed 's/^/   /'
        fi
        
        # Check process memory
        MEMORY=$(ps -o rss= -p "$PID" 2>/dev/null || echo "N/A")
        if [ "$MEMORY" != "N/A" ]; then
            MEMORY_MB=$((MEMORY / 1024))
            echo "💾 Memory usage: ${MEMORY_MB} MB"
        fi
        
        exit 0
    else
        echo "❌ Stale PID file (PID: $PID)"
        rm "$PID_FILE"
        exit 1
    fi
else
    echo "❌ Not running (no PID file)"
    exit 1
fi