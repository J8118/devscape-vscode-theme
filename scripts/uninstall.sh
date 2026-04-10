#!/usr/bin/env bash
# Devscape — Unix Uninstall Script
# Run: chmod +x scripts/uninstall.sh && ./scripts/uninstall.sh
#
# This script performs a COMPLETE removal:
#   1. Reverts all injected CSS/JS from VS Code's workbench source files
#   2. Uninstalls the extension via VS Code CLI
#   3. Removes extension folders (including .BROKEN remnants)
#   4. Cleans the extension registry (extensions.json)
#
# WHY THIS SCRIPT IS REQUIRED:
#   Devscape injects CSS and JS into VS Code's core workbench files.
#   Standard "Uninstall Extension" only removes the extension — the
#   injected code stays behind, leaving VS Code in a broken state.

set -e

echo ""
echo "  Devscape Uninstaller"
echo "  ===================="
echo ""

# ── Step 1: Clean injected CSS/JS from VS Code workbench files ───────────

echo "  [1/4] Cleaning VS Code workbench files..."

CLEANED=false

for CODE_PATH in \
    "/usr/share/code/resources/app/out/vs/workbench" \
    "/usr/lib/code/resources/app/out/vs/workbench" \
    "/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/workbench" \
    "/snap/code/current/usr/share/code/resources/app/out/vs/workbench" \
    "$HOME/.local/share/code/resources/app/out/vs/workbench"; do

    CSS_FILE="$CODE_PATH/workbench.desktop.main.css"
    JS_FILE="$CODE_PATH/workbench.desktop.main.js"

    if [ -f "$CSS_FILE" ]; then
        perl -0777 -i -pe 's/\n\/\*devscape-[a-z-]+-css-start\*\/.*?\/\*devscape-[a-z-]+-css-end\*\///gs' "$CSS_FILE" 2>/dev/null || true
        perl -0777 -i -pe 's/\n\/\* (?:my-editor-background|arctic-sands|lofi-nights|urban-dark)-start \*\/.*?\/\* (?:my-editor-background|arctic-sands|lofi-nights|urban-dark)-end \*\/\n//gs' "$CSS_FILE" 2>/dev/null || true
        echo "        CSS injections removed"
        CLEANED=true
    fi

    if [ -f "$JS_FILE" ]; then
        perl -0777 -i -pe 's/\n\/\*devscape-[a-z-]+-js-start\*\/.*?\/\*devscape-[a-z-]+-js-end\*\///gs' "$JS_FILE" 2>/dev/null || true
        perl -0777 -i -pe 's/\n\/\*(?:urban-dark|lofi-nights|arctic-sands)-js-start\*\/.*?\/\*(?:urban-dark|lofi-nights|arctic-sands)-js-end\*\///gs' "$JS_FILE" 2>/dev/null || true
        perl -0777 -i -pe 's/\n\/\*urban-dark-start\*\/.*?\/\*urban-dark-end\*\///gs' "$JS_FILE" 2>/dev/null || true
        perl -0777 -i -pe 's/\n\/\*my-bg-start\*\/.*?\/\*my-bg-end\*\///gs' "$JS_FILE" 2>/dev/null || true
        echo "        JS injections removed"
        CLEANED=true
    fi
done

if [ "$CLEANED" = false ]; then
    echo "        Workbench files not found at known paths"
fi

# ── Step 2: Uninstall extension via VS Code CLI ──────────────────────────

echo "  [2/4] Uninstalling extension..."
code --uninstall-extension J8118.devscape-vscode-theme 2>/dev/null || true
echo "        Extension uninstall command sent"

# ── Step 3: Remove extension folders (including .BROKEN) ─────────────────

echo "  [3/4] Removing extension folders..."
EXT_DIR="$HOME/.vscode/extensions"
REMOVED=0

if [ -d "$EXT_DIR" ]; then
    for dir in "$EXT_DIR"/*devscape* "$EXT_DIR"/*arctic-sands* "$EXT_DIR"/*lofi-nights* "$EXT_DIR"/*still-horizon* "$EXT_DIR"/*my-editor-background*; do
        if [ -d "$dir" ]; then
            rm -rf "$dir"
            echo "        Removed $(basename "$dir")"
            REMOVED=$((REMOVED + 1))
        fi
    done
fi

if [ "$REMOVED" -eq 0 ]; then
    echo "        No extension folders found (already clean)"
fi

# ── Step 4: Clean extension registry (extensions.json) ───────────────────

echo "  [4/4] Cleaning extension registry..."
REGISTRY="$EXT_DIR/extensions.json"

if [ -f "$REGISTRY" ] && command -v node &> /dev/null; then
    node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$REGISTRY', 'utf8'));
const cleaned = data.filter(e =>
    !e.identifier.id.includes('devscape') &&
    !e.identifier.id.includes('arctic-sands') &&
    !e.identifier.id.includes('lofi-nights') &&
    !e.identifier.id.includes('still-horizon') &&
    !e.identifier.id.includes('my-editor-background')
);
const removed = data.length - cleaned.length;
fs.writeFileSync('$REGISTRY', JSON.stringify(cleaned));
if (removed > 0) console.log('        Removed ' + removed + ' entries from registry');
else console.log('        Registry already clean');
" 2>/dev/null || echo "        Could not clean registry (non-critical)"
else
    echo "        Registry cleanup skipped"
fi

# ── Done ─────────────────────────────────────────────────────────────────

echo ""
echo "  ========================================"
echo "  Devscape completely uninstalled."
echo "  ========================================"
echo ""
echo "  Restart VS Code to complete cleanup."
echo "  Your editor will be fully restored to its default state."
echo ""
