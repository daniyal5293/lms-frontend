
@echo off
title LMS Portal - Frontend Server

cd /d "%~dp0"

echo ==========================================
echo       LMS Portal Frontend Launcher
echo ==========================================
echo.

REM Check for package.json
if not exist package.json (
    echo ERROR: package.json not found.
    pause
    exit /b 1
)

REM Stop an existing process on port 3000
echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
    echo Stopping existing process %%a...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Installing npm dependencies...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo.
echo Starting Next.js frontend...
echo.

call npm run dev

echo.
echo Frontend stopped or exited with an error.
pause
