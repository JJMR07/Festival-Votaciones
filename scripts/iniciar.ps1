$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$python = Join-Path (Get-Location) '.venv/Scripts/python.exe'
$pg = Join-Path (Get-Location) '.local/pgsql/bin/pg_ctl.exe'
$data = Join-Path (Get-Location) '.local/pgdata'
if (!(Test-Path $python) -or !(Test-Path $pg) -or !(Test-Path '.env')) {
    throw 'Falta la preparacion local: Python, PostgreSQL o .env.'
}
& $pg status -D $data *> $null
if ($LASTEXITCODE -ne 0) {
    & $pg start -D $data -l '.local/postgresql.log' -w -t 120
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar PostgreSQL. Consulta .local/postgresql.log.' }
}
& $python manage.py migrate --noinput
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron aplicar las migraciones.' }
# Compila si falta el resultado o se editaron fuentes/configuracion desde el ultimo build.
$manifest = Join-Path (Get-Location) 'static/frontend/.vite/manifest.json'
$sourceFiles = Get-ChildItem 'frontend/src' -Recurse -File
$sourceFiles += Get-Item 'frontend/vite.config.js','frontend/package.json','frontend/pnpm-lock.yaml'
$needsBuild = !(Test-Path $manifest)
if (!$needsBuild) { $needsBuild = [bool]($sourceFiles | Where-Object { $_.LastWriteTimeUtc -gt (Get-Item $manifest).LastWriteTimeUtc } | Select-Object -First 1) }
if ($needsBuild) { & (Join-Path $PSScriptRoot 'compilar-frontend.ps1') }
& $python manage.py check
if ($LASTEXITCODE -ne 0) { throw 'La comprobacion de Django fallo.' }
Write-Host 'Abre http://127.0.0.1:8000/ - Ctrl+C detiene Django.'
& $python manage.py runserver 127.0.0.1:8000
