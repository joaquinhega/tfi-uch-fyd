# Levanta todo el sistema desde cero con un solo comando.
#   pwsh scripts/levantar.ps1           -> levanta (conserva los datos)
#   pwsh scripts/levantar.ps1 -Limpio   -> borra bases y volúmenes y arranca de cero
param([switch]$Limpio)
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot\..").Path

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Se creó .env a partir de .env.example (revisá las contraseñas de prueba)." -ForegroundColor Yellow
}

if (-not (Test-Path keys\jwt_private.pem)) {
  Write-Host "Generando el par de claves RS256..." -ForegroundColor DarkGray
  node scripts/generar-claves.mjs
  if ($LASTEXITCODE -ne 0) { throw "No se pudieron generar las claves (¿está instalado Node.js?)" }
}

if ($Limpio) {
  Write-Host "Borrando contenedores, bases y volúmenes..." -ForegroundColor Yellow
  docker compose down -v --remove-orphans
}

Write-Host "Construyendo y levantando (espera a que todo esté healthy)..." -ForegroundColor DarkGray
docker compose up -d --build --wait
if ($LASTEXITCODE -ne 0) { throw "Algún contenedor no llegó a healthy. Revisá: docker compose ps / docker compose logs" }

docker compose ps
$cfg = @{}
Get-Content .env | Where-Object { $_ -match '^\s*([^#=]+)=(.*)$' } | ForEach-Object { $cfg[$matches[1].Trim()] = $matches[2].Trim() }
Write-Host "`nSistema listo." -ForegroundColor Green
Write-Host "  Frontend: http://localhost:$($cfg.FRONTEND_PORT)"
Write-Host "  Gateway:  http://localhost:$($cfg.GATEWAY_PORT)/health"