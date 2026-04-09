const https = require('https');
const http = require('http');

class WeatherService {
    constructor() {
        this._interval = null;
        this._listeners = [];
        this._city = '';
        this._lastData = { icon: '\u2600\uFE0F', temp: '--\u00B0C', desc: '', feelsLike: '', city: '' };
    }

    async start(city) {
        this.stop();

        if (city) {
            this._city = city;
        } else {
            this._city = await this._detectCity();
        }

        this._fetch();
        this._interval = setInterval(() => this._fetch(), 300000); // 5 minutes
    }

    stop() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }

    onUpdate(callback) {
        this._listeners.push(callback);
    }

    _notify(data) {
        this._lastData = data;
        for (const cb of this._listeners) {
            cb(data);
        }
    }

    _detectCity() {
        return new Promise((resolve) => {
            const req = http.get('http://ip-api.com/json/?fields=city', { timeout: 5000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.city || 'Unknown');
                    } catch {
                        resolve('Unknown');
                    }
                });
            });
            req.on('error', () => resolve('Unknown'));
            req.on('timeout', () => { req.destroy(); resolve('Unknown'); });
        });
    }

    _fetch() {
        if (!this._city || this._city === 'Unknown') {
            this._notify({ icon: '', temp: '', desc: '', feelsLike: '', city: this._city });
            return;
        }

        const url = `https://wttr.in/${encodeURIComponent(this._city)}?format=%c|%t|%f|%C`;
        https.get(url, { headers: { 'User-Agent': 'curl/7.0' }, timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parts = data.trim().split('|');
                    if (parts.length >= 4) {
                        this._notify({
                            icon: parts[0].trim(),
                            temp: parts[1].trim(),
                            feelsLike: parts[2].trim(),
                            desc: parts[3].trim(),
                            city: this._city
                        });
                    }
                } catch {
                    // Keep last known data
                }
            });
        }).on('error', () => {
            // Keep last known data
        });
    }
}

module.exports = { WeatherService };
