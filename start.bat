@echo off
echo Starting SmartVenue AI Backend...
start cmd /k "cd backend && npm start"

echo Starting SmartVenue AI Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both services are starting up! Wait for the Next.js compilation to finish.
pause
