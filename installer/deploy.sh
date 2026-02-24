#!/bin/bash

# Deployment script for Ascendra Installer
# Starts both backend and frontend

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Ascendra Installer - Starting Services                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if node_modules exist
echo -e "${BLUE}Checking dependencies...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

if [ ! -d "ui/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd ui
    npm install
    cd ..
fi

echo -e "${GREEN}✓ Dependencies ready${NC}"
echo ""

# Check environment files
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Warning: backend/.env not found${NC}"
    echo "Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo ""
    echo "⚠️  Please edit backend/.env and set:"
    echo "   - TYR_GHCR_USERNAME"
    echo "   - TYR_GHCR_PASSWORD"
    echo ""
fi

if [ ! -f "ui/.env" ]; then
    echo "Creating frontend .env..."
    cat > ui/.env << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
EOF
fi

# Clear previous wizard state so the UI starts fresh
WIZARD_STATE="backend/state/wizard-state.json"
if [ -f "$WIZARD_STATE" ]; then
    rm -f "$WIZARD_STATE"
    echo -e "${GREEN}✓ Cleared previous wizard state${NC}"
fi

# Start services
echo -e "${BLUE}Starting services...${NC}"
echo ""

# Start backend in background
echo "Starting backend on port 3001..."
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -n "Waiting for backend to start"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓ Backend ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Start frontend in background
echo ""
echo "Starting frontend on port 5173..."
cd ui
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo -n "Waiting for frontend to start"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓ Frontend ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Ascendra Installer is running!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo ""
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "  Backend logs:  tail -f backend.log"
echo "  Frontend logs: tail -f frontend.log"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  or run: ./stop.sh"
echo ""
echo "Open your browser: http://localhost:5173"
echo ""

# Save PIDs for stop script
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid
