# Devscape — Windows Uninstall Script
# Run: .\scripts\uninstall.ps1
#
# This script performs a COMPLETE removal:
#   1. Reverts all injected CSS/JS from VS Code's workbench source files
#   2. Uninstalls the extension via VS Code CLI
#   3. Removes extension folders (including .BROKEN remnants)
#   4. Cleans the extension registry (extensions.json)
#   5. Removes workspace storage remnants
#
# WHY THIS SCRIPT IS REQUIRED:
#   Devscape injects CSS and JS into VS Code's core workbench files.
#   Standard "Uninstall Extension" only removes the extension — the
#   injected code stays behind, leaving VS Code in a broken state.
#   This script ensures a clean, complete removal with no remnants.

Write-Host ""
Write-Host "  Devscape Uninstaller" -ForegroundColor Cyan
Write-Host "  ====================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Clean injected CSS/JS from VS Code workbench files ───────────

Write-Host "  [1/5] Cleaning VS Code workbench files..." -ForegroundColor Yellow

$codePath = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\resources\app\out\vs\workbench"
$cleaned = $false

# Try alternate paths if default doesn't exist
$altPaths = @(
    "$env:LOCALAPPDATA\Programs\Microsoft VS Code\resources\app\out\vs\workbench",
    "$env:ProgramFiles\Microsoft VS Code\resources\app\out\vs\workbench",
    "${env:ProgramFiles(x86)}\Microsoft VS Code\resources\app\out\vs\workbench"
)

foreach ($tryPath in $altPaths) {
    if (Test-Path (Join-Path $tryPath "workbench.desktop.main.css")) {
        $codePath = $tryPath
        break
    }
}

$cssFile = Join-Path $codePath "workbench.desktop.main.css"
$jsFile = Join-Path $codePath "workbench.desktop.main.js"

