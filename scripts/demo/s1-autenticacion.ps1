# Pruebas del Sprint 1 (Autenticación vía Gateway). Requiere PowerShell 7+.
$ErrorActionPreference = "Stop"
$Base = "http://localhost:8080/api/v1/auth"

# Lee las credenciales de prueba desde .env
$envVars = @{}
Get-Content "$PSScriptRoot\..\..\.env" | Where-Object { $_ -match '^\s*([^#=]+)=(.*)$' } |
  ForEach-Object { $envVars[$matches[1].Trim()] = $matches[2].Trim() }

function Llamar($Metodo, $Ruta, $Body = $null, $Token = $null) {
  $headers = @{}
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }
  $params = @{ Method = $Metodo; Uri = "$Base$Ruta"; Headers = $headers; SkipHttpErrorCheck = $true }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json); $params.ContentType = "application/json" }
  $r = Invoke-WebRequest @params
  $json = $null
  if ($r.Content -and $r.Headers["Content-Type"] -match "json") { $json = $r.Content | ConvertFrom-Json }
  [pscustomobject]@{ Status = [int]$r.StatusCode; Body = $json }
}

function Verificar($Nombre, $Esperado, $Resultado) {
  if ($Resultado.Status -eq $Esperado) {
    Write-Host "[OK]    $Nombre -> $($Resultado.Status)" -ForegroundColor Green
  } else {
    Write-Host "[FALLA] $Nombre -> esperado $Esperado, obtenido $($Resultado.Status) $($Resultado.Body | ConvertTo-Json -Compress)" -ForegroundColor Red
  }
}

$emailNuevo = "nuevo$(Get-Random)@mail.com"

$r = Llamar POST "/registro" @{ nombre = "Usuario Nuevo"; email = $emailNuevo; password = "clave1234" }
Verificar "1. Registro crea cuenta INACTIVA" 201 $r
$idNuevo = $r.Body.id

Verificar "2. Login de cuenta inactiva rechazado" 403 (Llamar POST "/login" @{ email = $emailNuevo; password = "clave1234" })
Verificar "3. Login con contraseña incorrecta" 401 (Llamar POST "/login" @{ email = $envVars.SEED_CLIENTE_EMAIL; password = "incorrecta" })

$r = Llamar POST "/login" @{ email = $envVars.SEED_CLIENTE_EMAIL; password = $envVars.SEED_CLIENTE_PASSWORD }
Verificar "4. Login de cliente activo devuelve token" 200 $r
$tokenCliente = $r.Body.access_token

Verificar "5. Operación admin sin token" 401 (Llamar GET "/usuarios")
Verificar "6. Operación admin con token alterado" 401 (Llamar GET "/usuarios" -Token ($tokenCliente + "x"))
Verificar "7. Operación admin con rol CLIENTE" 403 (Llamar GET "/usuarios" -Token $tokenCliente)

$r = Llamar POST "/login" @{ email = $envVars.SEED_ADMIN_EMAIL; password = $envVars.SEED_ADMIN_PASSWORD }
Verificar "8. Login de admin" 200 $r
$tokenAdmin = $r.Body.access_token

Verificar "9. Admin lista cuentas inactivas" 200 (Llamar GET "/usuarios?estado=INACTIVO" -Token $tokenAdmin)
Verificar "10. Admin activa la cuenta nueva" 200 (Llamar PATCH "/usuarios/$idNuevo/activar" -Token $tokenAdmin)
Verificar "11. La cuenta activada ya puede iniciar sesión" 200 (Llamar POST "/login" @{ email = $emailNuevo; password = "clave1234" })
Verificar "12. Ruta no publicada en el Gateway" 404 (Llamar GET "/no-existe")