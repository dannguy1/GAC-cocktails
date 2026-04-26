#!/usr/bin/env bash
#
# GAC-Cocktails service manager
# Usage: ./gac_bartender.sh {start|stop|restart|status|logs|rebuild} [--dev]
#
# Manages the Vite server for the GAC Bartender PWA.
# Default mode: vite preview (production build) on PORT (default 8510).
#
# Flags:
#   --dev    Use Vite hot-reload dev server on port 5173 instead
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
PID_DIR="$PROJECT_DIR/.pids"
ENV_FILE="$PROJECT_DIR/.env"

# Load PORT from .env if present
PORT=8510
if [[ -f "$ENV_FILE" ]]; then
    _port=$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d ' ' || true)
    [[ -n "$_port" ]] && PORT="$_port"
fi

SVC_NAME="gac-bartender"
DEV_MODE=false

for arg in "$@"; do
    [[ "$arg" == "--dev" ]] && DEV_MODE=true
done

_effective_port() {
    $DEV_MODE && echo "5173" || echo "$PORT"
}

# ── Helpers ───────────────────────────────────────────────────────────

_ensure_dirs() {
    mkdir -p "$LOG_DIR" "$PID_DIR"
}

_pidfile() { echo "$PID_DIR/$SVC_NAME.pid"; }
_logfile()  { echo "$LOG_DIR/$SVC_NAME.log"; }

