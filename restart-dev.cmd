@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\restart-dev.ps1"
if errorlevel 1 (
  echo.
  echo Restart failed. See the message above.
  pause
  exit /b 1
)
endlocal
