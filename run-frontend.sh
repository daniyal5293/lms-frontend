#!/usr/bin/env bash
# Stops any running dev server, then starts the frontend.

# ---- CONFIG (edit these) ----
FRONTEND_DIR="."        # folder containing package.json
PORT=5173                        # Vite = 5173, CRA/Next = 3000
# -----------------------------

echo "Stopping existing frontend on port $PORT..."

PIDS=$(lsof -ti tcp:"$PORT" 2>/dev/null)
if [ -n "$PIDS" ]; then
  kill -9 $PIDS 2>/dev/null
  echo "Killed PID(s): $PIDS"
fi

# Also stop any leftover dev-server processes
pkill -f "vite" 2>/dev/null

sleep 1

echo "Starting frontend..."
cd "$FRONTEND_DIR" || { echo "Folder not found: $FRONTEND_DIR"; exit 1; }
npm run dev
