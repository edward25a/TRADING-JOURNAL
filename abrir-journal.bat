@echo off
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  start "TRADING J Server" /min python -m http.server 8000 --bind 127.0.0.1
  timeout /t 2 >nul
  start "" http://127.0.0.1:8000/index.html
  exit /b
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "TRADING J Server" /min py -m http.server 8000 --bind 127.0.0.1
  timeout /t 2 >nul
  start "" http://127.0.0.1:8000/index.html
  exit /b
)

start "" "%~dp0index.html"
