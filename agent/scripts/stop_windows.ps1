# Windows PowerShell Shutdown Script for Yerwada BMS Monitoring Agent
$ErrorActionPreference = "SilentlyContinue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$agentDir = Split-Path -Parent $scriptDir

$pidFile = Join-Path $agentDir "agent.pid"

if (Test-Path $pidFile) {
    $agentPid = Get-Content $pidFile
    $proc = Get-Process -Id $agentPid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping BMS Monitoring Agent (PID: $agentPid)..." -ForegroundColor Yellow
        Stop-Process -Id $agentPid -Force
        Start-Sleep -Milliseconds 500
        Write-Host "✓ BMS Monitoring Agent stopped." -ForegroundColor Green
    } else {
        Write-Host "Process $agentPid not found. Cleaning stale PID file." -ForegroundColor DarkGray
    }
    Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "BMS Monitoring Agent is not running." -ForegroundColor Yellow
}
