# Простой локальный сервер для просмотра сайта: http://localhost:5173
# Запуск: powershell -ExecutionPolicy Bypass -File serve.ps1
param([int]$Port = 5173)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mime = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8';
  '.svg'='image/svg+xml'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.png'='image/png'; '.webp'='image/webp'; '.ico'='image/x-icon'; '.json'='application/json' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Сайт открыт: http://localhost:$Port/"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
      $file = [System.IO.Path]::GetFullPath((Join-Path $root $path))
      $res = $ctx.Response
      if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        [byte[]]$bytes = [System.IO.File]::ReadAllBytes($file)
        if ($ctx.Request.HttpMethod -eq 'HEAD') {
          $res.ContentLength64 = $bytes.Length
        } else {
          $res.SendChunked = $false
          $res.ContentLength64 = $bytes.Length
          $res.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      } else {
        $res.StatusCode = 404
      }
    } catch {
      Write-Host "Request error: $($_.Exception.Message)"
    } finally {
      try { $ctx.Response.Close() } catch {}
    }
  }
} finally { $listener.Stop() }
