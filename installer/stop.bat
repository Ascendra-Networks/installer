@echo off
REM Stop script for Ascendra Installer (Windows)

echo ================================================================
echo    Ascendra Installer - Stopping Services
echo ================================================================
echo.

echo Stopping backend...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

echo Stopping frontend...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

REM Close minimized windows
taskkill /FI "WindowTitle eq Ascendra Backend" /F 2>nul
taskkill /FI "WindowTitle eq Ascendra Frontend" /F 2>nul

echo.
echo Services stopped
echo.
pause


