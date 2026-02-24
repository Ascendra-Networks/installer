@echo off
REM Start script for Ascendra Installer Backend (Windows)

echo ================================================================
echo    Ascendra Installer Backend - Startup Script
echo ================================================================
echo.

REM Check if .env exists
if not exist .env (
    echo WARNING: .env file not found
    if exist .env.example (
        echo Creating .env from .env.example...
        copy .env.example .env
        echo Created .env file
        echo.
        echo WARNING: Please edit .env and configure:
        echo    - TYR_GHCR_USERNAME
        echo    - TYR_GHCR_PASSWORD
        echo.
        pause
    ) else (
        echo ERROR: .env.example not found
        exit /b 1
    )
)

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo Dependencies installed
    echo.
)

REM Check if Terraform is installed
echo Checking prerequisites...
where terraform >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Terraform not found in PATH
    echo Please install Terraform: https://www.terraform.io/downloads
    exit /b 1
) else (
    terraform version
)

REM Check if Ansible is installed
where ansible-playbook >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Ansible not found in PATH
    echo Please install Ansible: https://docs.ansible.com/ansible/latest/installation_guide/
    exit /b 1
) else (
    ansible --version
)

echo.
echo Starting backend server...
echo.

REM Start the server
call npm start


