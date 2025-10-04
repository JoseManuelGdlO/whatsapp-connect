@echo off
echo ========================================
echo Restarting WhatsApp API (Cleaned Structure)
echo ========================================
echo.

echo [1/3] Stopping any running API processes...
taskkill /f /im node.exe 2>nul

echo [2/3] Waiting 2 seconds...
timeout /t 2 /nobreak > nul

echo [3/3] Starting WhatsApp API...
echo.
echo API will start at: http://localhost:3000
echo Cleanup endpoint is now available!
echo Press Ctrl+C to stop the API
echo.

npm start

pause
