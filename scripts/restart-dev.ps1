[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$stateDirectory = Join-Path $projectRoot '.dev'
$logDirectory = Join-Path $stateDirectory 'logs'
$stateFile = Join-Path $stateDirectory 'processes.json'

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

function Stop-ProcessTree {
    param([int]$ProcessId)

    if ($ProcessId -le 0 -or -not (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
        return
    }

    & taskkill.exe /PID $ProcessId /T /F 2>$null | Out-Null
}

function Test-ProjectProcess {
    param([int]$ProcessId)

    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    if (-not $process) {
        return $false
    }

    $commandLine = [string]$process.CommandLine
    $executablePath = [string]$process.ExecutablePath
    return $commandLine.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0 -or
           $executablePath.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -eq 0
}

function Stop-ListenerForProject {
    param([int]$Port)

    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
        $ownerId = [int]$listener.OwningProcess
        if (Test-ProjectProcess -ProcessId $ownerId) {
            Write-Host "Stopping project process on port $Port (PID $ownerId)..."
            Stop-ProcessTree -ProcessId $ownerId
        }
        else {
            throw "Port $Port is occupied by a process outside this project (PID $ownerId). Stop it manually and retry."
        }
    }
}

if (Test-Path -LiteralPath $stateFile) {
    try {
        $previousState = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
        @($previousState.frontendPid, $previousState.backendPid) |
            Where-Object { $_ } |
            ForEach-Object { Stop-ProcessTree -ProcessId ([int]$_) }
    }
    catch {
        Write-Warning "Could not read the previous process state: $($_.Exception.Message)"
    }
}

Stop-ListenerForProject -Port 3000
Stop-ListenerForProject -Port 5000

# Some hosts expose both "Path" and "PATH" in their environment block. Windows
# PowerShell 5.1's Start-Process treats those as duplicate dictionary keys.
$effectivePath = $env:Path
[Environment]::SetEnvironmentVariable('PATH', $null, 'Process')
[Environment]::SetEnvironmentVariable('Path', $null, 'Process')
[Environment]::SetEnvironmentVariable('Path', $effectivePath, 'Process')

$localDotnet = Join-Path $projectRoot '.dotnet\dotnet.exe'
$dotnetCommand = if (Test-Path -LiteralPath $localDotnet) { $localDotnet } else { 'dotnet' }
$backendProject = Join-Path $projectRoot 'src\GameScanner\DLSS5Manager.GameScanner.csproj'

$frontend = Start-Process `
    -FilePath 'npm.cmd' `
    -ArgumentList @('run', 'dev') `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDirectory 'frontend.log') `
    -RedirectStandardError (Join-Path $logDirectory 'frontend-error.log') `
    -PassThru

$backend = Start-Process `
    -FilePath $dotnetCommand `
    -ArgumentList @('run', '--project', $backendProject) `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDirectory 'backend.log') `
    -RedirectStandardError (Join-Path $logDirectory 'backend-error.log') `
    -PassThru

[ordered]@{
    frontendPid = $frontend.Id
    backendPid = $backend.Id
    startedAt = (Get-Date).ToString('o')
} | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding utf8

Start-Sleep -Seconds 2

if ($frontend.HasExited -or $backend.HasExited) {
    if (-not $frontend.HasExited) { Stop-ProcessTree -ProcessId $frontend.Id }
    if (-not $backend.HasExited) { Stop-ProcessTree -ProcessId $backend.Id }
    throw "A development service exited during startup. Check logs in $logDirectory"
}

Write-Host ''
Write-Host 'DLSS5-Manager restarted successfully.' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000'
Write-Host 'Backend:  http://localhost:5000'
Write-Host "Logs:     $logDirectory"
