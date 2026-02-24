@echo off
REM Deployment script for Ascendra Installer (Windows)

echo ================================================================
echo    Ascendra Installer - Starting Services
echo ================================================================
echo.

REM Check dependencies
echo Checking dependencies...

if not exist backend\node_modules (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist ui\node_modules (
    echo Installing frontend dependencies...
    cd ui
    call npm install
    cd ..
)

echo Dependencies ready
echo.

REM Check environment files
if not exist backend\.env (
    echo Warning: backend\.env not found
    echo Creating from .env.example...
    copy backend\.env.example backend\.env
    echo.
    echo Please edit backend\.env and set:
    echo    - TYR_GHCR_USERNAME
    echo    - TYR_GHCR_PASSWORD
    echo.
)

if not exist ui\.env (
    echo Creating frontend .env...
    cd ui
    (
        echo VITE_API_URL=http://localhost:3001
        echo VITE_WS_URL=ws://localhost:3001
    ) > .env
    cd ..
)

REM Clear previous wizard state so the UI starts fresh
if exist backend\state\wizard-state.json (
    del /q backend\state\wizard-state.json
    echo Cleared previous wizard state
)

REM Start backend
echo Starting backend on port 3001...
cd backend
start "Ascendra Backend" /MIN cmd /c "npm start > ..\backend.log 2>&1"
cd ..

REM Wait for backend
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

REM Start frontend
echo Starting frontend on port 5173...
cd ui
start "Ascendra Frontend" /MIN cmd /c "npm run dev > ..\frontend.log 2>&1"
cd ..

REM Wait for frontend
echo Waiting for frontend to start...
timeout /t 5 /nobreak > nul

echo.
echo ================================================================
echo    Ascendra Installer is running!
echo ================================================================
echo.
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo   Backend logs:  type backend.log
echo   Frontend logs: type frontend.log
echo.
echo To stop services:
echo   run: stop.bat
echo.
echo Opening browser...
start http://localhost:5173
echo.
pause
