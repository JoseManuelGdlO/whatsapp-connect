#!/bin/bash

echo "Starting WhatsApp API Frontend Development Environment"
echo

echo "Starting WhatsApp API Backend..."
cd api-whatsapp
npm start &
API_PID=$!
cd ..

echo "Waiting 5 seconds for API to start..."
sleep 5

echo "Starting Angular Frontend..."
cd whatsapp-frontend
npm start &
FRONTEND_PID=$!
cd ..

echo
echo "Both servers are starting..."
echo "API: http://localhost:3000"
echo "Frontend: http://localhost:4200"
echo
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo "Stopping servers..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for user to stop
wait
