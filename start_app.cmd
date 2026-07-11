@echo off
echo Starting StudyMed Application...

:: Start Backend
start "Backend" cmd /k "cd server && npm start"

:: Start Frontend
start "Frontend" cmd /k "cd client && npm run dev"

:: Wait a few seconds for the dev server to start
timeout /t 5

:: Open browser
start http://localhost:5173

echo Application started.