const { describe, it } = require('node:test');
const assert = require('node:assert');

// These regexes must match the ones in src/injector.js exactly
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

describe('Injection marker regex', () => {

    describe('Devscape CSS markers', () => {
        it('strips arctic-sands CSS injection', () => {
            const input = 'before\n/*devscape-arctic-sands-css-start*/\n.activitybar { color: red; }\n/*devscape-arctic-sands-css-end*/after';
            assert.strictEqual(stripAll(input), 'beforeafter');
        });

        it('strips multi-line CSS injection', () => {
            const input = 'existing css\n/*devscape-arctic-sands-css-start*/\nline1\nline2\nline3\n/*devscape-arctic-sands-css-end*/more css';
            assert.strictEqual(stripAll(input), 'existing cssmore css');
        });

        it('strips any future theme CSS injection', () => {
            const input = 'before\n/*devscape-lofi-nights-v-two-css-start*/\n.stuff{}\n/*devscape-lofi-nights-v-two-css-end*/after';
            assert.strictEqual(stripAll(input), 'beforeafter');
        });

        it('strips multiple injections in same file', () => {
            const input = 'a\n/*devscape-arctic-sands-css-start*/x/*devscape-arctic-sands-css-end*/b\n/*devscape-cyber-punk-css-start*/y/*devscape-cyber-punk-css-end*/c';
            assert.strictEqual(stripAll(input), 'abc');
        });
    });

    describe('Devscape JS markers', () => {
        it('strips JS injection', () => {
            const input = 'code\n/*devscape-arctic-sands-js-start*/;(function(){})();/*devscape-arctic-sands-js-end*/end';
            assert.strictEqual(stripAll(input), 'codeend');
        });
    });

    describe('Legacy markers', () => {
        it('strips arctic-sands legacy CSS', () => {
            const input = 'before\n/* arctic-sands-start */\nold css\n/* arctic-sands-end */\nafter';
            assert.strictEqual(stripAll(input), 'beforeafter');
        });

        it('strips my-editor-background legacy CSS', () => {
            const input = 'before\n/* my-editor-background-start */\nold\n/* my-editor-background-end */\nafter';
            assert.strictEqual(stripAll(input), 'beforeafter');
        });

        it('strips urban-dark legacy CSS', () => {
            const input = 'before\n/* urban-dark-start */\nold\n/* urban-dark-end */\nafter';
            assert.strictEqual(stripAll(input), 'beforeafter');
        });

        it('strips lofi-nights legacy JS', () => {
            const input = 'code\n/*lofi-nights-js-start*/old js/*lofi-nights-js-end*/end';
            assert.strictEqual(stripAll(input), 'codeend');
        });

        it('strips urban-dark legacy JS (alt format)', () => {
            const input = 'code\n/*urban-dark-start*/old/*urban-dark-end*/end';
            assert.strictEqual(stripAll(input), 'codeend');
        });

        it('strips my-bg legacy JS', () => {
            const input = 'code\n/*my-bg-start*/old/*my-bg-end*/end';
            assert.strictEqual(stripAll(input), 'codeend');
        });
    });

    describe('Preserves non-injection content', () => {
        it('does not touch normal CSS', () => {
            const input = '.activitybar { color: blue; }\n.sidebar { background: red; }';
            assert.strictEqual(stripAll(input), input);
        });

        it('does not touch normal comments', () => {
            const input = '/* This is a normal comment */\n.tab { border: none; }';
            assert.strictEqual(stripAll(input), input);
        });

        it('returns empty string for empty input', () => {
            assert.strictEqual(stripAll(''), '');
        });
    });
});
