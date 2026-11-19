# Prueba aislada: DramaExpress HLS

**No reemplaza la version principal del descargador.**

Pagina de prueba:
https://grupobure.github.io/SeriesDownloader/preview-dramaexpress.html

## Que se modifico
- `index.html`: reconoce episodios y series DramaExpress y permite tandas.
- Extension: nueva deteccion en `dramaexpress.net` y el CDN identificado en pruebas (`cdn.dramadizilerim.xyz`).
- Puente PowerShell: acepta ese proveedor HTTPS bajo validacion de dominios; usa encabezados normales de origen y referer en FFmpeg.
- Seguridad de salida: DramaExpress se considera completado solo si FFprobe detecta video y audio en el MP4.
- Suikora, HotPlot y MasDramas se mantienen sin cambios funcionales intencionales.

## Prueba (Windows/Chrome)
1. Descargar ZIP de esta rama y extraerlo.
2. En chrome://extensions, desactivar temporalmente la extension de Series Downloader actual; cargar como desempaquetada la carpeta `chrome-extension` de este ZIP.
3. Detener el puente anterior; iniciar `windows/SeriesDownloader-Bridge.ps1` de esta rama. El token cambia cada inicio.
4. Abrir la pagina de prueba y conectar el puente con el token nuevo.
5. Pegar `https://dramaexpress.net/es/series/disfrazada-de-nina-delicada-la-verdugo/episode-1`.
6. Pulsar Analizar y reproducir en la pestaña abierta. Verificar que el episodio aparece en la lista; probar un unico capitulo y comprobar que contiene imagen/sonido.
7. Cuando un capitulo funcione, probar un rango de 2 capitulos, no los 25 de golpe.

## Limitaciones
- Las pruebas de sintaxis JavaScript pasaron; la prueba en Chrome y FFmpeg Windows aun no se ha ejecutado en el entorno del usuario.
- Se ha observado una solicitud `main.m3u8?auth_key=...`, pero **no se ha confirmado el dominio real del CDN de DramaExpress en esa captura**, por lo que la deteccion puede necesitar un ajuste.
- Solo procesa HLS descargable al que se tenga acceso autorizado; no elude DRM, bloqueos de pago ni cifrado.
- Si el archivo solo contiene audio o el codec de video es desconocido, falla la verificacion y no se marca como completado.
- No instalar la rama encima del sistema principal hasta completar esta prueba.