_is_running() {
    local pidfile
    pidfile="$(_pidfile)"
    if [[ -f "$pidfile" ]]; then
        local pid
        pid=$(<"$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
        rm -f "$pidfile"   # stale pidfile
    fi
    return 1
}

_port_in_use() {
    local port=$1
    if command -v ss &>/dev/null; then
        ss -tlnp 2>/dev/null | grep -q ":${port} "
    elif command -v lsof &>/dev/null; then
        lsof -iTCP:"$port" -sTCP:LISTEN &>/dev/null
    fi
}

_kill_port() {
    local port=$1
    local pids
    if command -v lsof &>/dev/null; then
        pids=$(lsof -ti TCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
    elif command -v ss &>/dev/null; then
        pids=$(ss -tlnp 2>/dev/null | grep ":${port} " | grep -oP 'pid=\K[0-9]+' || true)
    elif command -v fuser &>/dev/null; then
        pids=$(fuser "$port/tcp" 2>/dev/null || true)
    fi
    if [[ -n "$pids" ]]; then
        for pid in $pids; do
            echo "    Killing pid $pid on port $port"
            kill -TERM "$pid" 2>/dev/null || true
        done
        sleep 1
        for pid in $pids; do
            kill -0 "$pid" 2>/dev/null && kill -KILL "$pid" 2>/dev/null || true
        done
    fi
}

_http_ok() {
    curl -sI --max-time 2 "http://localhost:$1/" >/dev/null 2>&1
}

# ── Start ─────────────────────────────────────────────────────────────

do_start() {
    _ensure_dirs
    local port
    port="$(_effective_port)"

    if _is_running; then
        local pid
        pid=$(<"$(_pidfile)")
        echo "  ● $SVC_NAME (port $port) — already running (pid $pid)"
        return 0
    fi

    if _port_in_use "$port"; then
        echo "  ⚠ Port $port in use — killing existing process..."
        _kill_port "$port"
        sleep 1
        if _port_in_use "$port"; then
            echo "  ✗ $SVC_NAME (port $port) — could not free port"
            return 1
        fi
        echo "  ✓ Port $port freed"
    fi

    # Production mode: build dist/ if missing
    if ! $DEV_MODE; then
        if [[ ! -d "$PROJECT_DIR/dist" ]]; then
            echo "  ↻ Building production bundle (dist/ not found)..."
            (cd "$PROJECT_DIR" && npm run build >> "$(_logfile)" 2>&1)
        fi
    fi

    local start_cmd
    $DEV_MODE && start_cmd="vite --port $port --host 0.0.0.0" || start_cmd="vite preview --port $port --host 0.0.0.0"

    local logfile
    logfile="$(_logfile)"

    (
        cd "$PROJECT_DIR"
        nohup npx $start_cmd >> "$logfile" 2>&1 &
        echo $! > "$(_pidfile)"
    )
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting $SVC_NAME ($start_cmd)" >> "$(_logfile)" 2>/dev/null || true

    local waited=0
    while ! _is_running && (( waited < 8 )); do
        sleep 1
        (( waited++ )) || true
    done

    if _is_running; then
        local pid
        pid=$(<"$(_pidfile)")
        local mode_label
        $DEV_MODE && mode_label="dev" || mode_label="preview"
        echo "  ● $SVC_NAME (port $port, $mode_label) — started (pid $pid)"
        echo "    Log: $logfile"
    else
        echo "  ✗ $SVC_NAME (port $port) — failed to start"
        echo "    Check: $logfile"
        rm -f "$(_pidfile)"
        return 1
    fi
}

# ── Stop ──────────────────────────────────────────────────────────────

do_stop() {
    local port
    port="$(_effective_port)"

    if ! _is_running; then
        echo "  ○ $SVC_NAME — not running"
        return 0
    fi

    local pid
    pid=$(<"$(_pidfile)")

    # Kill entire process group so Vite child processes don't become orphans
    local pgid
    pgid=$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ' || true)
    if [[ -n "$pgid" && "$pgid" != "0" && "$pgid" != "$pid" ]]; then
        kill -TERM -- "-$pgid" 2>/dev/null || true
    fi
    kill -TERM "$pid" 2>/dev/null || true

    # Wait up to 5 seconds for clean exit, then force
    local waited=0
    while kill -0 "$pid" 2>/dev/null && (( waited < 5 )); do
        sleep 1
        (( waited++ )) || true
    done
    kill -0 "$pid" 2>/dev/null && kill -KILL "$pid" 2>/dev/null || true

    rm -f "$(_pidfile)"
    echo "  ○ $SVC_NAME (port $port) — stopped (was pid $pid)"
}

# ── Status ────────────────────────────────────────────────────────────

do_status() {
    local port
    port="$(_effective_port)"

    echo "GAC Bartender Service"
    echo "────────────────────────────────────────"

    if _is_running; then
        local pid
        pid=$(<"$(_pidfile)")
        local http_status
        _http_ok "$port" && http_status="✓ http ok" || http_status="✗ http not ready"
        local mode_label
        $DEV_MODE && mode_label="dev" || mode_label="preview"
        local host_ip
        host_ip=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "?")
        printf "  ● %-18s pid %-8s %s (%s)\n" "$SVC_NAME" "$pid" "$http_status" "$mode_label"
        echo "    http://localhost:$port/"
        echo "    http://$host_ip:$port/"
    else
        printf "  ○ %-18s port %-6s %s\n" "$SVC_NAME" "$port" "not running"
    fi

    echo ""
    echo "Build:"
    if [[ -d "$PROJECT_DIR/dist" ]]; then
        local build_time
        build_time=$(stat -c '%y' "$PROJECT_DIR/dist/index.html" 2>/dev/null | cut -d. -f1 || echo "unknown")
        echo "  dist/ present — built $build_time"
    else
        echo "  dist/ not found — will be built automatically on start"
    fi

    echo ""
    echo "Config: PORT=$PORT  (set in .env)"
    echo "Logs:   $(_logfile)"
}

# ── Restart ───────────────────────────────────────────────────────────

do_restart() {
    echo "Stopping $SVC_NAME..."
    do_stop
    echo ""
    echo "Starting $SVC_NAME..."
    do_start
}

# ── Logs ──────────────────────────────────────────────────────────────

do_logs() {
    local logfile
    logfile="$(_logfile)"
    if [[ -f "$logfile" ]]; then
        echo "==> $logfile <=="
        tail -f "$logfile"
    else
        echo "No log file at: $logfile"
        echo "Start the service first: ./gac_bartender.sh start"
        exit 1
    fi
}

# ── Rebuild ───────────────────────────────────────────────────────────

do_rebuild() {
    echo "Running full build (data pipeline + Vite)..."
    (cd "$PROJECT_DIR" && npm run build)
    echo ""
    echo "Done. Run './gac_bartender.sh restart' to serve the new build."
}

# ── Main ──────────────────────────────────────────────────────────────

CMD="${1:-}"

case "$CMD" in
    start)   echo "Starting GAC Bartender...";   do_start ;;
    stop)    echo "Stopping GAC Bartender...";   do_stop ;;
    restart) echo "Restarting GAC Bartender..."; do_restart ;;
    status)  do_status ;;
    logs)    do_logs ;;
    rebuild) do_rebuild ;;
    *)
        echo "GAC Bartender — Cocktail Recipe PWA"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|rebuild} [--dev]"
        echo ""
        echo "Commands:"
        echo "  start    Build (if needed) and start the preview server"
        echo "  stop     Stop the running server"
        echo "  restart  Stop then start"
        echo "  status   Show PID, port, HTTP health, and build info"
        echo "  logs     Tail the service log (Ctrl+C to exit)"
        echo "  rebuild  Re-run full build: data pipeline + vite build"
        echo ""
        echo "Flags:"
        echo "  --dev    Use Vite dev server (port 5173) instead of production preview"
        echo ""
        echo "Config:   PORT=$PORT  (set PORT= in .env to change)"
        echo "Logs:     $LOG_DIR/"
        exit 1
        ;;
esac
