# BugStriker PowerShell Runner for Windows
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  BugStriker - Adaptive Code Debugging Agent" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check .env
$EnvFile = Join-Path $ScriptDir ".env"
$EnvExample = Join-Path $ScriptDir ".env.example"

if (-not (Test-Path $EnvFile)) {
    if (Test-Path $EnvExample) {
        Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
        Copy-Item $EnvExample $EnvFile
    } else {
        Write-Host "ERROR: Neither .env nor .env.example found!" -ForegroundColor Red
        exit 1
    }
}

# 2. Check Python
$PythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $PythonCmd) {
    Write-Host "ERROR: Python is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 3. Backend directory
$BackendDir = Join-Path $ScriptDir "backend"
Set-Location $BackendDir

Write-Host "Starting BugStriker server on http://localhost:8000 ..." -ForegroundColor Green
Write-Host ""
Write-Host "  Web App:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Health:   http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
