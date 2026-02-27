#!/bin/bash
# start-collector.sh
# Orbit Control Collector startup script

set -e

cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"
COLLECTOR_SCRIPT="$SCRIPT_DIR/collector.js"
LOG_FILE="$SCRIPT_DIR/collector.log"
PID_FILE="$SCRIPT_DIR/collector.pid"

# Default interval: 10 seconds (10000ms)
export COLLECTOR_INTERVAL_MS=${COLLECTOR_INTERVAL_MS:-10000}
export ORBIT_CONTROL_URL="https://orbit-control-three.vercel.app"
export RETENTION_DAYS=7

echo "🚀 Starting Orbit Control Collector"
echo "📊 Interval: ${COLLECTOR_INTERVAL_MS}ms"
echo "📈 Dashboard: ${ORBIT_CONTROL_URL}"
echo "📝 Log file: ${LOG_FILE}"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "⚠️ Collector already running (PID: $OLD_PID)"
        echo "   Stop with: ./stop-collector.sh"
        exit 1
    else
        echo "🔄 Removing stale PID file"
        rm "$PID_FILE"
    fi
fi

# Start collector
nohup node "$COLLECTOR_SCRIPT" >> "$LOG_FILE" 2>&1 &
NEW_PID=$!

# Save PID
echo $NEW_PID > "$PID_FILE"

echo "✅ Collector started (PID: $NEW_PID)"
echo "📊 Check logs: tail -f $LOG_FILE"
echo "🛑 Stop with: ./stop-collector.sh"