if (Test-Path $cssFile) {
    try {
        $css = Get-Content $cssFile -Raw
        # Strip Devscape injections
        $css = $css -replace '(?s)\n/\*devscape-[a-z-]+-css-start\*/.*?/\*devscape-[a-z-]+-css-end\*/', ''
        # Strip legacy injections (arctic-sands, lofi-nights, urban-dark, my-editor-background)
        $css = $css -replace '(?s)\n/\* (?:my-editor-background|arctic-sands|lofi-nights|urban-dark)-start \*/.*?/\* (?:my-editor-background|arctic-sands|lofi-nights|urban-dark)-end \*/\n', ''
        Set-Content $cssFile -Value $css -NoNewline
        $cleaned = $true
        Write-Host "        CSS injections removed" -ForegroundColor Green
    } catch {
        Write-Host "        [ERROR] Cannot write to CSS file. Check file permissions." -ForegroundColor Red
        Write-Host "        If this fails, try running PowerShell as Administrator." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "        CSS file not found (VS Code may use a different install path)" -ForegroundColor Yellow
}

if (Test-Path $jsFile) {
    try {
        $js = Get-Content $jsFile -Raw
        # Strip Devscape injections
        $js = $js -replace '(?s)\n/\*devscape-[a-z-]+-js-start\*/.*?/\*devscape-[a-z-]+-js-end\*/', ''
        # Strip legacy injections
        $js = $js -replace '(?s)\n/\*(?:urban-dark|lofi-nights|arctic-sands)-js-start\*/.*?/\*(?:urban-dark|lofi-nights|arctic-sands)-js-end\*/', ''
        $js = $js -replace '(?s)\n/\*urban-dark-start\*/.*?/\*urban-dark-end\*/', ''
        $js = $js -replace '(?s)\n/\*my-bg-start\*/.*?/\*my-bg-end\*/', ''
        Set-Content $jsFile -Value $js -NoNewline
        $cleaned = $true
        Write-Host "        JS injections removed" -ForegroundColor Green
    } catch {
        Write-Host "        [ERROR] Cannot write to JS file. Are you running as Administrator?" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "        JS file not found" -ForegroundColor Yellow
}

# ── Step 2: Uninstall extension via VS Code CLI ──────────────────────────

Write-Host "  [2/5] Uninstalling extension..." -ForegroundColor Yellow
$codeCli = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd"
if (Test-Path $codeCli) {
    & $codeCli --uninstall-extension J8118.devscape-vscode-theme 2>&1 | Out-Null
    Write-Host "        Extension uninstall command sent" -ForegroundColor Green
} else {
    Write-Host "        code.cmd not found, skipping CLI uninstall" -ForegroundColor Yellow
}

# ── Step 3: Remove extension folders (including .BROKEN) ─────────────────

Write-Host "  [3/5] Removing extension folders..." -ForegroundColor Yellow
$extDir = Join-Path $env:USERPROFILE ".vscode\extensions"
$removed = 0

if (Test-Path $extDir) {
    $devscapeDirs = Get-ChildItem $extDir -Directory -Filter "*devscape*" -ErrorAction SilentlyContinue
    foreach ($dir in $devscapeDirs) {
        Remove-Item $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "        Removed $($dir.Name)" -ForegroundColor Green
        $removed++
    }

    # Also clean any legacy theme folders
    $legacyPatterns = @("*arctic-sands*", "*lofi-nights*", "*still-horizon*", "*my-editor-background*")
    foreach ($pattern in $legacyPatterns) {
        $legacyDirs = Get-ChildItem $extDir -Directory -Filter $pattern -ErrorAction SilentlyContinue
        foreach ($dir in $legacyDirs) {
            Remove-Item $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "        Removed legacy: $($dir.Name)" -ForegroundColor Green
            $removed++
        }
    }
}

if ($removed -eq 0) {
    Write-Host "        No extension folders found (already clean)" -ForegroundColor Green
}

# ── Step 4: Clean extension registry (extensions.json) ───────────────────

Write-Host "  [4/5] Cleaning extension registry..." -ForegroundColor Yellow
$registryFile = Join-Path $extDir "extensions.json"

if (Test-Path $registryFile) {
    try {
        $json = Get-Content $registryFile -Raw | ConvertFrom-Json
        $before = $json.Count
        $json = $json | Where-Object {
            $_.identifier.id -notlike "*devscape*" -and
            $_.identifier.id -notlike "*arctic-sands*" -and
            $_.identifier.id -notlike "*lofi-nights*" -and
            $_.identifier.id -notlike "*still-horizon*" -and
            $_.identifier.id -notlike "*my-editor-background*"
        }
        $after = $json.Count
        $json | ConvertTo-Json -Depth 10 -Compress | Set-Content $registryFile -NoNewline
        $cleanedCount = $before - $after
        if ($cleanedCount -gt 0) {
            Write-Host "        Removed $cleanedCount entries from registry" -ForegroundColor Green
        } else {
            Write-Host "        Registry already clean" -ForegroundColor Green
        }
    } catch {
        Write-Host "        Could not clean registry (non-critical)" -ForegroundColor Yellow
    }
} else {
    Write-Host "        Registry file not found" -ForegroundColor Yellow
}

# ── Step 5: Clean workspace storage remnants ─────────────────────────────

Write-Host "  [5/5] Cleaning workspace storage..." -ForegroundColor Yellow
$wsStorage = Join-Path $env:APPDATA "Code\User\workspaceStorage"
$wsRemoved = 0

if (Test-Path $wsStorage) {
    $wsDirs = Get-ChildItem $wsStorage -Directory -ErrorAction SilentlyContinue
    foreach ($dir in $wsDirs) {
        $stateFile = Join-Path $dir.FullName "state.vscdb"
        $hasDevscape = $false

        # Check if this workspace storage references devscape
        $workspaceJson = Join-Path $dir.FullName "workspace.json"
        if (Test-Path $workspaceJson) {
            $content = Get-Content $workspaceJson -Raw -ErrorAction SilentlyContinue
            if ($content -like "*devscape*" -or $content -like "*VsCode-Theme*") {
                $hasDevscape = $true
            }
        }

        # Only remove devscape-specific state files, not the whole workspace storage
        $devscapeState = Join-Path $dir.FullName "j8118.devscape-vscode-theme"
        if (Test-Path $devscapeState) {
            Remove-Item $devscapeState -Recurse -Force -ErrorAction SilentlyContinue
            $wsRemoved++
        }
    }
    if ($wsRemoved -gt 0) {
        Write-Host "        Cleaned $wsRemoved workspace storage entries" -ForegroundColor Green
    } else {
        Write-Host "        No workspace storage remnants found" -ForegroundColor Green
    }
} else {
    Write-Host "        Workspace storage path not found" -ForegroundColor Yellow
}

# ── Done ─────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "  Devscape completely uninstalled." -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Restart VS Code to complete cleanup." -ForegroundColor Yellow
Write-Host "  Your editor will be fully restored to its default state." -ForegroundColor White
Write-Host ""
