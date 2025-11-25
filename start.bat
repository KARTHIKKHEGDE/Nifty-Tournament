@echo off
echo ========================================
echo   Nifty Options Trading Platform
echo   Quick Start Script
echo ========================================
echo.

echo Choose an option:
echo.
echo 1. Start with Docker (Recommended)
echo 2. Start Backend only (Local)
echo 3. Start Frontend only (Local)
echo 4. Start Both Backend and Frontend (Local)
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto docker
if "%choice%"=="2" goto backend
if "%choice%"=="3" goto frontend
if "%choice%"=="4" goto both
if "%choice%"=="5" goto end

:docker
echo.
echo Starting all services with Docker...
docker-compose up -d
echo.
echo Services started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
pause
goto end

:backend
echo.
echo Starting Backend...
cd backend
call venv\Scripts\activate.bat
echo Backend virtual environment activated
echo Starting FastAPI server...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
goto end

:frontend
echo.
echo Starting Frontend...
cd frontend
echo Starting Next.js development server...
npm run dev
goto end

:both
echo.
echo Starting Backend and Frontend...
echo.
echo Opening Backend in new window...
start cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
echo.
echo Opening Frontend in new window...
start cmd /k "cd frontend && npm run dev"
echo.
echo Both services starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause
goto end

:end
echo.
echo Goodbye!
