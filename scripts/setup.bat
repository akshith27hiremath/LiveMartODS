@echo off
REM Live MART - Quick Setup Script for Windows
REM This script helps you set up the project quickly on Windows

echo ==========================================
echo   Live MART - Quick Setup Script
echo ==========================================
echo.

REM Check if Node.js is installed
echo Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% is installed

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION% is installed

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo [OK] Docker is installed: %DOCKER_VERSION%
    set DOCKER_AVAILABLE=1
) else (
    echo [INFO] Docker is not installed. You'll need to run services manually.
    set DOCKER_AVAILABLE=0
)

echo.
echo Setting up environment...

REM Create .env file if it doesn't exist
if not exist .env.development (
    echo Creating .env.development file...
    copy .env.example .env.development >nul
    echo [OK] Created .env.development
) else (
    echo [OK] .env.development already exists
)

REM Install server dependencies
echo.
echo Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install server dependencies
    pause
    exit /b 1
)
echo [OK] Server dependencies installed
cd ..

REM Install client dependencies
echo.
echo Installing client dependencies...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install client dependencies
    pause
    exit /b 1
)
echo [OK] Client dependencies installed
cd ..

REM Ask user if they want to use Docker
echo.
if %DOCKER_AVAILABLE% EQU 1 (
    set /p USE_DOCKER="Do you want to start services with Docker? (y/n): "
    if /i "%USE_DOCKER%"=="y" (
        echo Starting services with Docker...
        docker-compose -f docker\docker-compose.dev.yml up -d
        echo.
        echo ==========================================
        echo   Setup Complete! 🎉
        echo ==========================================
        echo.
        echo Services are running:
        echo   - Frontend: http://localhost:3000
        echo   - Backend:  http://localhost:5000
        echo   - MongoDB:  localhost:27017
        echo   - Redis:    localhost:6379
        echo.
        echo To view logs: docker-compose -f docker\docker-compose.dev.yml logs -f
        echo To stop:      docker-compose -f docker\docker-compose.dev.yml down
    ) else (
        goto MANUAL_SETUP
    )
) else (
    goto MANUAL_SETUP
)

goto END

:MANUAL_SETUP
echo.
echo ==========================================
echo   Setup Complete! 🎉
echo ==========================================
echo.
echo To start manually:
echo   1. Start MongoDB, Redis, and Elasticsearch
echo   2. In one terminal: cd server ^&^& npm run dev
echo   3. In another terminal: cd client ^&^& npm start
goto END

:END
echo.
echo For detailed setup instructions, see docs\SETUP_GUIDE.md
echo.
pause
