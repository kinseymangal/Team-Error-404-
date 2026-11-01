$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:ADMIN_EMAIL = Read-Host 'Choose the administrator email'
$secret = Read-Host 'Choose an administrator password (at least 12 characters)' -AsSecureString
$credential = [System.Net.NetworkCredential]::new('', $secret)
$env:ADMIN_PASSWORD = $credential.Password
try {
 if ($env:ADMIN_PASSWORD.Length -lt 12) { throw 'Administrator password must contain at least 12 characters.' }
 Write-Host 'Starting server. Log in with these administrator credentials, then independently verify doctor credentials in the Doctor verification panel.'
 npm.cmd run dev
} finally {
 Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
 Remove-Item Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
}
