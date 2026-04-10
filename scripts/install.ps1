# Devscape — Windows Install Script
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

# ── Step 2: Find VS Code CLI ─────────────────────────────────────────────
# code.cmd is the reliable CLI on Windows — find it explicitly
$codeCli = $null
$tryPaths = @(
    "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd",
    "$env:ProgramFiles\Microsoft VS Code\bin\code.cmd",
    "${env:ProgramFiles(x86)}\Microsoft VS Code\bin\code.cmd"
)
foreach ($p in $tryPaths) {
    if (Test-Path $p) { $codeCli = $p; break }
}

if (-not $codeCli) {
    Write-Host "  [ERROR] VS Code not found." -ForegroundColor Red
    Write-Host "  Install from: https://code.visualstudio.com" -ForegroundColor Yellow
    exit 1
}
$codeVersion = & $codeCli --version 2>&1 | Select-Object -First 1
Write-Host "  [OK] VS Code $codeVersion" -ForegroundColor Green

# ── Step 3: Install vsce if needed ───────────────────────────────────────
$vsceCheck = & npm list -g @vscode/vsce 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Installing @vscode/vsce..." -ForegroundColor Yellow
    & npm install -g @vscode/vsce 2>&1 | Out-Null
}
Write-Host "  [OK] @vscode/vsce" -ForegroundColor Green

# ── Step 4: Package ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Packaging extension..." -ForegroundColor Yellow

# Navigate to project root (parent of scripts/)
Push-Location (Split-Path $PSScriptRoot)

& vsce package --out devscape-vscode-theme.vsix 2>&1 | Out-Null
if (-not (Test-Path "devscape-vscode-theme.vsix")) {
    Write-Host "  [ERROR] Packaging failed." -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "  [OK] Package created" -ForegroundColor Green

# ── Step 5: Uninstall previous version (if exists) ───────────────────────
Write-Host "  Removing previous version (if any)..." -ForegroundColor Yellow
& $codeCli --uninstall-extension J8118.devscape-vscode-theme 2>&1 | Out-Null

# Also force-remove the folder in case CLI didn't clean it
$extDir = Join-Path $env:USERPROFILE ".vscode\extensions"
Get-ChildItem $extDir -Directory -Filter "*devscape*" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

# ── Step 6: Install ─────────────────────────────────────────────────────
Write-Host "  Installing extension..." -ForegroundColor Yellow
$installOutput = & $codeCli --install-extension devscape-vscode-theme.vsix --force 2>&1
Write-Host "        $installOutput"

# ── Step 7: Verify installation ─────────────────────────────────────────
Write-Host "  Verifying installation..." -ForegroundColor Yellow
$installed = Get-ChildItem $extDir -Directory -Filter "*devscape*" -ErrorAction SilentlyContinue

if ($installed) {
    Write-Host "  [OK] Extension installed at: $($installed.Name)" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Extension folder not found after install." -ForegroundColor Red
    Write-Host "  The .vsix file has been kept for manual install:" -ForegroundColor Yellow
    Write-Host "  Open VS Code > Extensions > ... > Install from VSIX" -ForegroundColor Yellow
    Write-Host "  File: $(Resolve-Path devscape-vscode-theme.vsix)" -ForegroundColor Yellow
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
Write-Host "    1. Reload VS Code (Ctrl+Shift+P > 'Reload Window')"
Write-Host "    2. Ctrl+K Ctrl+T -> select 'Arctic Sands'"
Write-Host "    3. Ctrl+Shift+P -> 'Devscape: Apply Background & UI'"
Write-Host ""
Write-Host "  To uninstall, run: .\scripts\uninstall.ps1" -ForegroundColor Yellow
Write-Host "  Do NOT uninstall through VS Code's Extensions panel." -ForegroundColor Yellow
Write-Host ""
