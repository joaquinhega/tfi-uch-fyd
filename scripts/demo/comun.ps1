$ErrorActionPreference = "Stop"
if ($PSVersionTable.PSVersion.Major -lt 7) { throw "Estos scripts requieren PowerShell 7 (pwsh)." }

$Raiz = (Resolve-Path "$PSScriptRoot\..\..").Path
Set-Location $Raiz
$Gw = "http://127.0.0.1:8080/api/v1"
$script:Fallas = 0

$Cfg = @{}
Get-Content "$Raiz\.env" | Where-Object { $_ -match '^\s*([^#=]+)=(.*)$' } |
  ForEach-Object { $Cfg[$matches[1].Trim()] = $matches[2].Trim() }

function Titulo([string]$Texto) { Write-Host "`n=== $Texto ===" -ForegroundColor Cyan }
function Paso([string]$Texto) { Write-Host "  - $Texto" -ForegroundColor DarkGray }

function Verificar([string]$Nombre, [bool]$Condicion, [string]$Detalle = "") {
  if ($Condicion) {
    Write-Host "  [OK]    $Nombre" -ForegroundColor Green
  } else {
    $script:Fallas++
    Write-Host "  [FALLA] $Nombre $Detalle" -ForegroundColor Red
  }
}

function Resultado {
  if ($script:Fallas -eq 0) {
    Write-Host "`nRESULTADO: OK" -ForegroundColor Green
    exit 0
  }
  Write-Host "`nRESULTADO: $($script:Fallas) verificacion(es) fallaron" -ForegroundColor Red
  exit 1
}

# Siempre a través del Gateway
function Llamar {
  param([string]$Metodo, [string]$Ruta, $Cuerpo = $null, [string]$Token = $null)
  $headers = @{}
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }
  $params = @{ Method = $Metodo; Uri = "$Gw$Ruta"; Headers = $headers; SkipHttpErrorCheck = $true }
  if ($null -ne $Cuerpo) {
    $params.Body = ($Cuerpo | ConvertTo-Json -Depth 5)
    $params.ContentType = "application/json"
  }
  $r = Invoke-WebRequest @params
  $json = $null
  if ($r.Content -and "$($r.Headers['Content-Type'])" -match "json") { $json = $r.Content | ConvertFrom-Json }
  [pscustomobject]@{ Status = [int]$r.StatusCode; Body = $json; CorrelationId = "$($r.Headers['X-Correlation-ID'])" }
}

function Token([string]$Email, [string]$Password) {
  $r = Llamar POST "/auth/login" @{ email = $Email; password = $Password }
  if ($r.Status -ne 200) { throw "No se pudo iniciar sesión con $Email (status $($r.Status))" }
  $r.Body.access_token
}
function TokenCliente { Token $Cfg.SEED_CLIENTE_EMAIL $Cfg.SEED_CLIENTE_PASSWORD }
function TokenAdmin { Token $Cfg.SEED_ADMIN_EMAIL $Cfg.SEED_ADMIN_PASSWORD }

function EsperarPedido([string]$Id, [string]$TokenUsuario, [int]$Segundos = 30) {
  for ($i = 0; $i -lt $Segundos; $i++) {
    $r = Llamar GET "/pedidos/$Id" -Token $TokenUsuario
    if ($r.Body.estado -notin @("EN_ESPERA", "PENDIENTE")) { return $r.Body }
    Start-Sleep -Seconds 1
  }
  return $r.Body
}

# Stock real (sin caché)
function StockReal([int]$ArticuloId) {
  $codigo = "from app.db import SessionLocal; from app.models import Articulo; print(SessionLocal().get(Articulo, $ArticuloId).stock)"
  [int](docker compose exec -T stock-service python -c $codigo)
}

# Log Aggregation: logs de todos los servicios por ID de correlación
function LogsDe([string]$CorrelationId) {
  docker compose logs --no-color --no-log-prefix 2>$null |
    Where-Object { $_ -match [regex]::Escape($CorrelationId) } |
    ForEach-Object { try { $_ | ConvertFrom-Json } catch { $null } } |
    Where-Object { $_ } |
    Sort-Object { [datetime]$_.ts }
}

function DecodificarBase64Url([string]$Texto) {
  $s = $Texto.Replace('-', '+').Replace('_', '/')
  switch ($s.Length % 4) { 2 { $s += '==' } 3 { $s += '=' } }
  [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s))
}

function CodificarBase64Url([string]$Texto) {
  [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Texto)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}