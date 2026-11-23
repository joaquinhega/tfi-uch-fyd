. "$PSScriptRoot\comun.ps1"
Titulo "9. IA: recomendaciones 'se compra junto con' (reglas de asociación)"

$teclado = IdArticulo $CodTeclado
$mouse = IdArticulo $CodMouse
$auriculares = IdArticulo $CodAuriculares
$ultimo = IdArticulo $CodUltimo

$r = Llamar GET "/stock/catalogo/$teclado/recomendaciones"
Verificar "Recomendaciones para $CodTeclado (200)" ($r.Status -eq 200 -and $r.Body.Count -gt 0) "-> $($r.Status)"
foreach ($rec in $r.Body) {
  Paso ("{0,-40} confianza {1,4:P0}   lift {2}   ({3} pedidos juntos)" -f $rec.nombre, $rec.confianza, $rec.lift, $rec.veces)
}
Verificar "La primera sugerencia es $CodMouse" ($r.Body[0].articulo_id -eq $mouse) "-> $($r.Body[0].nombre)"

$r = Llamar GET "/stock/catalogo/$auriculares/recomendaciones"
Paso "Para ${CodAuriculares}: $(($r.Body | ForEach-Object nombre) -join ', ')"
Verificar "Sugiere $CodUltimo" ($ultimo -in $r.Body.articulo_id)

$r = Llamar GET "/stock/catalogo/999999/recomendaciones"
Verificar "Artículo inexistente -> 404" ($r.Status -eq 404) "-> $($r.Status)"

Resultado