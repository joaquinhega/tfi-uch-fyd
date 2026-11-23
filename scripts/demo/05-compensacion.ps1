. "$PSScriptRoot\comun.ps1"
$mouse = IdArticulo $CodMouse
Titulo "5. Compensación ante un fallo después de reservar (liberarStock)"

function CambiarFalla([string]$Valor) {
  (Get-Content .env) -replace '^FAULT_AFTER_RESERVE=.*', "FAULT_AFTER_RESERVE=$Valor" | Set-Content .env
  docker compose up -d --wait pedidos-service *> $null
}

$token = TokenCliente
$antes = StockReal $mouse
Paso "Stock de $CodMouse antes: $antes"
Paso "Activando la falla inyectada (FAULT_AFTER_RESERVE=true)..."
CambiarFalla "true"
try {
  $r = Llamar POST "/pedidos" @{ nombre_cliente = "Prueba compensación"; items = @(@{ articulo_id = $mouse; cantidad = 1 }) } -Token $token
  Verificar "El pedido se rechaza con ERROR_INTERNO_COMPENSADO (500)" ($r.Status -eq 500 -and $r.Body.motivo -eq "ERROR_INTERNO_COMPENSADO") "-> $($r.Status) $($r.Body.motivo)"

  $despues = StockReal $mouse
  Paso "Stock de $CodMouse después: $despues"
  Verificar "El stock volvió a su valor original" ($despues -eq $antes) "-> antes $antes, después $despues"

  Start-Sleep -Milliseconds 500
  Paso "Pasos registrados para este pedido:"
  LogsDe $r.CorrelationId | ForEach-Object { Paso "   [$($_.service)] $($_.msg)" }
} finally {
  Paso "Desactivando la falla inyectada..."
  CambiarFalla "false"
}

Resultado