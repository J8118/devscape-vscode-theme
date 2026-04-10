const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMP_DIR = path.join(__dirname, '.tmp-uninstall-test');

// Simulated workbench CSS with Devscape + legacy injections mixed into normal content
const FAKE_WORKBENCH_CSS = `.monaco-editor { color: #fff; }
.sidebar { background: #000; }
/*devscape-arctic-sands-css-start*/
/* DEVSCAPE UI — arctic-sands */
.activitybar { border-right: 1px solid #1a2332 !important; }
.tab.active { border-top-color: #00c8ff !important; }
/*devscape-arctic-sands-css-end*/
.statusbar { height: 22px; }
/* arctic-sands-start */
.old-stuff { color: red; }
/* arctic-sands-end */
.breadcrumbs { font-size: 11px; }`;

const FAKE_WORKBENCH_JS = `(function(){console.log("vscode startup");})();
/*devscape-arctic-sands-js-start*/;(function(){var _sid='devscape-arctic-sands-bg',_css='body{background:url(data:image/jpeg;base64,abc)}';document.head.appendChild(el);})();/*devscape-arctic-sands-js-end*/
/*arctic-sands-js-start*/;(function(){old();})();/*arctic-sands-js-end*/
/*my-bg-start*/;(function(){oldest();})();/*my-bg-end*/
console.log("end of file");`;

// Expected clean output — only the non-injected content remains
const EXPECTED_CLEAN_CSS = `.monaco-editor { color: #fff; }
.sidebar { background: #000; }
.statusbar { height: 22px; }
.breadcrumbs { font-size: 11px; }`;

const EXPECTED_CLEAN_JS = `(function(){console.log("vscode startup");})();
console.log("end of file");`;

