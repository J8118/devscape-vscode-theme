const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '..', 'src', 'themes');
const THEME_JSON_DIR = path.join(__dirname, '..', 'themes');
const MEDIA_DIR = path.join(__dirname, '..', 'media');

// Required fields every theme config must have
const REQUIRED_FIELDS = [
    'id', 'label', 'accent', 'accentRgb', 'glowColor',
    'borderColor', 'backgroundImage', 'backgroundVideo',
    'backgroundOpacity', 'dashboardBodyBg', 'injectionMarkers'
];

const REQUIRED_MARKERS = ['cssStart', 'cssEnd', 'jsStart', 'jsEnd'];

// Load all theme configs dynamically
const themeFiles = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.js'));

describe('Theme configs', () => {
    it('has at least one theme', () => {
        assert.ok(themeFiles.length > 0, 'No theme config files found in src/themes/');
    });

    for (const file of themeFiles) {
        const config = require(path.join(THEMES_DIR, file));
        const name = config.id || file;

        describe(`${name}`, () => {
            it('has all required fields', () => {
                for (const field of REQUIRED_FIELDS) {
                    assert.ok(config[field] !== undefined, `Missing required field: ${field}`);
                }
            });

            it('has all required injection markers', () => {
                for (const marker of REQUIRED_MARKERS) {
                    assert.ok(config.injectionMarkers[marker], `Missing injection marker: ${marker}`);
                }
            });

            it('injection markers contain the theme id', () => {
                for (const marker of REQUIRED_MARKERS) {
                    assert.ok(
                        config.injectionMarkers[marker].includes(config.id),
                        `Marker ${marker} should contain theme id "${config.id}"`
                    );
                }
            });

            it('injection markers use devscape prefix', () => {
                assert.ok(
                    config.injectionMarkers.cssStart.startsWith('/*devscape-'),
                    `CSS start marker should begin with /*devscape-`
                );
            });

            it('accent is a valid hex color', () => {
                assert.match(config.accent, /^#[0-9a-fA-F]{6}$/, `accent should be a 6-digit hex color, got: ${config.accent}`);
            });

            it('accentRgb is valid comma-separated RGB', () => {
                assert.match(config.accentRgb, /^\d{1,3},\d{1,3},\d{1,3}$/, `accentRgb should be "R,G,B" format, got: ${config.accentRgb}`);
            });

            it('backgroundOpacity is between 0 and 1', () => {
                assert.ok(config.backgroundOpacity >= 0 && config.backgroundOpacity <= 1,
                    `backgroundOpacity should be 0-1, got: ${config.backgroundOpacity}`);
            });

            it('has a matching color token JSON file', () => {
                const jsonPath = path.join(THEME_JSON_DIR, `${config.id}.json`);
                assert.ok(fs.existsSync(jsonPath), `Missing themes/${config.id}.json`);
            });

            it('has a media directory with required assets', () => {
                const mediaPath = path.join(MEDIA_DIR, config.id);
                assert.ok(fs.existsSync(mediaPath), `Missing media/${config.id}/ directory`);

                const bgImage = path.join(mediaPath, config.backgroundImage);
                assert.ok(fs.existsSync(bgImage), `Missing media/${config.id}/${config.backgroundImage}`);

                const bgVideo = path.join(mediaPath, config.backgroundVideo);
                assert.ok(fs.existsSync(bgVideo), `Missing media/${config.id}/${config.backgroundVideo}`);
            });

            it('label matches the theme JSON name', () => {
                const jsonPath = path.join(THEME_JSON_DIR, `${config.id}.json`);
                const themeJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                assert.strictEqual(config.label, themeJson.name,
                    `Config label "${config.label}" doesn't match theme JSON name "${themeJson.name}"`);
            });
        });
    }
});
