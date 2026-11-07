. "$PSScriptRoot\comun.ps1"
Titulo "2. Acceso sin token o con token inválido (API Gateway, TP3 §5)"
$tokenCliente = TokenCliente

$r = Llamar GET "/pedidos"
Verificar "Sin token -> 401" ($r.Status -eq 401) "-> $($r.Status)"

$r = Llamar GET "/pedidos" -Token ($tokenCliente + "x")
Verificar "Token alterado (firma inválida) -> 401" ($r.Status -eq 401) "-> $($r.Status)"

# Token falsificado: se cambia el rol a ADMIN y se declara 'sin firma' (alg: none)
$partes = $tokenCliente.Split(".")
$datos = DecodificarBase64Url $partes[1] | ConvertFrom-Json
$datos.rol = "ADMIN"
$falso = (CodificarBase64Url '{"alg":"none","typ":"JWT"}') + "." + (CodificarBase64Url ($datos | ConvertTo-Json -Compress)) + "."
$r = Llamar GET "/auth/usuarios" -Token $falso
Verificar "Token falsificado con rol ADMIN y sin firma -> 401" ($r.Status -eq 401) "-> $($r.Status)"

$r = Llamar PUT "/stock/articulos/1" @{ precio = 1 } -Token $tokenCliente
Verificar "Rol insuficiente (cliente en operación de admin) -> 403" ($r.Status -eq 403) "-> $($r.Status)"

$r = Llamar POST "/stock/reservas" @{ id_pedido = "x"; items = @(@{ articulo_id = 1; cantidad = 1 }) }
Verificar "Ruta interna (reservarStock) no publicada -> 404" ($r.Status -eq 404) "-> $($r.Status)"

Resultado