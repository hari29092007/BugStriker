@echo off
setlocal

echo =================================================
echo   BugStriker - Adaptive Code Debugging Agent
echo =================================================
echo.

set "SCRIPT_DIR=%~dp0"

if not exist "%SCRIPT_DIR%\.env" (
    if exist "%SCRIPT_DIR%\.env.example" (
        echo Creating .env from .env.example...
        copy "%SCRIPT_DIR%\.env.example" "%SCRIPT_DIR%\.env"
    )
)

cd /d "%SCRIPT_DIR%\backend"
echo Starting BugStriker server on http://localhost:8000 ...
echo.
echo   Web App:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Health:   http://localhost:8000/health
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
