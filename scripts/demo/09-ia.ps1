. "$PSScriptRoot\comun.ps1"
Titulo "9. IA: recomendaciones 'se compra junto con' (reglas de asociación)"

$r = Llamar GET "/stock/catalogo/2/recomendaciones"
Verificar "Recomendaciones para 'Teclado mecánico' (200)" ($r.Status -eq 200 -and $r.Body.Count -gt 0) "-> $($r.Status)"
foreach ($rec in $r.Body) {
  Paso ("{0,-28} confianza {1,4:P0}   lift {2}   ({3} pedidos juntos)" -f $rec.nombre, $rec.confianza, $rec.lift, $rec.veces)
}
Verificar "La primera sugerencia es 'Mouse óptico'" ($r.Body[0].articulo_id -eq 3) "-> $($r.Body[0].nombre)"

$r = Llamar GET "/stock/catalogo/1/recomendaciones"
Paso "Para 'Auriculares inalámbricos': $(($r.Body | ForEach-Object nombre) -join ', ')"
Verificar "Sugiere 'Parlante edición limitada'" (5 -in $r.Body.articulo_id)

$r = Llamar GET "/stock/catalogo/999/recomendaciones"
Verificar "Artículo inexistente -> 404" ($r.Status -eq 404) "-> $($r.Status)"

Resultado