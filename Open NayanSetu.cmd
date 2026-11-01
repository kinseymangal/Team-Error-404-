@echo off
title NayanSetu - Local Screening Prototype
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 LTS from https://nodejs.org then run this file again.
  pause
  exit /b 1
)
if not exist "node_modules\express\package.json" (
  echo Installing project dependencies. Internet is needed for this first step.
  call npm.cmd ci --no-audit --no-fund
  if errorlevel 1 (
    echo Installation failed. See the message above.
    pause
    exit /b 1
  )
)
node scripts/launch.mjs
pause
