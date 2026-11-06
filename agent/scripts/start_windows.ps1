# Windows PowerShell Startup Script for Yerwada BMS Monitoring Agent
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$agentDir = Split-Path -Parent $scriptDir
$projectRoot = Split-Path -Parent $agentDir

Set-Location $agentDir

$pidFile = Join-Path $agentDir "agent.pid"
$logFile = Join-Path $agentDir "agent.log"
$tokenFile = Join-Path $agentDir "pairing_token.txt"

# Check if already running
if (Test-Path $pidFile) {
    $oldPid = Get-Content $pidFile
    $proc = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "BMS Monitoring Agent is already running (PID: $oldPid)." -ForegroundColor Yellow
        if (Test-Path $tokenFile) {
            Get-Content $tokenFile
        }
        exit 0
    }
}

# Ensure Python virtual environment
$venvPython = Join-Path $agentDir "venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "Creating Python virtual environment in $agentDir\venv..." -ForegroundColor Cyan
    python -m venv venv
    & "$agentDir\venv\Scripts\pip.exe" install --upgrade pip | Out-Null
    & "$agentDir\venv\Scripts\pip.exe" install -r requirements.txt
}

Write-Host "Starting Yerwada BMS Local Host Monitoring Agent on 127.0.0.1:8765..." -ForegroundColor Green

$env:PYTHONPATH = "$projectRoot;$env:PYTHONPATH"

# Start agent in background process
$pinfo = New-Object System.Diagnostics.ProcessStartInfo
$pinfo.FileName = $venvPython
$pinfo.Arguments = "-m agent.main"
$pinfo.WorkingDirectory = $agentDir
$pinfo.RedirectStandardOutput = $true
$pinfo.RedirectStandardError = $true
$pinfo.UseShellExecute = $false
$pinfo.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $pinfo
$process.Start() | Out-Null

$process.Id | Out-File -FilePath $pidFile -Encoding ascii

Start-Sleep -Seconds 2

if (-not $process.HasExited) {
    Write-Host "✓ BMS Monitoring Agent started successfully (PID: $($process.Id))." -ForegroundColor Green
    Write-Host "  Endpoint    : http://127.0.0.1:8765"
    Write-Host "  Loopback    : 127.0.0.1 only (Zero public exposure)"
    Write-Host ""
    if (Test-Path $tokenFile) {
        Get-Content $tokenFile
    }
} else {
    Write-Host "✗ Agent process failed to start." -ForegroundColor Red
    exit 1
}
