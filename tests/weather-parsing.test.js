const { describe, it } = require('node:test');
const assert = require('node:assert');

// Mirrors the parsing logic in src/services/weather.js _fetch()
function parseWeatherResponse(data, city) {
    const parts = data.trim().split('|');
    if (parts.length >= 4) {
        return {
            icon: parts[0].trim(),
            temp: parts[1].trim(),
            feelsLike: parts[2].trim(),
            desc: parts[3].trim(),
            city
        };
    }
    return null;
}

describe('Weather response parsing', () => {
    it('parses a valid wttr.in response', () => {
        const result = parseWeatherResponse('☀️|+32°C|+34°C|Sunny', 'Dubai');
        assert.deepStrictEqual(result, {
            icon: '☀️',
            temp: '+32°C',
            feelsLike: '+34°C',
            desc: 'Sunny',
            city: 'Dubai'
        });
    });

    it('parses response with extra whitespace', () => {
        const result = parseWeatherResponse('  🌧️  | +18°C | +16°C | Light Rain  \n', 'London');
        assert.strictEqual(result.icon, '🌧️');
        assert.strictEqual(result.temp, '+18°C');
        assert.strictEqual(result.feelsLike, '+16°C');
        assert.strictEqual(result.desc, 'Light Rain');
        assert.strictEqual(result.city, 'London');
    });

    it('parses response with negative temperatures', () => {
        const result = parseWeatherResponse('❄️|-5°C|-12°C|Heavy Snow', 'Moscow');
        assert.strictEqual(result.temp, '-5°C');
        assert.strictEqual(result.feelsLike, '-12°C');
    });

    it('returns null for malformed response (too few parts)', () => {
        assert.strictEqual(parseWeatherResponse('just some text', 'City'), null);
    });

    it('returns null for response with only two parts', () => {
        assert.strictEqual(parseWeatherResponse('☀️|+25°C', 'City'), null);
    });

    it('handles empty description', () => {
        const result = parseWeatherResponse('☁️|+20°C|+19°C|', 'Tokyo');
        assert.strictEqual(result.desc, '');
    });

    it('handles response with pipes in description', () => {
        // wttr.in shouldn't do this, but test robustness
        const result = parseWeatherResponse('☀️|+25°C|+23°C|Partly Cloudy|Extra', 'NYC');
        assert.strictEqual(result.desc, 'Partly Cloudy');
    });
});
