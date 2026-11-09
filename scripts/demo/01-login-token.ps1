. "$PSScriptRoot\comun.ps1"
Titulo "1. Inicio de sesión y access token (token issuer, RS256)"

$r = Llamar POST "/auth/login" @{ email = $Cfg.SEED_CLIENTE_EMAIL; password = $Cfg.SEED_CLIENTE_PASSWORD }
Verificar "Login del cliente activo devuelve un token (200)" ($r.Status -eq 200 -and $r.Body.access_token) "-> $($r.Status)"

$partes = $r.Body.access_token.Split(".")
$cabecera = DecodificarBase64Url $partes[0] | ConvertFrom-Json
$datos = DecodificarBase64Url $partes[1] | ConvertFrom-Json
Paso "Algoritmo: $($cabecera.alg) (firma Autenticación con su clave privada)"
Paso "Contenido legible sin clave: email=$($datos.email) rol=$($datos.rol) emisor=$($datos.iss)"
Paso "Vence: $([DateTimeOffset]::FromUnixTimeSeconds($datos.exp).ToLocalTime()) (8 h, sin refresh)"
Verificar "El token está firmado con RS256" ($cabecera.alg -eq "RS256")

$r = Llamar POST "/auth/login" @{ email = $Cfg.SEED_INACTIVO_EMAIL; password = $Cfg.SEED_INACTIVO_PASSWORD }
Verificar "Cuenta inactiva rechazada (403)" ($r.Status -eq 403) "-> $($r.Status)"

$r = Llamar POST "/auth/login" @{ email = $Cfg.SEED_CLIENTE_EMAIL; password = "incorrecta" }
Verificar "Contraseña incorrecta rechazada (401)" ($r.Status -eq 401) "-> $($r.Status)"

Resultado