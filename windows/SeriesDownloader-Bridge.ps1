# Series Downloader local companion - Windows PowerShell 5.1+
# Keep this console open while downloading.
$ErrorActionPreference = 'Stop'
$port = 8765
$origin = 'https://grupobure.github.io'
$root = 'D:\Descargas\Series_Downloader'
$tokenBytes = New-Object byte[] 18
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($tokenBytes)
$rng.Dispose()
$token = [Convert]::ToBase64String($tokenBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:8765/')
$queue = New-Object System.Collections.ArrayList
$completed = 0
$failed = 0
$process = $null
$current = $null

function Reply($ctx, [int]$code, $payload) {
  $ctx.Response.StatusCode = $code
  $ctx.Response.ContentType = 'application/json; charset=utf-8'
  $ctx.Response.Headers.Add('Access-Control-Allow-Origin', $origin)
  $ctx.Response.Headers.Add('Vary', 'Origin')
  $ctx.Response.Headers.Add('Access-Control-Allow-Private-Network', 'true')
  $json = ConvertTo-Json -InputObject $payload -Depth 8 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
  $ctx.Response.Close()
}

function Advance {
  if ($null -ne $script:process) {
    if (-not $script:process.HasExited) { return }
    $exitCode = $script:process.ExitCode
    $script:process.Dispose()
    $script:process = $null
    if ($exitCode -eq 0 -and (Test-Path $script:current.partial) -and ((Get-Item $script:current.partial).Length -gt 0)) {
      Move-Item -LiteralPath $script:current.partial -Destination $script:current.destination -Force
      $script:completed++
      Write-Host ('Listo: ' + $script:current.name) -ForegroundColor Green
    } else {
      $script:failed++
      Write-Host ('Error: ' + $script:current.name) -ForegroundColor Red
    }
    $script:current = $null
  }
  while ($script:queue.Count -gt 0) {
    $item = $script:queue[0]
    $script:queue.RemoveAt(0)
    $name = 'Capitulo_{0:D2}.mp4' -f [int]$item.number
    $seriesFolder = Join-Path $root $item.series
    New-Item -ItemType Directory -Path $seriesFolder -Force | Out-Null
    $path = Join-Path $seriesFolder $name
    if ((Test-Path $path) -and ((Get-Item $path).Length -gt 0)) { $script:completed++; continue }
    $partial = Join-Path $seriesFolder ('parcial_' + $name)
    if (Test-Path $partial) { Remove-Item -LiteralPath $partial -Force }
    $log = Join-Path $seriesFolder ('log_' + $item.number + '.txt')
    $script:current = @{name=$name;destination=$path;partial=$partial;log=$log}
    $argsText = '-hide_banner -loglevel warning -stats -nostdin -y -i "' + $item.url + '" -c copy "' + $partial + '"'
    $script:process = Start-Process -FilePath 'ffmpeg.exe' -ArgumentList $argsText -PassThru -WindowStyle Hidden -RedirectStandardError $log
    Write-Host ('Descargando: ' + $name) -ForegroundColor Cyan
    break
  }
}

try {
  if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw 'FFmpeg no se encuentra en PATH.' }
  New-Item -ItemType Directory -Force -Path $root | Out-Null
  $listener.Start()
  Write-Host 'Series Downloader - Puente local iniciado' -ForegroundColor Green
  Write-Host 'Página: https://grupobure.github.io/SeriesDownloader/'
  Write-Host ('Código de conexión: ' + $token) -ForegroundColor Yellow
  Write-Host 'Copia este código en la página. Deja esta ventana abierta.'
  Write-Host 'Para detenerlo, cierra esta ventana o pulsa Ctrl+C.'
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      if ($ctx.Request.Headers['Origin'] -cne $origin) { Reply $ctx 403 @{error='Origen no autorizado'}; continue }
      if ($ctx.Request.HttpMethod -eq 'OPTIONS') {
        $ctx.Response.StatusCode=204
        $ctx.Response.Headers.Add('Access-Control-Allow-Origin',$origin)
        $ctx.Response.Headers.Add('Access-Control-Allow-Methods','GET, POST, OPTIONS')
        $ctx.Response.Headers.Add('Access-Control-Allow-Headers','Content-Type, X-Series-Key')
        $ctx.Response.Headers.Add('Access-Control-Allow-Private-Network','true')
        $ctx.Response.Close()
        continue
      }
      if ($ctx.Request.Headers['X-Series-Key'] -cne $token) { Reply $ctx 401 @{error='Código de conexión incorrecto'}; continue }
      Advance
      $path = $ctx.Request.Url.AbsolutePath
      if ($path -eq '/status' -and $ctx.Request.HttpMethod -eq 'GET') {
        Reply $ctx 200 @{running=($null -ne $process); current=$(if($current){$current.name}else{''}); pending=$queue.Count; completed=$completed; failed=$failed; folder=$root}
      } elseif ($path -eq '/analyze' -and $ctx.Request.HttpMethod -eq 'POST') {
        $reader = New-Object IO.StreamReader($ctx.Request.InputStream)
        $data = ConvertFrom-Json -InputObject $reader.ReadToEnd()
        $uri = $null
        if (-not [Uri]::TryCreate([string]$data.url,[UriKind]::Absolute,[ref]$uri) -or $uri.Scheme -ne 'https' -or $uri.Host -ne 'suikora.com' -or $uri.AbsolutePath -notmatch '^/es/drama/[a-z0-9-]+(/\d+)?/?$') { Reply $ctx 400 @{error='Solo se admiten enlaces públicos de series de Suikora'}; continue }
        $page = $uri.GetLeftPart([UriPartial]::Path).TrimEnd('/')
        if ($page -notmatch '/\d+$') { $page += '/1' }
        $response = Invoke-WebRequest -Uri $page -UseBasicParsing -TimeoutSec 25
        $html = $response.Content.Replace('\"','"')
        $pattern = '"number":(\d+),"servers":\[\{[\s\S]*?"url":"([^"]+)","hash":"([A-Za-z0-9_-]+)"'
        $matches = [regex]::Matches($html,$pattern)
        $items = New-Object System.Collections.ArrayList
        $seen = @{}
        foreach ($match in $matches) {
          $n = [int]$match.Groups[1].Value
          if ($seen.ContainsKey($n)) { continue }
          $seen[$n] = $true
          $original = $match.Groups[2].Value.Replace('\/','/')
          $originalUri = $null
          if (-not [Uri]::TryCreate($original,[UriKind]::Absolute,[ref]$originalUri)) { continue }
          $source = 'https://suikora.com/s/'+$match.Groups[3].Value+'/index.m3u8?full=1'
          if ($originalUri.Host -match '(^|\.)(wolftv\.online|mydramawave\.com)$') { $source = $original }
          [void]$items.Add(@{number=$n;url=$source})
        }
        if ($items.Count -eq 0) { Reply $ctx 422 @{error='No encontramos capítulos en esta página'}; continue }
        $totalMatch = [regex]::Match($html,'"totalEpisodes":(\d+)')
        $total = $(if ($totalMatch.Success) {[int]$totalMatch.Groups[1].Value} else {$items.Count})
        Reply $ctx 200 @{items=@($items.ToArray());total=$total}
      } elseif ($path -eq '/queue' -and $ctx.Request.HttpMethod -eq 'POST') {
        if ($ctx.Request.ContentLength64 -gt 250000) { Reply $ctx 413 @{error='Solicitud demasiado grande'}; continue }
        $reader = New-Object IO.StreamReader($ctx.Request.InputStream)
        $raw = $reader.ReadToEnd()
        $data = ConvertFrom-Json -InputObject $raw
        $new = @($data.items)
        if ($new.Count -lt 1 -or $new.Count -gt 200) { Reply $ctx 400 @{error='Cantidad inválida de capítulos'}; continue }
        $valid = $true
        foreach ($item in $new) {
          $uri = $null
          if (-not [Uri]::TryCreate([string]$item.url,[UriKind]::Absolute,[ref]$uri) -or $uri.Scheme -ne 'https' -or ($uri.Host -notin @('suikora.com','www.suikora.com') -and $uri.Host -notmatch '(^|\.)(wolftv\.online|mydramawave\.com)$') -or $uri.AbsolutePath -notmatch '\.m3u8$' -or [int]$item.number -lt 1 -or [int]$item.number -gt 999 -or [string]$item.series -notmatch '^[a-z0-9-]{1,80}$') { $valid=$false; break }
        }
        if (-not $valid) { Reply $ctx 400 @{error='Solo se permiten listas HLS HTTPS de Suikora'}; continue }
        foreach ($item in $new) { [void]$queue.Add(@{number=[int]$item.number;url=[string]$item.url;series=[string]$item.series}) }
        Advance
        Reply $ctx 200 @{accepted=$new.Count; pending=$queue.Count}
      } elseif ($path -eq '/cancel' -and $ctx.Request.HttpMethod -eq 'POST') {
        $queue.Clear()
        if ($null -ne $process) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue; $process.Dispose(); $process=$null; $current=$null }
        Reply $ctx 200 @{cancelled=$true}
      } else { Reply $ctx 404 @{error='Ruta no encontrada'} }
    } catch {
      try { Reply $ctx 500 @{error=$_.Exception.Message} } catch {}
      Write-Warning $_.Exception.Message
    }
  }
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; Read-Host 'Enter para cerrar' } finally {
  if ($null -ne $process) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
  if ($listener.IsListening) { $listener.Stop() }
  $listener.Close()
}
