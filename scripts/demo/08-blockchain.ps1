. "$PSScriptRoot\comun.ps1"
Titulo "8. Blockchain: registro de auditoría inmutable"

# Cambia el total de un bloque DIRECTAMENTE en la base de Auditoría (simula un ataque). Devuelve el valor anterior.
function CambiarTotal([int]$Indice, [string]$Total) {
  $codigo = "from app.db import SessionLocal; from app.models import Bloque; s = SessionLocal(); b = s.get(Bloque, $Indice); d = dict(b.datos); anterior = d.get('total'); d['total'] = '$Total'; b.datos = d; s.commit(); print(anterior)"
  docker compose exec -T auditoria-service python -c $codigo
}

$admin = TokenAdmin
$cliente = TokenCliente

Paso "Generando eventos: registro de cuenta, activación y un pedido..."
$r = Llamar POST "/auth/registro" @{ nombre = "Prueba Auditoria"; email = "auditoria$(Get-Random)@mail.com"; password = "clave1234" }
Llamar PATCH "/auth/usuarios/$($r.Body.id)/activar" -Token $admin | Out-Null
$p = Llamar POST "/pedidos" @{ nombre_cliente = "Prueba Auditoria"; items = @(@{ articulo_id = 3; cantidad = 1 }) } -Token $cliente
Verificar "Pedido aceptado (201)" ($p.Status -eq 201) "-> $($p.Status)"
Start-Sleep -Milliseconds 500

$bloques = @((Llamar GET "/auditoria/bloques?limite=3" -Token $admin).Body | Sort-Object indice)
foreach ($b in $bloques) {
  Paso ("#{0,-3} {1,-18} hash {2}...  anterior {3}..." -f $b.indice, $b.tipo, $b.hash.Substring(0, 12), $b.hash_anterior.Substring(0, 12))
}
$tipos = $bloques.tipo
Verificar "Se registraron CUENTA_REGISTRADA, CUENTA_ACTIVADA y PEDIDO_ACEPTADO" (
  "CUENTA_REGISTRADA" -in $tipos -and "CUENTA_ACTIVADA" -in $tipos -and "PEDIDO_ACEPTADO" -in $tipos)
Verificar "Cada bloque guarda el hash del anterior" (
  $bloques[1].hash_anterior -eq $bloques[0].hash -and $bloques[2].hash_anterior -eq $bloques[1].hash)

$v = (Llamar GET "/auditoria/verificacion" -Token $admin).Body
Verificar "La cadena completa es válida ($($v.bloques_verificados) bloques)" $v.valida

$indice = ($bloques | Where-Object tipo -eq "PEDIDO_ACEPTADO" | Select-Object -First 1).indice
Paso "Ataque simulado: se cambia el total del bloque #$indice directamente en la base..."
$original = CambiarTotal $indice "1.00"
try {
  $v = (Llamar GET "/auditoria/verificacion" -Token $admin).Body
  Paso "Verificación: $($v.motivo)"
  Verificar "La verificación detecta la adulteración en el bloque #$indice" (-not $v.valida -and $v.primer_bloque_invalido -eq $indice) "-> $($v.primer_bloque_invalido)"
} finally {
  CambiarTotal $indice $original | Out-Null
  Paso "Valor original restaurado ($original)"
}

$v = (Llamar GET "/auditoria/verificacion" -Token $admin).Body
Verificar "Con el valor original, la cadena vuelve a ser válida" $v.valida

Resultado