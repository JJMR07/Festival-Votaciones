$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$nodeLocal = Join-Path $root '.local/node'
if (Test-Path (Join-Path $nodeLocal 'node.exe')) { $env:PATH = $nodeLocal + ';' + $env:PATH }
$pnpmLocal = Join-Path $root '.local/tools/pnpm.cmd'
if (Test-Path $pnpmLocal) { $pnpm = $pnpmLocal }
else {
    $command = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
    if (!$command) { throw 'Instala Node.js 24 y pnpm 11.25.0. Consulta README.md.' }
    $pnpm = $command.Source
}
Push-Location (Join-Path $root 'frontend')
try {
    & $pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias de React.' }
    & $pnpm run build
    if ($LASTEXITCODE -ne 0) { throw 'La compilacion de React fallo.' }
}
finally { Pop-Location }
