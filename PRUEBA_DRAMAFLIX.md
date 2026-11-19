# Prueba de DramaFlix (rama aislada)

La version principal (`main/index.html`) no se ha reemplazado.

## Verificacion real previa
Se inspecciono `Capitulo_01.mp4` que compartio el usuario: H.264 (720x1282), AAC estereo, 153.28 s, 14,152,330 bytes. FFmpeg pudo decodificar un fotograma a los 20 s y al final, y audio a los 140 s.

## Integracion
- `index.html`: reconoce enlaces `https://dramaflix.net/es/drama/<slug>/episodio-N`, permite seleccion por rango y conserva el nombre de carpeta.
- Extension: observa exclusivamente las listas HLS de DramaFlix en las sesiones de deteccion.
- Bridge: acepta listas HLS de DramaFlix con `auth_key` y transmite origin/referer a FFmpeg; marca completado solo si el archivo final contiene video y audio.
- No se cambia el tratamiento de Suikora, HotPlot y MasDramas.
- `https://grupobure.github.io/SeriesDownloader/preview-dramaflix.html` es una pagina experimental separada.

## Pasos para Windows
1. Descargar el ZIP de esta rama y extraerlo.
2. En Chrome > Extensiones, desactivar temporalmente la extension anterior y cargar la carpeta `chrome-extension` de este ZIP.
3. Reiniciar el puente PowerShell con `windows/SeriesDownloader-Bridge.ps1` del ZIP. El token se renueva.
4. Abrir la pagina de prueba, conectar el puente, pegar el enlace del episodio 1 y pulsar Analizar enlace.
5. En la pestaña del episodio, pulsar Play si el navegador lo requiere. Regresar al descargador, seleccionar solamente el capitulo 1 y descargar.
6. Comprobar en Windows que el MP4 tiene imagen y sonido antes de probar 2 capitulos.

## Limitaciones
- Verificado: sintaxis JavaScript y estructura basica PowerShell; el puente reconstruido necesita prueba de ejecucion en Windows.
- El `auth_key` es temporal y no debe compartirse. La biblioteca guarda referencias a paginas, no sus URL HLS temporales.
- No hay autoplay forzado: el usuario tal vez deba pulsar Play para detectar cada capitulo.
- Solo usar la opcion de descarga con los episodios para los que se tenga autorizacion. No se intenta eludir DRM ni desbloqueos.
