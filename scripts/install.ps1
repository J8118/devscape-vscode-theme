# Devscape -Windows Install Script
# Run: .\scripts\install.ps1

Write-Host ""
Write-Host "  Devscape Installer" -ForegroundColor Cyan
Write-Host "  ==================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check Node.js ────────────────────────────────────────────────
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "  [OK] Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Node.js is required." -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# ── Step 2: Install vsce if needed ───────────────────────────────────────
$vsceCheck = & npm list -g @vscode/vsce 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Installing @vscode/vsce..." -ForegroundColor Yellow
    & npm install -g @vscode/vsce 2>&1 | Out-Null
}
Write-Host "  [OK] @vscode/vsce" -ForegroundColor Green

# ── Step 3: Package ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Packaging extension..." -ForegroundColor Yellow

Push-Location (Split-Path $PSScriptRoot)

& vsce package --out devscape-vscode-theme.vsix 2>&1 | Out-Null
if (-not (Test-Path "devscape-vscode-theme.vsix")) {
    Write-Host "  [ERROR] Packaging failed." -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "  [OK] Package created" -ForegroundColor Green

# ── Step 4: Remove previous install ─────────────────────────────────────
Write-Host "  Removing previous version (if any)..." -ForegroundColor Yellow

$extDir = Join-Path $env:USERPROFILE ".vscode\extensions"
if (-not (Test-Path $extDir)) {
    New-Item -ItemType Directory -Path $extDir -Force | Out-Null
}

# Remove any existing devscape folders (including .BROKEN)
Get-ChildItem $extDir -Directory -Filter "*devscape*" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "        Removed $($_.Name)" -ForegroundColor Gray
}

# Remove from extensions.json registry
$registryFile = Join-Path $extDir "extensions.json"
if (Test-Path $registryFile) {
    try {
        $json = Get-Content $registryFile -Raw | ConvertFrom-Json
        $json = $json | Where-Object { $_.identifier.id -notlike "*devscape*" }
        $json | ConvertTo-Json -Depth 10 -Compress | Set-Content $registryFile -NoNewline
    } catch {}
}

Write-Host "  [OK] Clean slate" -ForegroundColor Green

# ── Step 5: Extract .vsix directly to extensions folder ──────────────────
Write-Host "  Installing extension..." -ForegroundColor Yellow

$targetDir = Join-Path $extDir "j8118.devscape-vscode-theme-1.0.0"
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

# .vsix is a zip -extract the extension/ subfolder
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "devscape-vscode-theme.vsix"))
foreach ($entry in $zip.Entries) {
    # Only extract files under extension/ (skip [Content_Types].xml etc.)
    if ($entry.FullName.StartsWith("extension/") -and $entry.FullName -ne "extension/") {
        $relativePath = $entry.FullName.Substring("extension/".Length)
        $destPath = Join-Path $targetDir $relativePath

        if ($entry.FullName.EndsWith("/")) {
            # Directory entry
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        } else {
            # File entry
            $parentDir = Split-Path $destPath
            if (-not (Test-Path $parentDir)) {
                New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
            }
            $stream = $entry.Open()
            $fileStream = [System.IO.File]::Create($destPath)
            $stream.CopyTo($fileStream)
            $fileStream.Close()
            $stream.Close()
        }
    }
}
$zip.Dispose()

Write-Host "  [OK] Files extracted" -ForegroundColor Green

# ── Step 6: Register in extensions.json ──────────────────────────────────
Write-Host "  Registering extension..." -ForegroundColor Yellow

$registryFile = Join-Path $extDir "extensions.json"
$registry = @()
if (Test-Path $registryFile) {
    try { $registry = Get-Content $registryFile -Raw | ConvertFrom-Json } catch { $registry = @() }
}

# Ensure it's an array
if ($registry -isnot [System.Array]) { $registry = @($registry) }

$newEntry = @{
    identifier = @{ id = "j8118.devscape-vscode-theme" }
    version = "1.0.0"
    location = @{
        '$mid' = 1
        path = "/c:/Users/$($env:USERNAME)/.vscode/extensions/j8118.devscape-vscode-theme-1.0.0"
        scheme = "file"
    }
    relativeLocation = "j8118.devscape-vscode-theme-1.0.0"
    metadata = @{
        installedTimestamp = [long](Get-Date -UFormat %s) * 1000
        pinned = $false
        source = "vsix"
    }
}

$registry += $newEntry
$registry | ConvertTo-Json -Depth 10 -Compress | Set-Content $registryFile -NoNewline

Write-Host "  [OK] Extension registered" -ForegroundColor Green

# ── Step 7: Verify ──────────────────────────────────────────────────────
Write-Host "  Verifying installation..." -ForegroundColor Yellow

$hasFolder = Test-Path (Join-Path $targetDir "package.json")
$hasEntry = (Get-Content $registryFile -Raw) -match "devscape"

if ($hasFolder -and $hasEntry) {
    Write-Host "  [OK] Verified -folder and registry entry present" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Verification failed." -ForegroundColor Red
    if (-not $hasFolder) { Write-Host "        Missing: extension folder" -ForegroundColor Red }
    if (-not $hasEntry) { Write-Host "        Missing: registry entry" -ForegroundColor Red }
    Pop-Location
    exit 1
}

# ── Step 8: Cleanup ─────────────────────────────────────────────────────
Remove-Item "devscape-vscode-theme.vsix" -Force
Pop-Location

# ── Done ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "  Devscape installed successfully!" -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    1. Restart VS Code (close and reopen)"
Write-Host "    2. Ctrl+K Ctrl+T -> select 'Arctic Sands'"
Write-Host "    3. Ctrl+Shift+P -> 'Devscape: Apply Background & UI'"
Write-Host ""
Write-Host "  To uninstall, run: .\scripts\uninstall.ps1" -ForegroundColor Yellow
Write-Host "  Do NOT uninstall through VS Code's Extensions panel." -ForegroundColor Yellow
Write-Host ""
