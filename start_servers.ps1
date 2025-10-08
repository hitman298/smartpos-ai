Write-Host "Starting SmartPOS AI Servers..." -ForegroundColor Green

Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd x:\smartpos-ai\backend; python simple_server.py"

Write-Host "Starting Frontend Server..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd x:\smartpos-ai\frontend; npm run dev"

Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can also open the test page: x:\smartpos-ai\test.html" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

