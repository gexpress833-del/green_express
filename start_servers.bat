@echo off
cd c:\SERVICE\backend
start "Backend Laravel" cmd /k "php artisan serve --port=8000"
timeout /t 3
cd c:\SERVICE\frontend-next
start "Frontend Next.js" cmd /k "npm run dev"
