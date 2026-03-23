@echo off
echo ========================================
echo Starting SmartPOS AI Servers
echo ========================================
echo.

echo [1/2] Starting Backend Server on port 5000...
start "SmartPOS Backend" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server on port 5173...
start "SmartPOS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend API:  http://localhost:5000
echo Frontend App: http://localhost:5173
echo API Docs:     http://localhost:5000/docs
echo.
echo Note: MongoDB is optional - system works with fallback data
echo.
echo Press any key to exit this window...
echo (Servers will continue running in separate windows)
pause >nul

