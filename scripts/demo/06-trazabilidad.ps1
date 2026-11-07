. "$PSScriptRoot\comun.ps1"
Titulo "6. Seguimiento de un pedido por ID de correlación (Log Aggregation)"

$token = TokenCliente
$r = Llamar POST "/pedidos" @{ nombre_cliente = "Prueba trazabilidad"; items = @(@{ articulo_id = 3; cantidad = 1 }) } -Token $token
Verificar "Pedido creado (201)" ($r.Status -eq 201) "-> $($r.Status)"
Paso "ID de correlación: $($r.CorrelationId)"

Start-Sleep -Milliseconds 500
$eventos = @(LogsDe $r.CorrelationId)
foreach ($e in $eventos) {
  Write-Host ("    {0}  {1,-8} {2}" -f ([datetime]$e.ts).ToLocalTime().ToString("HH:mm:ss.fff"), $e.service, $e.msg)
}

$servicios = @($eventos | ForEach-Object service | Sort-Object -Unique)
$faltan = @("gateway", "pedidos", "stock" | Where-Object { $_ -notin $servicios })
Verificar "El pedido aparece en los logs de gateway, pedidos y stock" ($faltan.Count -eq 0) "-> faltan: $($faltan -join ', ')"

Resultado