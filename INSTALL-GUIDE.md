# Devscape — Install & Uninstall Guide

## Why This Guide Exists

Devscape is not a traditional VS Code theme. Understanding the difference is critical to avoiding issues.

### Traditional Themes vs. Devscape

| | Traditional Theme | Devscape |
|---|---|---|
| **How it works** | Applies hex color values to VS Code's built-in theming API | Injects custom CSS and JavaScript into VS Code's source files |
| **What it changes** | Surface-level colors (syntax highlighting, UI element colors) | Core behavior — rounded tabs, glow animations, background images, sidebar dashboard |
| **Install** | Standard extension install | Standard extension install **+ Apply command** |
| **Uninstall** | Standard extension uninstall — clean, instant, no remnants | **Must use uninstall script** — standard uninstall leaves injected code behind |
| **VS Code updates** | No action needed | May need to re-apply (Devscape auto-recovers on launch) |

### The Problem With Standard Uninstall

When you uninstall Devscape through VS Code's Extensions panel or `code --uninstall-extension`:

1. The **extension files** are removed (commands, dashboard, settings)
2. But the **injected CSS and JS remain** in VS Code's workbench source files
3. VS Code is now in a **limbo state** — custom UI styling is stuck with no way to remove it through the UI
4. This can result in broken layouts, ghost styling, and `.BROKEN` extension folders

Fixing this manually requires running commands like:
```
rd /s /q "%USERPROFILE%\.vscode\extensions\j8118.devscape-vscode-theme-1.0.0.BROKEN"
```

**This is why Devscape includes dedicated install and uninstall scripts.**

---

## Install

### Prerequisites
- [Node.js](https://nodejs.org) v16 or later
- [VS Code](https://code.visualstudio.com) with `code` command available in your terminal

### Windows

```powershell
git clone https://github.com/J8118/devscape-vscode-theme.git
cd devscape-vscode-theme
.\scripts\install.ps1
```

### macOS / Linux

```bash
git clone https://github.com/J8118/devscape-vscode-theme.git
cd devscape-vscode-theme
chmod +x scripts/install.sh
./scripts/install.sh
```

### After Install

1. Open VS Code
2. **Ctrl+K Ctrl+T** (Cmd+K Cmd+T on Mac) → select **Arctic Sands**
3. **Ctrl+Shift+P** → run **Devscape: Apply Background & UI**
4. Click **Reload Now** when prompted

> **Note:** If you get a file permission error when applying, try running VS Code as Administrator (Windows) or with sudo (macOS/Linux). Most installations do not require this.

---

## Uninstall

> **Do NOT uninstall Devscape through VS Code's Extensions panel.** Use the uninstall script instead.

The uninstall script performs a complete cleanup:

1. Removes all injected CSS from VS Code's workbench stylesheet
2. Removes all injected JS from VS Code's workbench script
3. Cleans up legacy injections from older versions
4. Uninstalls the extension from VS Code
5. Removes the extension folder (including `.BROKEN` remnants)
6. Removes the extension from VS Code's extension registry

### Windows

```powershell
cd devscape-vscode-theme
.\scripts\uninstall.ps1
```

### macOS / Linux

```bash
cd devscape-vscode-theme
chmod +x scripts/uninstall.sh
./scripts/uninstall.sh
```

### After Uninstall

Restart VS Code. Your editor will be fully restored to its default state with no remnants of Devscape styling.

---

## Updating Devscape

To update to a new version, you must do a full uninstall → reinstall cycle. Simply re-applying the background will **not** pick up code changes — the old extension files remain cached by VS Code.

### Windows

```powershell
cd devscape-vscode-theme
.\scripts\uninstall.ps1
# Restart VS Code, then:
git pull
.\scripts\install.ps1
```

### macOS / Linux

```bash
cd devscape-vscode-theme
./scripts/uninstall.sh
# Restart VS Code, then:
git pull
./scripts/install.sh
```

After reinstalling, select the theme and run **Devscape: Apply Background & UI** to inject the latest CSS.

---

## Recovering From a Bad State

If you accidentally uninstalled through VS Code's UI (not the script) and your editor is stuck with ghost styling:

### Windows

```powershell
# Navigate to where you cloned the repo
cd devscape-vscode-theme

# Run the uninstall script — it will clean up even without the extension installed
.\scripts\uninstall.ps1
```

If you no longer have the repo cloned, you can fix it manually:

```powershell
# Remove broken extension folders
Get-ChildItem "$env:USERPROFILE\.vscode\extensions" -Filter "*devscape*" | Remove-Item -Recurse -Force

# Re-clone just to run the cleanup
git clone https://github.com/J8118/devscape-vscode-theme.git
cd devscape-vscode-theme
.\scripts\uninstall.ps1
cd ..
Remove-Item devscape-vscode-theme -Recurse -Force
```

### macOS / Linux

```bash
# Remove broken extension folders
rm -rf ~/.vscode/extensions/*devscape*

# Re-clone just to run the cleanup
git clone https://github.com/J8118/devscape-vscode-theme.git
cd devscape-vscode-theme
./scripts/uninstall.sh
cd ..
rm -rf devscape-vscode-theme
```

---

## FAQ

**Q: Why does VS Code show "Your installation appears to be corrupt"?**
This is expected. VS Code detects that its internal files have been modified and shows a warning. Click the gear icon on the notification and select **"Don't Show Again"**. This is the same behavior as every CSS-injecting extension (Custom CSS and JS Loader has 1M+ installs and causes the same warning).

**Q: My background disappeared after a VS Code update.**
VS Code updates overwrite its internal files, removing injections. Devscape automatically detects this and re-applies on next launch. If it doesn't, manually run **Devscape: Apply Background & UI**.

**Q: Can I have Devscape and other CSS-injecting extensions installed at the same time?**
Not recommended. Multiple extensions modifying the same workbench files can conflict. Uninstall other CSS injectors (Custom CSS and JS Loader, etc.) before using Devscape.
