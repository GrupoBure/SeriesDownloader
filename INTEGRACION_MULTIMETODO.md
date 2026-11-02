# Consolidación multimétodo — revisión 2026-11-02

## Base protegida
Esta rama parte de main y **no sustituye main**. Los 16 ZIP de respaldo siguen siendo referencias históricas.

## Revisión de respaldos (v0–v15)
- v0: puente local y descarga base.
- v1: análisis Suikora mediante hash.
- v2–v3: URL original para proveedores conocidos; carpetas por serie.
- v4–v5: subtítulos VTT, MKV y validación de archivos.
- v6–v7: ajustes de fuentes.
- v8–v14: HotPlot, extensión, audio y detección en Chrome.
- v15: biblioteca de series y MP4 directos.
- main actual: soporte adicional para proveedores y mejoras posteriores a los ZIP.

## Cambios aislados en esta rama
1. El analizador de Suikora conserva la URL original de proveedores autorizados y su proxy conocido como alternativa.
2. El navegador conserva las fuentes alternativas hasta la cola de Windows.
3. Si FFmpeg no produce un archivo reproducible, el puente prueba otra fuente conocida para ese episodio.
4. Los fallos de todas las fuentes se cuentan solo cuando ninguna produce un archivo válido.
5. No se han modificado la extensión, el lector HotPlot ni el procesador de audio.

## Pendiente antes de integrar en main
- Ejecutar el puente en Windows PowerShell 5.1 y comprobar sintaxis y descargas reales.
- Probar Suikora con un caso de URL original y otro con proxy.
- Comprobar audio y subtítulos.
- Repetir descarga conocida de HotPlot y MasDramas.
- Confirmar que los enlaces y derechos de acceso permiten descarga. Un 404 no se resuelve simplemente con reintentos.
- El episodio de «La prisión más letal» sigue sin una fuente alternativa **verificada**: no se anuncia como resuelto.

## Publicación
Solo integrar en main después de las pruebas anteriores.
