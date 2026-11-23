. "$PSScriptRoot\comun.ps1"
$teclado = IdArticulo $CodTeclado
Titulo "7. Modo degradado: pedido EN ESPERA"

$token = TokenCliente
Paso "Bloqueando $CodTeclado durante 8 s (simula otra compra larga en curso)..."
$trabajo = Start-Job -WorkingDirectory $Raiz -ArgumentList $teclado -ScriptBlock {
  param($id)
  Get-Content scripts/demo/bloquear-articulo.py -Raw | docker compose exec -T stock-service python - $id
}
$bloqueado = $false
for ($i = 0; $i -lt 20 -and -not $bloqueado; $i++) {
  Start-Sleep -Milliseconds 500
  $bloqueado = [bool]((Receive-Job $trabajo -Keep) -match "bloqueada")
}
Verificar "Fila de $CodTeclado bloqueada" $bloqueado

$inicio = Get-Date
$r = Llamar POST "/pedidos" @{ nombre_cliente = "Prueba en espera"; items = @(@{ articulo_id = $teclado; cantidad = 1 }) } -Token $token
Paso "Respuesta en $([int]((Get-Date) - $inicio).TotalMilliseconds) ms"
Verificar "Responde 202 EN_ESPERA al superar el plazo blando de 2 s" ($r.Status -eq 202 -and $r.Body.estado -eq "EN_ESPERA") "-> $($r.Status) $($r.Body.estado)"

Paso "Consultando el estado hasta que se libere el bloqueo..."
$final = EsperarPedido $r.Body.id $token
Verificar "Al liberarse el bloqueo, el pedido queda ACEPTADO" ($final.estado -eq "ACEPTADO") "-> $($final.estado)"

Wait-Job $trabajo -Timeout 15 | Out-Null
Remove-Job $trabajo -Force

Resultado