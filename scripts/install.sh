#!/usr/bin/env bash
# Devscape — Unix Install Script
# Run: chmod +x scripts/install.sh && ./scripts/install.sh

set -e

echo ""
echo "  Devscape Installer"
echo "  =================="
echo ""

# Step 1: Check Node.js
if ! command -v node &> /dev/null; then
    echo "  [ERROR] Node.js is required."
    echo "  Install from: https://nodejs.org"
    echo "  Or: brew install node (macOS) / sudo apt install nodejs (Ubuntu)"
    exit 1
fi
echo "  [OK] Node.js $(node --version)"

# Step 2: Check VS Code CLI
if ! command -v code &> /dev/null; then
    echo "  [ERROR] VS Code 'code' command not found."
    echo "  Open VS Code and run: Cmd+Shift+P > 'Shell Command: Install code command in PATH'"
    exit 1
fi
echo "  [OK] VS Code $(code --version | head -1)"

# Step 3: Install vsce if needed
if ! npm list -g @vscode/vsce &> /dev/null; then
    echo "  Installing @vscode/vsce..."
    npm install -g @vscode/vsce > /dev/null 2>&1
fi
echo "  [OK] @vscode/vsce"

# Step 4: Package
echo ""
echo "  Packaging extension..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."
vsce package --out devscape-vscode-theme.vsix > /dev/null 2>&1

if [ ! -f "devscape-vscode-theme.vsix" ]; then
    echo "  [ERROR] Packaging failed."
    exit 1
fi
echo "  [OK] Package created"

# Step 5: Install
echo "  Installing extension..."
code --install-extension devscape-vscode-theme.vsix > /dev/null 2>&1
echo "  [OK] Extension installed"

# Step 6: Cleanup
rm -f devscape-vscode-theme.vsix

# Done
echo ""
echo "  Devscape installed successfully!"
echo ""
echo "  Next steps:"
echo "    1. Open VS Code"
echo "    2. Ctrl+K Ctrl+T -> select 'Arctic Sands'"
echo "    3. Ctrl+Shift+P -> 'Devscape: Apply Background & UI'"
echo ""
echo "  NOTE: On macOS/Linux, VS Code may need to be run with sudo"
echo "  for background injection to work."
echo ""
