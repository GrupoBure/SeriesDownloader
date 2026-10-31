# Detector de video para Chrome

Extensión opcional de Series Downloader para páginas de MasDramas y HotPlot que puedas reproducir normalmente. No evade accesos, DRM, suscripciones ni verificaciones.

## Instalación (una sola vez)

1. Descarga el repositorio desde **Code → Download ZIP**: https://github.com/GrupoBure/SeriesDownloader
2. Extrae el ZIP en una carpeta permanente, por ejemplo `D:\Descargas\SeriesDownloader`.
3. Abre `chrome://extensions` en Google Chrome y activa **Modo de desarrollador**.
4. Pulsa **Cargar descomprimida** y selecciona la carpeta `chrome-extension` extraída (contiene `manifest.json`).
5. Abre o recarga https://grupobure.github.io/SeriesDownloader/ y confirma que indique **Extensión de Chrome conectada**.

## Uso

1. Inicia el puente Windows y conecta la página con su código temporal, como siempre.
2. Pega el enlace de un episodio de MasDramas o HotPlot y pulsa **Analizar enlace**.
3. Se abrirá otra pestaña. Reproduce el capítulo normalmente y completa cualquier acceso que solicite el sitio.
4. Al detectar el archivo `.m3u8`, regresa a Series Downloader, revisa el capítulo y la carpeta y pulsa **Descargar directamente en Windows**.

Si no se detecta, todavía puedes pegar manualmente el HLS. Los enlaces firmados caducan: no los compartas.

## Varios capítulos de MasDramas

1. Pega una sola URL de la serie (`https://masdramas.com/series/nombre-de-la-serie`) o la de cualquier capítulo.
2. Indica los números separados por comas, por ejemplo `8,16`, y pulsa **Detectar capítulos**.
3. La extensión abre **un episodio a la vez**. Cuando se capture su lista HLS, abrirá el siguiente. Si el reproductor requiere pulsar Play, hazlo manualmente. No se omiten restricciones de acceso.
4. Al finalizar, revisa los capítulos detectados y pulsa **Descargar directamente en Windows**. Si falta alguno, podrás reintentarlo por separado.

Actualmente no podemos garantizar un catálogo completo desde una sola URL ni reproducir automáticamente capítulos bloqueados. Esta función evita copiar enlaces y prepara la cola de los episodios que indiques.

## Privacidad y límites

- Observa exclusivamente solicitudes HLS de `masdramas.com` y `*.hotplot.vip` después de pulsar Analizar en nuestra página.
- Devuelve la URL a la pestaña de Series Downloader; no envía enlaces a terceros ni a GitHub.
- No descarga videos: eso lo hace el puente Windows existente.
- Cada detección corresponde a una sola pestaña de episodio.
- Si el sitio cambia de servidor o utiliza DRM, la detección puede no funcionar.
