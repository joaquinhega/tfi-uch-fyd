# Guion de la demo: ejecuta todos los scripts en orden y muestra un resumen final.
$scripts = Get-ChildItem "$PSScriptRoot\0*.ps1" | Sort-Object Name
$resumen = foreach ($s in $scripts) {
  pwsh -NoProfile -File $s.FullName | Out-Host
  [pscustomobject]@{ Script = $s.BaseName; Resultado = $(if ($LASTEXITCODE -eq 0) { "OK" } else { "FALLA" }) }
}
Write-Host "`n=== RESUMEN DE LA DEMO ===" -ForegroundColor Cyan
$resumen | Format-Table -AutoSize