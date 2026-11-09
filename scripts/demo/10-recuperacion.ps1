. "$PSScriptRoot\comun.ps1"
Titulo "10. Recuperación: pedido EN ESPERA y reinicio de Pedidos"

$token = TokenCliente
Paso "Bloqueando el artículo 2 durante 8 s..."
$trabajo = Start-Job -WorkingDirectory $Raiz -ScriptBlock {
  Get-Content scripts/demo/bloquear-articulo.py -Raw | docker compose exec -T stock-service python -
}
$bloqueado = $false
for ($i = 0; $i -lt 20 -and -not $bloqueado; $i++) {
  Start-Sleep -Milliseconds 500
  $bloqueado = [bool]((Receive-Job $trabajo -Keep) -match "bloqueada")
}
Verificar "Fila del artículo 2 bloqueada" $bloqueado

$r = Llamar POST "/pedidos" @{ nombre_cliente = "Prueba recuperación"; items = @(@{ articulo_id = 2; cantidad = 1 }) } -Token $token
Verificar "El pedido queda EN_ESPERA (202)" ($r.Status -eq 202) "-> $($r.Status) $($r.Body.estado)"

Paso "Reiniciando Pedidos con el pedido sin resolver..."
docker compose restart pedidos-service *> $null
docker compose up -d --wait pedidos-service *> $null

$final = EsperarPedido $r.Body.id $token
Verificar "Tras el reinicio, el pedido se recupera y queda ACEPTADO" ($final.estado -eq "ACEPTADO") "-> $($final.estado)"
$recuperado = docker compose logs --no-color pedidos-service 2>$null | Select-String "recuperando pedido" | Select-String $r.Body.id
Verificar "El log registra la recuperación del pedido" ([bool]$recuperado)

Wait-Job $trabajo -Timeout 15 | Out-Null
Remove-Job $trabajo -Force

Resultado
