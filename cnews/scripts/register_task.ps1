# ==========================================
# Windows Task Scheduler Registration Script
# ==========================================
#
# Ce script enregistre le script d'automatisation dans le Planificateur de Tâches Windows
# pour qu'il s'exécute automatiquement tous les jours à 6h00.
#
# Pour l'exécuter :
# 1. Ouvrez PowerShell en mode Administrateur.
# 2. Naviguez vers ce dossier.
# 3. Lancez : .\register_task.ps1

$scriptPath = "C:\Users\grego\Documents\DEV_DIVERS\cnews\scripts\run_auto_bulletin.bat"
$arguments = '--client "BULLETIN EUROPE1 à 6h" --day-offset 1'

# Action : exécuter le fichier .bat avec les arguments
$action = New-ScheduledTaskAction -Execute $scriptPath -Argument $arguments

# Déclencheur : tous les jours à 06:00 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 6:00AM

# Enregistrement de la tâche dans Windows
Register-ScheduledTask `
    -Action $action `
    -Trigger $trigger `
    -TaskName "CNews_Auto_Weather_Bulletin" `
    -Description "Génère et publie automatiquement le bulletin météo CNews Europe 1 sur Supabase tous les jours à 6h00." `
    -Force

Write-Host "✅ Tâche enregistrée avec succès dans le Planificateur de Tâches Windows !" -ForegroundColor Green
Write-Host "Nom de la tâche : CNews_Auto_Weather_Bulletin"
Write-Host "Fréquence : Tous les jours à 06h00"
