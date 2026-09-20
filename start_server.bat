@echo off
title New Sunshine Public School - Portal Launcher (Offline-First / Hybrid)
echo =====================================================================
echo   NEW SUNSHINE PUBLIC SCHOOL RESULT MANAGEMENT PORTAL
echo   Session 2026-27 | 100%% Offline-First ^& Hybrid Deployable
echo =====================================================================
echo.

echo [1/2] Starting Local Backend API Server (0.0.0.0:8000)...
start "NSPS Backend API" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting Frontend Portal (0.0.0.0:5173)...
start "NSPS Frontend UI" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo =====================================================================
echo  SERVER LAUNCHED SUCCESSFULLY! (Zero Internet Required)
echo.
echo  * This Computer (Localhost):  http://localhost:5173
echo  * School LAN / Wi-Fi Access:   http://[YOUR_IP_ADDRESS]:5173
echo  * Backend API Swagger Docs:   http://localhost:8000/docs
echo =====================================================================
pause
