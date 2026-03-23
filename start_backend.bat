@echo off
echo Starting SmartPOS AI Backend...
cd /d %~dp0backend
echo Installing dependencies if needed...
pip install -r requirements.txt >nul 2>&1
echo Starting FastAPI server...
python main.py
pause





