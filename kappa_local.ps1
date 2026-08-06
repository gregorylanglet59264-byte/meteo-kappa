param (
    [int]$DayOffset = 1,
    [switch]$SkipMaps,
    [switch]$SkipAI
)

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🌤️ EXECUTION LOCALE METEO KAPPA (100% AUTONOME)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ExportScript = Join-Path $ScriptDir "cnews\scripts\export_all_bulletins.py"

if (-not (Test-Path $ExportScript)) {
    $ExportScript = "C:\Users\grego\Documents\METEO_CLIMAT\meteo-kappa\cnews\scripts\export_all_bulletins.py"
}

$cmdArgs = @("--day-offset", $DayOffset)

if (-not $SkipMaps) {
    $cmdArgs += "--generate-maps"
}

if ($SkipAI) {
    $cmdArgs += "--skip-ai"
    Write-Host "ℹ️ Mode SkipAI active : L'appel API externe est desactive. Antigravity/fallback local gere les textes." -ForegroundColor Yellow
}

Write-Host "Lancement du script d'export..." -ForegroundColor Green
python $ExportScript $cmdArgs

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🎉 FIN DE L'EXECUTION ! AUTOMATISATION.json DISPONIBLE SUR VOTRE BUREAU !" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
