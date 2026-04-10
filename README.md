# Devscape

Immersive VS Code themes with animated backgrounds, live weather, and ambient music detection.

Devscape goes beyond colors — it transforms your entire editor with custom UI styling, a background image in your editor, and a live dashboard showing the date, weather, and what you're listening to.

https://github.com/J8118/devscape-vscode-theme/raw/master/media/preview/Arctic-Sands-Ex.mp4

## Features

- **Custom UI styling** — Activity bar, tabs, sidebar, command palette, context menus, hover widgets, and more — all themed with glow effects and smooth animations
- **Editor background** — A subtle background image injected into your editor
- **Live dashboard** — Sidebar panel with ambient video, real-time date/time, weather, and Spotify now-playing
- **Auto-detect weather** — Detects your city via IP, or set it manually
- **Cross-platform music** — Spotify detection on Windows, macOS, and Linux
- **Configurable** — Adjust background opacity, toggle the dashboard, set your weather city

## Themes

### Arctic Sands
A dark theme with icy cyan accents on deep blue-black backgrounds. Desert landscape editor background.

## Quick Install

### Prerequisites
- [Node.js](https://nodejs.org) (v16+)
- [VS Code](https://code.visualstudio.com) with `code` command in PATH

### Windows (PowerShell)
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

## After Install

1. Open VS Code
2. **Ctrl+K Ctrl+T** (or **Cmd+K Cmd+T** on Mac) and select **Arctic Sands**
3. **Ctrl+Shift+P** and run **Devscape: Apply Background & UI**
4. Click **Reload Now** when prompted

> **Important:** Do not uninstall Devscape through VS Code's Extensions panel. Use the [uninstall script](INSTALL-GUIDE.md#uninstall) instead. See the [Install Guide](INSTALL-GUIDE.md) for details on why.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `devscape.weatherCity` | *(auto-detect)* | City for weather display. Leave empty for IP-based auto-detection. |
| `devscape.dashboardEnabled` | `true` | Show or hide the Dashboard panel in the Explorer sidebar. |
| `devscape.backgroundOpacity` | `0.13` | Background image opacity in the editor (0 to 0.5). |

## Commands

| Command | Description |
|---------|-------------|
| `Devscape: Apply Background & UI` | Inject background image and custom UI into VS Code |
| `Devscape: Remove Background & UI` | Remove all Devscape injections and restore defaults |

## Troubleshooting

**"Cannot write to workbench files"**
Try running VS Code as Administrator (Windows) or with `sudo code` (macOS/Linux). Most installations do not require this.

**VS Code shows "Your Code installation appears to be corrupt"**
This is expected after any extension modifies VS Code's internal files. Click the gear icon on the notification and select **"Don't Show Again"**. This is the same behavior as [Custom CSS and JS Loader](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css) (1M+ installs).

**Background disappeared after VS Code update**
VS Code updates overwrite its internal files. Devscape auto-recovers on next launch, but you can also manually re-run **Devscape: Apply Background & UI**.

**Weather not showing**
Check your internet connection. If auto-detection doesn't work for your region, set your city manually in settings: `devscape.weatherCity`.

## Adding a New Theme (Contributors)

1. Create `src/themes/your-theme.js` with a config object (see `arctic-sands.js` for the format)
2. Add a color token JSON to `themes/your-theme.json`
3. Drop media assets into `media/your-theme/`
4. Add the theme entry to `package.json` under `contributes.themes`
5. The engine picks it up automatically

## License

[MIT](LICENSE)
