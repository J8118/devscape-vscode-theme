# Devscape — Windows Install Script
# Run: .\scripts\install.ps1

Write-Host ""
Write-Host "  Devscape Installer" -ForegroundColor Cyan
Write-Host "  ==================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "  [OK] Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Node.js is required." -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check VS Code CLI
try {
    $codeVersion = & code --version 2>&1 | Select-Object -First 1
    Write-Host "  [OK] VS Code $codeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] VS Code 'code' command not found." -ForegroundColor Red
    Write-Host "  Open VS Code and run: Ctrl+Shift+P > 'Shell Command: Install code command in PATH'" -ForegroundColor Yellow
    exit 1
}

# Step 3: Install vsce if needed
$vsceCheck = & npm list -g @vscode/vsce 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Installing @vscode/vsce..." -ForegroundColor Yellow
    & npm install -g @vscode/vsce 2>&1 | Out-Null
}
Write-Host "  [OK] @vscode/vsce" -ForegroundColor Green

# Step 4: Package
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

# Step 5: Install
Write-Host "  Installing extension..." -ForegroundColor Yellow
& code.cmd --install-extension devscape-vscode-theme.vsix --force 2>&1 | Out-Null
Write-Host "  [OK] Extension installed" -ForegroundColor Green

# Step 6: Cleanup
Remove-Item "devscape-vscode-theme.vsix" -Force
Pop-Location

# Done
Write-Host ""
Write-Host "  Devscape installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "    1. Open VS Code"
Write-Host "    2. Ctrl+K Ctrl+T -> select 'Arctic Sands'"
Write-Host "    3. Ctrl+Shift+P -> 'Devscape: Apply Background & UI'"
Write-Host ""
Write-Host "  To uninstall, run: .\scripts\uninstall.ps1" -ForegroundColor Yellow
Write-Host "  Do NOT uninstall through VS Code's Extensions panel." -ForegroundColor Yellow
Write-Host ""
