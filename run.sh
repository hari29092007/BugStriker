#!/usr/bin/env bash
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Colour

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── 1. Check for .env ─────────────────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo -e "${RED}ERROR: .env file not found.${NC}"
  echo ""
  echo "Please create a .env file before running BugStriker:"
  echo ""
  echo "  cp $SCRIPT_DIR/.env.example $SCRIPT_DIR/.env"
  echo ""
  echo "Then edit .env and fill in your SUPABASE_URL, SUPABASE_ANON_KEY,"
  echo "SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, and SECRET_KEY."
  exit 1
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  🐛 BugStriker — Adaptive Code Debugging Agent  ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 2. Python dependencies ────────────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Installing Python dependencies...${NC}"
if [ -d "$SCRIPT_DIR/.venv" ]; then
  # Activate existing virtual environment
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/.venv/bin/activate"
  pip install --quiet -r "$SCRIPT_DIR/backend/requirements.txt"
elif [ -d "$SCRIPT_DIR/venv" ]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/venv/bin/activate"
  pip install --quiet -r "$SCRIPT_DIR/backend/requirements.txt"
else
  pip install --quiet -r "$SCRIPT_DIR/backend/requirements.txt"
fi
echo -e "${GREEN}  ✓ Python dependencies installed.${NC}"

# ── 3. Node dependencies ──────────────────────────────────────────────────────
echo -e "${YELLOW}[2/4] Installing Node dependencies...${NC}"
(cd "$SCRIPT_DIR/frontend" && npm install --silent)
echo -e "${GREEN}  ✓ Node dependencies installed.${NC}"

# ── 4. Start backend (uvicorn) in background ──────────────────────────────────
echo -e "${YELLOW}[3/4] Starting backend on port 8000...${NC}"
(
  cd "$SCRIPT_DIR/backend"
  # Load .env into the backend process environment
  set -a
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/.env"
  set +a
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload >> "$SCRIPT_DIR/backend.log" 2>&1
) &
BACKEND_PID=$!
echo -e "${GREEN}  ✓ Backend started (PID: $BACKEND_PID). Logs → backend.log${NC}"

# ── 5. Start frontend (Vite) ──────────────────────────────────────────────────
echo -e "${YELLOW}[4/4] Starting frontend on port 5173...${NC}"
(
  cd "$SCRIPT_DIR/frontend"
  npm run dev -- --host 0.0.0.0 --port 5173 >> "$SCRIPT_DIR/frontend.log" 2>&1
) &
FRONTEND_PID=$!
echo -e "${GREEN}  ✓ Frontend started (PID: $FRONTEND_PID). Logs → frontend.log${NC}"

# ── 6. Print URLs ─────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  🌐 Frontend  →  ${GREEN}http://localhost:5173${NC}"
echo -e "  ⚙️  Backend   →  ${GREEN}http://localhost:8000${NC}"
echo -e "  📄 API Docs  →  ${GREEN}http://localhost:8000/docs${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop both services."
echo ""

# ── 7. Wait for Ctrl+C and clean up ──────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down BugStriker...${NC}"
  kill "$BACKEND_PID" 2>/dev/null || true
  kill "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo -e "${GREEN}All services stopped. Goodbye!${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Block until a signal is received
wait
