. "$PSScriptRoot\comun.ps1"
Titulo "4. Circuit Breaker con Stock caído"
$fallos = [int]$Cfg.CB_FAIL_MAX
$espera = [int]$Cfg.CB_RESET_TIMEOUT_SECONDS

Paso "Apagando Stock..."
docker compose stop stock-service *> $null
try {
  for ($i = 1; $i -le $fallos; $i++) {
    $r = Llamar GET "/stock/catalogo"
    Paso "Catálogo, intento $i -> $($r.Status) $($r.Body.mensaje)"
  }
  $r = Llamar GET "/stock/catalogo"
  Verificar "Tras $fallos fallos el circuito se abre y responde al instante (503)" ($r.Status -eq 503 -and $r.Body.mensaje -match "circuito abierto") "-> $($r.Status) $($r.Body.mensaje)"

  $salud = Invoke-RestMethod "http://127.0.0.1:8080/health"
  Paso "Circuitos del Gateway: auth=$($salud.circuitos.auth) stock=$($salud.circuitos.stock) pedidos=$($salud.circuitos.pedidos)"
  Verificar "Solo el circuito de Stock está ABIERTO" ($salud.circuitos.stock -eq "ABIERTO" -and $salud.circuitos.auth -eq "CERRADO" -and $salud.circuitos.pedidos -eq "CERRADO")

  $login = Llamar POST "/auth/login" @{ email = $Cfg.SEED_CLIENTE_EMAIL; password = $Cfg.SEED_CLIENTE_PASSWORD }
  Verificar "Autenticación sigue funcionando (200)" ($login.Status -eq 200) "-> $($login.Status)"

  $r = Llamar POST "/pedidos" @{ nombre_cliente = "Prueba CB"; items = @(@{ articulo_id = 3; cantidad = 1 }) } -Token $login.Body.access_token
  Verificar "Un pedido se rechaza de forma controlada (503 STOCK_NO_DISPONIBLE)" ($r.Status -eq 503 -and $r.Body.motivo -eq "STOCK_NO_DISPONIBLE") "-> $($r.Status) $($r.Body.motivo)"
} finally {
  Paso "Levantando Stock otra vez..."
  docker compose up -d --wait stock-service *> $null
}

Paso "Esperando $($espera + 1) s para que el circuito pase a SEMIABIERTO..."
Start-Sleep -Seconds ($espera + 1)
$r = Llamar GET "/stock/catalogo"
Verificar "Con Stock de vuelta, la llamada de prueba funciona (200)" ($r.Status -eq 200) "-> $($r.Status)"
$salud = Invoke-RestMethod "http://127.0.0.1:8080/health"
Verificar "El circuito de Stock vuelve a CERRADO" ($salud.circuitos.stock -eq "CERRADO") "-> $($salud.circuitos.stock)"

Resultado