param(
    [Parameter(Position=0)][string]$Mode,
    [Parameter(Position=1)][string]$Service = "",
    [Parameter(Position=2)][string]$Action = "up",
    [switch]$Build,
    [switch]$Volumes
)

$ComposeDir = [System.IO.Path]::Combine($PSScriptRoot, "..", "compose")
$BuildFlag = if ($Build) { "--build" } else { "" }
$VolumesFlag = if ($Volumes) { "-v" } else { "" }

function Show-Usage {
    Write-Host @"
Usage:
  .\panenku.ps1 dev [up|down|down -v|ps|logs] [-Build]
  .\panenku.ps1 distributed <web|db|be> [up|down|down -v|ps|logs] [-Build]
"@
    exit 1
}

if (-not $Mode) { Show-Usage }

$EnvFile = ""
$ComposeFile = ""
$WatchFlag = ""

switch ($Mode) {
    "dev" {
        if ($Service) { $Action = $Service; $Service = "" }
        $EnvFile = [System.IO.Path]::Combine($PSScriptRoot, "..", ".env.local")
        $ComposeFile = [System.IO.Path]::Combine($ComposeDir, "compose.yml")
        if ($Action -eq "up") { $WatchFlag = "--watch" }
    }
    "distributed" {
        if (-not $Service) { Write-Host "Error: specify service (web|db|be)"; Show-Usage }
        $EnvFile = [System.IO.Path]::Combine($PSScriptRoot, "..", ".env.distributed")

        switch ($Service) {
            "web"   { $ComposeFile = [System.IO.Path]::Combine($ComposeDir, "compose.proxy.yml") }
            "db"    { $ComposeFile = [System.IO.Path]::Combine($ComposeDir, "compose.db.yml") }
            "be"    { $ComposeFile = [System.IO.Path]::Combine($ComposeDir, "compose.backend.yml") }
            default { Write-Host "Error: unknown service '$Service'"; Show-Usage }
        }

        if ($Action -eq "up" -and $Service -eq "be") {
            $WatchFlag = "--watch"
        }
    }
    default { Show-Usage }
}

switch ($Action) {
    "up" {
        $DetachFlag = if ($WatchFlag) { "" } else { "-d" }
        $cmd = "docker compose -f $ComposeFile --env-file $EnvFile up $DetachFlag $BuildFlag $WatchFlag"
        Write-Host "→ $cmd"
        Invoke-Expression $cmd
    }
    "down" {
        $cmd = "docker compose -f $ComposeFile --env-file $EnvFile down $VolumesFlag"
        Write-Host "→ $cmd"
        Invoke-Expression $cmd
    }
    "ps" {
        $cmd = "docker compose -f $ComposeFile --env-file $EnvFile ps"
        Write-Host "→ $cmd"
        Invoke-Expression $cmd
    }
    "logs" {
        $cmd = "docker compose -f $ComposeFile --env-file $EnvFile logs -f"
        Write-Host "→ $cmd"
        Invoke-Expression $cmd
    }
    default { Show-Usage }
}
