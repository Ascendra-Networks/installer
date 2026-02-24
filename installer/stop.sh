#!/bin/bash

# Stop script for Ascendra Installer

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Ascendra Installer - Stopping Services                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

STOPPED=0

# Stop backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        STOPPED=$((STOPPED + 1))
    fi
    rm .backend.pid
fi

# Stop frontend
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        STOPPED=$((STOPPED + 1))
    fi
    rm .frontend.pid
fi

# Also kill by port (fallback)
echo "Cleaning up any remaining processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo ""
if [ $STOPPED -gt 0 ]; then
    echo -e "${GREEN}✓ Services stopped${NC}"
else
    echo -e "${YELLOW}No services were running${NC}"
fi
echo ""

