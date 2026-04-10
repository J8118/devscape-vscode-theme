# Integration Test Checklist

Run this checklist manually before submitting a pull request. All items must pass.

## Prerequisites
- [ ] All unit tests pass: `npm test`
- [ ] Clean VS Code with no Devscape installed (run uninstall script if needed)

## Install Flow
- [ ] `.\scripts\install.ps1` (Windows) or `./scripts/install.sh` (Unix) runs without errors
- [ ] Script prints success message with next steps
- [ ] Extension appears in VS Code Extensions panel (search "Devscape")

## Theme Selection
- [ ] Ctrl+K Ctrl+T shows "Arctic Sands" in the theme picker
- [ ] Selecting "Arctic Sands" applies the color theme (syntax colors, editor background)
- [ ] Switching away from Arctic Sands reverts to the other theme's colors

## Apply Background & UI
- [ ] Ctrl+Shift+P → "Devscape: Apply Background & UI" succeeds
- [ ] VS Code prompts to reload
- [ ] After reload, background image is visible in the editor
- [ ] Activity bar has glass selection indicators on the active item
- [ ] Activity bar icons do NOT shift right regardless of how many extensions are installed
- [ ] Tabs have rounded corners with accent glow on the active tab
- [ ] Command palette (Ctrl+Shift+P) has rounded borders and animation
- [ ] Hover widgets have rounded borders
- [ ] Context menus have rounded borders
- [ ] Minimap has reduced opacity that increases on hover

## Dashboard
- [ ] Explorer sidebar shows "Dashboard" panel
- [ ] Dashboard displays current date and time
- [ ] Time updates every second
- [ ] Ambient video plays in the background of the dashboard
- [ ] Weather data loads (may take a few seconds)
- [ ] Weather shows correct city (auto-detected or from settings)
- [ ] Music section shows "Not playing" or current Spotify track
- [ ] If Spotify is playing, track name and artist update live

## Settings
- [ ] `devscape.weatherCity` — setting a city changes the weather location
- [ ] `devscape.dashboardEnabled` — setting to false hides the dashboard
- [ ] `devscape.backgroundOpacity` — changing value updates the background opacity after re-apply

## Remove Background & UI
- [ ] Ctrl+Shift+P → "Devscape: Remove Background & UI" succeeds
- [ ] VS Code prompts to reload
- [ ] After reload, all custom UI styling is gone (default VS Code appearance)
- [ ] Background image is removed
- [ ] Theme colors (syntax highlighting) remain — only injected CSS/JS is removed

## Uninstall Flow
- [ ] `.\scripts\uninstall.ps1` (Windows) or `./scripts/uninstall.sh` (Unix) runs without errors
- [ ] Script reports cleaning CSS and JS injections
- [ ] Script reports removing extension folders
- [ ] After restarting VS Code:
  - [ ] No ghost styling remains
  - [ ] No "Dashboard" panel in Explorer
  - [ ] No "Devscape" commands in command palette
  - [ ] No Devscape folders in `~/.vscode/extensions/`
  - [ ] No `.BROKEN` folders related to Devscape

## Recovery Test
- [ ] Install Devscape normally, apply background
- [ ] Uninstall through VS Code Extensions panel (the WRONG way — intentionally)
- [ ] Confirm VS Code is in broken state (ghost styling, no commands)
- [ ] Run `.\scripts\uninstall.ps1` to recover
- [ ] After restart, VS Code is fully clean — no remnants
