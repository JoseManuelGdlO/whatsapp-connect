@echo off
echo ========================================
echo Restarting Frontend with Webhook Manager
echo ========================================
echo.

echo [1/4] Stopping any running processes...
taskkill /f /im node.exe 2>nul

echo [2/4] Cleaning Angular cache...
if exist .angular rmdir /s /q .angular
npx ng cache clean 2>nul

echo [3/4] Cleaning npm cache...
npm cache clean --force 2>nul

echo [4/4] Starting development server with Webhook Manager...
echo.
echo New Features Added:
echo - Webhook Management Interface
echo - Configure webhooks for each session
echo - Test webhook functionality
echo - Copy webhook URLs and examples
echo.
echo Server will start at: http://localhost:4200
echo Navigate to /webhooks to manage webhooks
echo Press Ctrl+C to stop the server
echo.

npx ng serve --port 4200 --host 0.0.0.0 --poll 2000

pause
