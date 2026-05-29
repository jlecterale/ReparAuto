$p = Join-Path $env:APPDATA 'Code\User\locale.json'
$json = '{"locale":"pt-BR"}'
$dir = Split-Path $p
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
Set-Content -Path $p -Value $json -Encoding UTF8
Write-Output "WROTE:$p"