describe('Uninstall cleanup', () => {

    before(() => {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    });

    after(() => {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    describe('Node.js regex cleanup (injector.js logic)', () => {
        // These must match src/injector.js exactly
        const DEVSCAPE_CSS_RE = /\n\/\*devscape-[a-z-]+-css-start\*\/[\s\S]*?\/\*devscape-[a-z-]+-css-end\*\//g;
        const DEVSCAPE_JS_RE  = /\n\/\*devscape-[a-z-]+-js-start\*\/[\s\S]*?\/\*devscape-[a-z-]+-js-end\*\//g;
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

        it('strips all injections from CSS, preserving original content', () => {
            const result = stripAll(FAKE_WORKBENCH_CSS);
            // Should not contain any injection markers
            assert.ok(!result.includes('devscape-'), 'Still contains devscape markers');
            assert.ok(!result.includes('arctic-sands-start'), 'Still contains legacy markers');
            // Should preserve original VS Code CSS
            assert.ok(result.includes('.monaco-editor'), 'Lost original .monaco-editor rule');
            assert.ok(result.includes('.sidebar'), 'Lost original .sidebar rule');
            assert.ok(result.includes('.statusbar'), 'Lost original .statusbar rule');
            assert.ok(result.includes('.breadcrumbs'), 'Lost original .breadcrumbs rule');
        });

        it('strips all injections from JS, preserving original content', () => {
            const result = stripAll(FAKE_WORKBENCH_JS);
            assert.ok(!result.includes('devscape-'), 'Still contains devscape markers');
            assert.ok(!result.includes('arctic-sands-js'), 'Still contains legacy JS markers');
            assert.ok(!result.includes('my-bg-start'), 'Still contains my-bg markers');
            // Should preserve original VS Code JS
            assert.ok(result.includes('vscode startup'), 'Lost original startup code');
            assert.ok(result.includes('end of file'), 'Lost end of file code');
        });
    });

    describe('PowerShell regex cleanup (uninstall.ps1 logic)', () => {
        it('strips Devscape CSS injections', () => {
            const cssFile = path.join(TEMP_DIR, 'test.css');
            fs.writeFileSync(cssFile, FAKE_WORKBENCH_CSS, 'utf-8');

            execSync(`powershell -Command "$css = Get-Content '${cssFile}' -Raw; $css = $css -replace '(?s)\\n/\\*devscape-[a-z-]+-css-start\\*/.*?/\\*devscape-[a-z-]+-css-end\\*/', ''; Set-Content '${cssFile}' -Value $css -NoNewline"`, { stdio: 'pipe' });

            const result = fs.readFileSync(cssFile, 'utf-8');
            assert.ok(!result.includes('devscape-arctic-sands-css-start'), 'PowerShell failed to strip devscape CSS markers');
            assert.ok(result.includes('.monaco-editor'), 'PowerShell damaged original CSS content');
            assert.ok(result.includes('.statusbar'), 'PowerShell damaged original CSS content');
        });

        it('strips Devscape JS injections', () => {
            const jsFile = path.join(TEMP_DIR, 'test.js');
            fs.writeFileSync(jsFile, FAKE_WORKBENCH_JS, 'utf-8');

            execSync(`powershell -Command "$js = Get-Content '${jsFile}' -Raw; $js = $js -replace '(?s)\\n/\\*devscape-[a-z-]+-js-start\\*/.*?/\\*devscape-[a-z-]+-js-end\\*/', ''; Set-Content '${jsFile}' -Value $js -NoNewline"`, { stdio: 'pipe' });

            const result = fs.readFileSync(jsFile, 'utf-8');
            assert.ok(!result.includes('devscape-arctic-sands-js-start'), 'PowerShell failed to strip devscape JS markers');
            assert.ok(result.includes('vscode startup'), 'PowerShell damaged original JS content');
        });

        it('strips legacy CSS injections', () => {
            const cssFile = path.join(TEMP_DIR, 'test-legacy.css');
            fs.writeFileSync(cssFile, FAKE_WORKBENCH_CSS, 'utf-8');

            execSync(`powershell -Command "$css = Get-Content '${cssFile}' -Raw; $css = $css -replace '(?s)\\n/\\* (?:my-editor-background|arctic-sands|lofi-nights|urban-dark)-start \\*/.*?/\\* (?:my-editor-background|arctic-sands|lofi-nights|urban-dark)-end \\*/\\n', ''; Set-Content '${cssFile}' -Value $css -NoNewline"`, { stdio: 'pipe' });

            const result = fs.readFileSync(cssFile, 'utf-8');
            assert.ok(!result.includes('arctic-sands-start'), 'PowerShell failed to strip legacy CSS markers');
            assert.ok(!result.includes('.old-stuff'), 'PowerShell failed to strip legacy CSS content');
        });

        it('strips legacy JS injections (my-bg)', () => {
            const jsFile = path.join(TEMP_DIR, 'test-legacy.js');
            fs.writeFileSync(jsFile, FAKE_WORKBENCH_JS, 'utf-8');

            execSync(`powershell -Command "$js = Get-Content '${jsFile}' -Raw; $js = $js -replace '(?s)\\n/\\*my-bg-start\\*/.*?/\\*my-bg-end\\*/', ''; Set-Content '${jsFile}' -Value $js -NoNewline"`, { stdio: 'pipe' });

            const result = fs.readFileSync(jsFile, 'utf-8');
            assert.ok(!result.includes('my-bg-start'), 'PowerShell failed to strip my-bg markers');
        });
    });

    describe('Extension registry cleanup', () => {
        it('removes devscape entries from extensions.json', () => {
            const registryFile = path.join(TEMP_DIR, 'extensions.json');
            const fakeRegistry = [
                { identifier: { id: 'ms-python.python' }, version: '2024.1.0' },
                { identifier: { id: 'j8118.devscape-vscode-theme' }, version: '1.0.0' },
                { identifier: { id: 'local.arctic-sands-theme' }, version: '0.0.1' },
                { identifier: { id: 'esbenp.prettier-vscode' }, version: '10.0.0' }
            ];
            fs.writeFileSync(registryFile, JSON.stringify(fakeRegistry), 'utf-8');

            // Simulate the cleanup logic from uninstall.ps1
            const data = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
            const cleaned = data.filter(e =>
                !e.identifier.id.includes('devscape') &&
                !e.identifier.id.includes('arctic-sands') &&
                !e.identifier.id.includes('lofi-nights') &&
                !e.identifier.id.includes('still-horizon') &&
                !e.identifier.id.includes('my-editor-background')
            );
            fs.writeFileSync(registryFile, JSON.stringify(cleaned), 'utf-8');

            const result = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
            assert.strictEqual(result.length, 2, `Should have 2 entries, got ${result.length}`);
            assert.strictEqual(result[0].identifier.id, 'ms-python.python');
            assert.strictEqual(result[1].identifier.id, 'esbenp.prettier-vscode');
        });

        it('handles empty registry', () => {
            const registryFile = path.join(TEMP_DIR, 'empty-registry.json');
            fs.writeFileSync(registryFile, '[]', 'utf-8');

            const data = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
            const cleaned = data.filter(e => !e.identifier.id.includes('devscape'));
            fs.writeFileSync(registryFile, JSON.stringify(cleaned), 'utf-8');

            const result = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
            assert.strictEqual(result.length, 0);
        });

        it('preserves all entries when none match', () => {
            const registryFile = path.join(TEMP_DIR, 'no-match-registry.json');
            const fakeRegistry = [
                { identifier: { id: 'ms-python.python' }, version: '1.0.0' },
                { identifier: { id: 'esbenp.prettier-vscode' }, version: '2.0.0' }
            ];
            fs.writeFileSync(registryFile, JSON.stringify(fakeRegistry), 'utf-8');

            const data = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
            const cleaned = data.filter(e => !e.identifier.id.includes('devscape'));
            fs.writeFileSync(registryFile, JSON.stringify(cleaned), 'utf-8');

            const result = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
            assert.strictEqual(result.length, 2);
        });
    });

    describe('Extension folder cleanup', () => {
        it('identifies devscape and .BROKEN folders', () => {
            // Simulate the folder matching logic
            const fakeFolders = [
                'ms-python.python-2024.1.0',
                'j8118.devscape-vscode-theme-1.0.0',
                'j8118.devscape-vscode-theme-1.0.0.BROKEN',
                'local.arctic-sands-theme-0.0.1',
                'esbenp.prettier-vscode-10.0.0'
            ];

            const toRemove = fakeFolders.filter(f =>
                f.includes('devscape') ||
                f.includes('arctic-sands') ||
                f.includes('lofi-nights') ||
                f.includes('still-horizon') ||
                f.includes('my-editor-background')
            );

            assert.deepStrictEqual(toRemove, [
                'j8118.devscape-vscode-theme-1.0.0',
                'j8118.devscape-vscode-theme-1.0.0.BROKEN',
                'local.arctic-sands-theme-0.0.1'
            ]);

            const toKeep = fakeFolders.filter(f => !toRemove.includes(f));
            assert.deepStrictEqual(toKeep, [
                'ms-python.python-2024.1.0',
                'esbenp.prettier-vscode-10.0.0'
            ]);
        });
    });
});
