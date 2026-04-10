const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildCss } = require('../src/css-template');

const arcticSands = require('../src/themes/arctic-sands');

describe('buildCss', () => {
    const css = buildCss(arcticSands);

    it('returns a non-empty string', () => {
        assert.strictEqual(typeof css, 'string');
        assert.ok(css.length > 1000, `CSS should be substantial, got ${css.length} chars`);
    });

    it('has no unresolved template placeholders', () => {
        assert.ok(!css.includes('${'), 'Found unresolved ${} placeholder in CSS output');
        assert.ok(!css.includes('undefined'), 'Found "undefined" in CSS output');
        assert.ok(!css.includes('NaN'), 'Found "NaN" in CSS output');
    });

    it('interpolates the accent color', () => {
        assert.ok(css.includes(arcticSands.accent), `CSS should contain accent color ${arcticSands.accent}`);
    });

    it('interpolates the accent RGB values', () => {
        assert.ok(css.includes(arcticSands.accentRgb), `CSS should contain accentRgb ${arcticSands.accentRgb}`);
    });

    it('interpolates the border color', () => {
        assert.ok(css.includes(arcticSands.borderColor), `CSS should contain borderColor ${arcticSands.borderColor}`);
    });

    it('interpolates the glow color', () => {
        assert.ok(css.includes(arcticSands.glowColor), `CSS should contain glowColor ${arcticSands.glowColor}`);
    });

    it('contains activity bar rules', () => {
        assert.ok(css.includes('.activitybar'), 'Missing .activitybar rules');
    });

    it('contains sidebar rules', () => {
        assert.ok(css.includes('.sidebar'), 'Missing .sidebar rules');
    });

    it('contains tab rules', () => {
        assert.ok(css.includes('.tab'), 'Missing .tab rules');
    });

    it('contains command palette rules', () => {
        assert.ok(css.includes('.quick-input-widget'), 'Missing .quick-input-widget rules');
    });

    it('contains hover widget rules', () => {
        assert.ok(css.includes('.monaco-hover'), 'Missing .monaco-hover rules');
    });

    it('contains notification rules', () => {
        assert.ok(css.includes('.notification-toast'), 'Missing .notification-toast rules');
    });

    it('contains animation keyframes', () => {
        assert.ok(css.includes('@keyframes u-glow'), 'Missing u-glow animation');
        assert.ok(css.includes('@keyframes u-fade-in'), 'Missing u-fade-in animation');
        assert.ok(css.includes('@keyframes u-scale-in'), 'Missing u-scale-in animation');
    });

    it('uses zero horizontal margin on activity bar items (no shifting)', () => {
        assert.ok(css.includes('margin: 3px 0'), 'Activity bar items should have margin: 3px 0 (zero horizontal) to prevent shifting');
        assert.ok(!css.includes('margin: 3px 7px'), 'Activity bar items should NOT have 7px horizontal margin');
    });

    it('works with a different theme config', () => {
        const fakeTheme = {
            id: 'test-theme',
            accent: '#ff00ff',
            accentRgb: '255,0,255',
            glowColor: 'rgba(255,0,255,0.3)',
            borderColor: '#333333',
        };
        const fakeCss = buildCss(fakeTheme);
        assert.ok(fakeCss.includes('#ff00ff'), 'Should interpolate custom accent');
        assert.ok(fakeCss.includes('255,0,255'), 'Should interpolate custom accentRgb');
        assert.ok(fakeCss.includes('#333333'), 'Should interpolate custom borderColor');
        assert.ok(!fakeCss.includes('#00c8ff'), 'Should NOT contain Arctic Sands accent');
    });
});
