@echo off
echo Starting SmartPOS AI Frontend...
cd /d x:\smartpos-ai\frontend
echo Installing dependencies if needed...
npm install
echo Starting development server...
npm run dev
pause


