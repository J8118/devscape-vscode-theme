const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { buildCss } = require('./css-template');

// ── Path helpers ────────────────────────────────────────────────────────────
function getWorkbenchDir() {
    return path.join(vscode.env.appRoot, 'out', 'vs', 'workbench');
}
function getWorkbenchCssPath() {
    return path.join(getWorkbenchDir(), 'workbench.desktop.main.css');
}
function getWorkbenchJsPath() {
    return path.join(getWorkbenchDir(), 'workbench.desktop.main.js');
}

// ── Cleanup regexes ─────────────────────────────────────────────────────────
// Matches ALL Devscape injection blocks (any theme id)
const DEVSCAPE_CSS_RE = /\n\/\*devscape-[a-z-]+-css-start\*\/[\s\S]*?\/\*devscape-[a-z-]+-css-end\*\//g;
const DEVSCAPE_JS_RE  = /\n\/\*devscape-[a-z-]+-js-start\*\/[\s\S]*?\/\*devscape-[a-z-]+-js-end\*\//g;

// Legacy markers from pre-Devscape versions
const LEGACY_CSS_RE = /\n\/\* (?:my-editor-background|arctic-sands|lofi-nights|urban-dark)-start \*\/[\s\S]*?\/\* (?:my-editor-background|arctic-sands|lofi-nights|urban-dark)-end \*\/\n/g;
const LEGACY_JS_RE  = /\n\/\*(?:urban-dark|lofi-nights|arctic-sands)-js-start\*\/[\s\S]*?\/\*(?:urban-dark|lofi-nights|arctic-sands)-js-end\*\//g;
const LEGACY_JS_RE2 = /\n\/\*urban-dark-start\*\/[\s\S]*?\/\*urban-dark-end\*\//g;
const LEGACY_JS_RE3 = /\n\/\*my-bg-start\*\/[\s\S]*?\/\*my-bg-end\*\//g;

function stripAll(content) {
    return content
        .replace(DEVSCAPE_CSS_RE, '')
        .replace(DEVSCAPE_JS_RE, '')
        .replace(LEGACY_CSS_RE, '')
        .replace(LEGACY_JS_RE, '')
        .replace(LEGACY_JS_RE2, '')
        .replace(LEGACY_JS_RE3, '');
}

// ── Permission check ────────────────────────────────────────────────────────
function canWrite(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.W_OK);
        return true;
    } catch {
        return false;
    }
}

// ── Apply ───────────────────────────────────────────────────────────────────
function apply(config, extensionPath, opacityOverride) {
    const cssPath = getWorkbenchCssPath();
    const jsPath = getWorkbenchJsPath();

    // Permission check
    if (!canWrite(cssPath) || !canWrite(jsPath)) {
        vscode.window.showErrorMessage(
            'Devscape needs to modify VS Code system files. Please restart VS Code as Administrator (Windows) or with sudo (macOS/Linux).'
        );
        return false;
    }

    // ── 1. CSS injection ──
    let css;
    try {
        css = fs.readFileSync(cssPath, 'utf-8');
    } catch (e) {
        vscode.window.showErrorMessage(`Devscape: Could not read workbench CSS: ${e.message}`);
        return false;
    }

    css = stripAll(css);

    const opacity = opacityOverride !== undefined ? opacityOverride : config.backgroundOpacity;
    const themeCss = buildCss(config);
    const wrappedCss = `\n${config.injectionMarkers.cssStart}\n${themeCss}\n${config.injectionMarkers.cssEnd}`;

    try {
        fs.writeFileSync(cssPath, css + wrappedCss, 'utf-8');
    } catch (e) {
        vscode.window.showErrorMessage(`Devscape: Failed to write CSS. Run VS Code as Admin.\n${e.message}`);
        return false;
    }

    // ── 2. JS injection (background image) ──
    let jsContent;
    try {
        jsContent = fs.readFileSync(jsPath, 'utf-8');
    } catch (e) {
        vscode.window.showErrorMessage(`Devscape: Could not read workbench JS: ${e.message}`);
        return false;
    }

    jsContent = stripAll(jsContent);

    // Base64-encode background image
    const imgPath = path.join(extensionPath, 'media', config.id, config.backgroundImage);
    let imgDataUri;
    try {
        const imgBuffer = fs.readFileSync(imgPath);
        const hdr = imgBuffer.subarray(0, 4).toString('ascii');
        let mime = 'image/jpeg';
        if (hdr === 'RIFF') mime = 'image/webp';
        else if (hdr.startsWith('GIF8')) mime = 'image/gif';
        imgDataUri = `data:${mime};base64,` + imgBuffer.toString('base64');
    } catch (e) {
        vscode.window.showErrorMessage(`Devscape: Could not read background image: ${e.message}`);
        return false;
    }

    const bgCss = `[id='workbench.parts.editor'] .split-view-view .editor-instance>.monaco-editor>.overflow-guard>.monaco-scrollable-element::after{content:'';width:100%;height:100%;position:fixed;top:0;left:0;z-index:99;pointer-events:none;background-image:url("${imgDataUri}");background-size:cover;background-position:center center;background-repeat:no-repeat;opacity:${opacity};}[id='workbench.parts.editor'] .split-view-view .editor-container .overflow-guard>.monaco-scrollable-element>.monaco-editor-background{background:none!important;}`;

    const styleId = `devscape-${config.id}-bg`;
    const jsPayload = `\n${config.injectionMarkers.jsStart};(function(){var _sid='${styleId}',_css=${JSON.stringify(bgCss)};function inject(){if(!document.head)return;var el=document.getElementById(_sid);if(!el){el=document.createElement('style');el.id=_sid;el.textContent=_css;}if(el!==document.head.lastElementChild)document.head.appendChild(el);}inject();setTimeout(inject,400);setTimeout(inject,1500);new MutationObserver(function(){inject();}).observe(document.documentElement,{childList:true,subtree:false});})();${config.injectionMarkers.jsEnd}`;

    try {
        fs.writeFileSync(jsPath, jsContent + jsPayload, 'utf-8');
    } catch (e) {
        vscode.window.showErrorMessage(`Devscape: Failed to write JS. Run VS Code as Admin.\n${e.message}`);
        return false;
    }

    promptReload('Devscape: Background & UI applied!');
    return true;
}

// ── Remove ──────────────────────────────────────────────────────────────────
function remove() {
    const cssPath = getWorkbenchCssPath();
    const jsPath = getWorkbenchJsPath();

    try {
        let css = fs.readFileSync(cssPath, 'utf-8');
        css = stripAll(css);
        fs.writeFileSync(cssPath, css, 'utf-8');
    } catch (_) {}

    try {
        let js = fs.readFileSync(jsPath, 'utf-8');
        js = stripAll(js);
        fs.writeFileSync(jsPath, js, 'utf-8');
    } catch (_) {}

    promptReload('Devscape: Background & UI removed!');
}

// ── Check ───────────────────────────────────────────────────────────────────
function isInjected(config) {
    try {
        const css = fs.readFileSync(getWorkbenchCssPath(), 'utf-8');
        return css.includes(config.injectionMarkers.cssStart);
    } catch {
        return false;
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function promptReload(message) {
    vscode.window.showInformationMessage(message + ' Reload to see changes.', 'Reload Now')
        .then(action => {
            if (action === 'Reload Now') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
}

module.exports = { apply, remove, isInjected };
