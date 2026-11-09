param([int]$Clientes = 50)
. "$PSScriptRoot\comun.ps1"
Titulo "3. $Clientes pedidos simultáneos por el último artículo (bloqueo pesimista)"

$tokenAdmin = TokenAdmin
$tokenCliente = TokenCliente

$r = Llamar PUT "/stock/articulos/5" @{ stock = 1 } -Token $tokenAdmin
Verificar "Preparación: artículo 5 con stock 1" ($r.Status -eq 200) "-> $($r.Status)"

Paso "Enviando $Clientes pedidos al mismo tiempo a través del Gateway..."
$gw = $Gw
$respuestas = 1..$Clientes | ForEach-Object -ThrottleLimit $Clientes -Parallel {
  $cuerpo = @{ nombre_cliente = "Concurrencia $_"; items = @(@{ articulo_id = 5; cantidad = 1 }) } | ConvertTo-Json -Depth 5
  $r = Invoke-WebRequest -Method POST -Uri "$($using:gw)/pedidos" -ContentType "application/json" -Body $cuerpo `
    -Headers @{ Authorization = "Bearer $($using:tokenCliente)" } -SkipHttpErrorCheck
  [pscustomobject]@{ Status = [int]$r.StatusCode; Pedido = ($r.Content | ConvertFrom-Json) }
}

$enEspera = @($respuestas | Where-Object Status -eq 202)
$finales = @($respuestas | Where-Object Status -ne 202 | ForEach-Object Pedido)
$finales += @($enEspera | ForEach-Object { EsperarPedido $_.Pedido.id $tokenCliente })
$aceptados = @($finales | Where-Object estado -eq "ACEPTADO").Count
$rechazados = @($finales | Where-Object estado -eq "RECHAZADO").Count
$stock = StockReal 5

Paso "Códigos HTTP: $(($respuestas | Group-Object Status | ForEach-Object { "$($_.Name) x $($_.Count)" }) -join ', ')"
Paso "Aceptados: $aceptados | Rechazados: $rechazados | Resueltos tras EN ESPERA: $($enEspera.Count)"
Paso "Stock final en la base: $stock"
Verificar "Exactamente 1 pedido aceptado" ($aceptados -eq 1) "-> $aceptados"
Verificar "Stock final 0 (sin sobreventa)" ($stock -eq 0) "-> $stock"

Llamar PUT "/stock/articulos/5" @{ stock = 1 } -Token $tokenAdmin | Out-Null
Paso "Artículo 5 restablecido a stock 1 para la próxima demo"

Resultado