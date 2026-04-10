const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const EXT_DIR = path.join(process.env.USERPROFILE, '.vscode', 'extensions');
const REGISTRY_FILE = path.join(EXT_DIR, 'extensions.json');

describe('Install verification', () => {

    describe('VS Code CLI availability', () => {
        it('code.cmd exists at expected path', () => {
            const codeCli = path.join(process.env.LOCALAPPDATA, 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd');
            assert.ok(fs.existsSync(codeCli), `code.cmd not found at ${codeCli}`);
        });
    });

    describe('vsce package', () => {
        it('produces a valid .vsix file', () => {
            const vsixPath = path.join(PROJECT_ROOT, 'test-output.vsix');
            try {
                execSync(`vsce package --out test-output.vsix`, { cwd: PROJECT_ROOT, stdio: 'pipe' });
                assert.ok(fs.existsSync(vsixPath), '.vsix file was not created');

                const stats = fs.statSync(vsixPath);
                assert.ok(stats.size > 100000, `.vsix is suspiciously small (${stats.size} bytes)`);
            } finally {
                if (fs.existsSync(vsixPath)) fs.unlinkSync(vsixPath);
            }
        });
    });

    describe('Install script structure', () => {
        it('install.ps1 exists', () => {
            assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'scripts', 'install.ps1')));
        });

        it('install.ps1 uses code.cmd (not bare code)', () => {
            const content = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'install.ps1'), 'utf-8');
            assert.ok(content.includes('code.cmd'), 'install.ps1 should use code.cmd, not bare code command');
        });

        it('install.ps1 has verification step', () => {
            const content = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'install.ps1'), 'utf-8');
            assert.ok(content.includes('Verifying installation'), 'install.ps1 should verify the extension was installed');
        });

        it('install.ps1 does not swallow install errors with Out-Null', () => {
            const content = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'install.ps1'), 'utf-8');
            // The install line specifically should NOT pipe to Out-Null
            const installLine = content.split('\n').find(l => l.includes('--install-extension') && l.includes('devscape'));
            if (installLine) {
                assert.ok(!installLine.includes('Out-Null'), 'Install command should not swallow output with Out-Null');
            }
        });
    });

    describe('Uninstall script structure', () => {
        it('uninstall.ps1 exists', () => {
            assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'scripts', 'uninstall.ps1')));
        });

        it('uninstall.ps1 searches for workbench files dynamically', () => {
            const content = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'uninstall.ps1'), 'utf-8');
            assert.ok(content.includes('Get-ChildItem') && content.includes('workbench.desktop.main.css'),
                'uninstall.ps1 should search for workbench files dynamically (VS Code uses version hash folders)');
        });

        it('uninstall.ps1 cleans extension registry', () => {
            const content = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'uninstall.ps1'), 'utf-8');
            assert.ok(content.includes('extensions.json'), 'uninstall.ps1 should clean extensions.json');
        });

        it('uninstall.ps1 handles .BROKEN folders', () => {
            const content = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'uninstall.ps1'), 'utf-8');
            assert.ok(content.includes('devscape'), 'uninstall.ps1 should match devscape folders (including .BROKEN variants)');
        });
    });

    describe('Currently installed state', () => {
        it('extension folder exists', () => {
            const folders = fs.readdirSync(EXT_DIR).filter(f => f.includes('devscape'));
            assert.ok(folders.length > 0, `No devscape folder found in ${EXT_DIR}. Run install.ps1 first.`);
        });

        it('extension has package.json', () => {
            const folders = fs.readdirSync(EXT_DIR).filter(f => f.includes('devscape'));
            if (folders.length === 0) { assert.fail('Extension not installed'); return; }
            const pkgPath = path.join(EXT_DIR, folders[0], 'package.json');
            assert.ok(fs.existsSync(pkgPath), 'Installed extension missing package.json');
        });

        it('extension has src/extension.js', () => {
            const folders = fs.readdirSync(EXT_DIR).filter(f => f.includes('devscape'));
            if (folders.length === 0) { assert.fail('Extension not installed'); return; }
            const extPath = path.join(EXT_DIR, folders[0], 'src', 'extension.js');
            assert.ok(fs.existsSync(extPath), 'Installed extension missing src/extension.js');
        });

        it('extension has the latest css-template.js', () => {
            const folders = fs.readdirSync(EXT_DIR).filter(f => f.includes('devscape'));
            if (folders.length === 0) { assert.fail('Extension not installed'); return; }
            const cssPath = path.join(EXT_DIR, folders[0], 'src', 'css-template.js');
            const content = fs.readFileSync(cssPath, 'utf-8');
            // Verify the activity bar fix is present
            assert.ok(content.includes('margin: 3px 0'), 'Installed css-template.js is stale — missing activity bar fix (margin: 3px 0)');
            // Verify rounded tabs are reverted
            assert.ok(!content.includes('border-radius: 8px 8px 0 0'), 'Installed css-template.js is stale — still has rounded tab corners');
        });

        it('extension is registered in extensions.json', () => {
            if (!fs.existsSync(REGISTRY_FILE)) { assert.fail('extensions.json not found'); return; }
            const data = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
            const entry = data.find(e => e.identifier.id.includes('devscape'));
            assert.ok(entry, 'Devscape not found in extensions.json registry');
        });
    });
});
