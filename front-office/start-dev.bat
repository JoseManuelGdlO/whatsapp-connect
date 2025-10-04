@echo off
echo Starting WhatsApp API Frontend Development Environment
echo.

echo Starting WhatsApp API Backend...
cd api-whatsapp
start "WhatsApp API" cmd /k "npm start"
cd ..

echo Waiting 5 seconds for API to start...
timeout /t 5 /nobreak > nul

echo Starting Angular Frontend...
cd whatsapp-frontend
start "WhatsApp Frontend" cmd /k "npm start"
cd ..

echo.
echo Both servers are starting...
echo API: http://localhost:3000
echo Frontend: http://localhost:4200
echo.
echo Press any key to exit...
pause > nul
