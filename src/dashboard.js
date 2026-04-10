const vscode = require('vscode');

function getNonce() {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
    return text;
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

class DashboardViewProvider {
    static viewType = 'devscape.dashboardView';

    constructor(extensionUri, themeConfig) {
        this._extensionUri = extensionUri;
        this._config = themeConfig;
        this._view = undefined;
        this._weatherData = { icon: '\u2600\uFE0F', temp: '--\u00B0C', desc: '', feelsLike: '', city: '' };
        this._musicData = { track: 'Not playing', artist: '', isPlaying: false, available: true, reason: '' };
    }

    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        this._updateWebview();

        webviewView.webview.onDidReceiveMessage((msg) => {
            if (msg.type === 'control' && this._onControl) {
                this._onControl(msg.action);
            }
        });

        webviewView.onDidDispose(() => {
            this._view = undefined;
        });
    }

    onControl(callback) {
        this._onControl = callback;
    }

    updateWeather(data) {
        this._weatherData = data;
        if (this._view && this._view.webview) {
            this._view.webview.postMessage({ type: 'weather', data });
        }
    }

    updateMusic(data) {
        this._musicData = data;
        if (this._view && this._view.webview) {
            this._view.webview.postMessage({ type: 'music', data });
        }
    }

    _updateWebview() {
        if (!this._view) return;

        const config = this._config;
        const nonce = getNonce();
        const weather = this._weatherData;
        const music = this._musicData;

        // Resolve media URI for video/gif background
        const mediaExt = config.backgroundVideo.split('.').pop().toLowerCase();
        const mediaUri = this._view.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', config.id, config.backgroundVideo)
        );
        const isVideo = ['mp4', 'webm', 'ogg'].includes(mediaExt);

        // Date parts
        const now = new Date();
        const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const dayName = days[now.getDay()];
        const dayShort = dayName.substring(0, 3);
        const dateNum = now.getDate();
        const monthName = months[now.getMonth()];
        const hours = now.getHours();
        const mins = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        const timeStr = `${h12}:${mins} ${ampm}`;

        const isPlaying = music.isPlaying;
        const cityDisplay = weather.city || 'your area';

        // Music section content
        let musicHtml;
        if (!music.available) {
            musicHtml = `
            <div class="spotify">
                <div class="sp-ic">\u266B</div>
                <div class="sp-info">
                    <div class="sp-track" style="color:rgba(255,255,255,0.3)">${escapeHtml(music.reason)}</div>
                </div>
            </div>`;
        } else {
            musicHtml = `
            <div class="spotify">
                <div class="sp-ic">\u266B</div>
                <div class="sp-info">
                    <div class="sp-track">${escapeHtml(music.track)}</div>
                    ${music.artist ? `<div class="sp-artist">${escapeHtml(music.artist)}</div>` : ''}
                </div>
                <div class="sp-controls">
                    <button class="sp-btn" data-action="previous" title="Previous">\u23EE</button>
                    <button class="sp-btn sp-play" data-action="playPause" title="Play/Pause">${isPlaying ? '\u23F8' : '\u25B6'}</button>
                    <button class="sp-btn" data-action="next" title="Next">\u23ED</button>
                </div>
                ${isPlaying ? '<div class="pulse"></div>' : ''}
            </div>`;
        }

        this._view.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'nonce-${nonce}'; media-src ${this._view.webview.cspSource}; img-src ${this._view.webview.cspSource};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Dancing+Script:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Rajdhani', 'Segoe UI', system-ui, sans-serif;
            background: ${config.dashboardBodyBg};
            color: rgba(255,255,255,0.85);
            overflow: hidden;
            padding: 12px 10px 12px 4px;
            -webkit-font-smoothing: antialiased;
            position: relative;
        }
        .bg-video {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: cover;
            opacity: 0.13;
            z-index: -1;
            pointer-events: none;
        }
        .date-row {
            display: flex;
            align-items: stretch;
            min-height: 100px;
            margin-bottom: 0;
        }
        .day-col {
            display: flex;
            align-items: center;
            flex-shrink: 0;
            position: relative;
            padding-right: 10px;
            margin-right: 6px;
        }
        .day-outlined {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-family: 'Rajdhani', sans-serif;
            font-size: 42px;
            font-weight: 700;
            letter-spacing: 0.05em;
            line-height: 1;
            color: transparent;
            -webkit-text-stroke: 1.2px rgba(255,255,255,0.45);
            mask-image: linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0.06) 100%);
            -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0.06) 100%);
        }
        .day-col::after {
            content: '';
            position: absolute;
            right: 0; top: 8px; bottom: 8px;
            width: 1px;
            background: linear-gradient(to bottom, transparent 0%, rgba(${config.accentRgb},0.5) 15%, rgba(${config.accentRgb},0.5) 85%, transparent 100%);
        }
        .date-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding-left: 8px;
            position: relative;
        }
        .date-top { display: flex; align-items: baseline; justify-content: space-between; }
        .date-num { font-family: 'Rajdhani', sans-serif; font-size: 60px; font-weight: 600; line-height: 0.82; letter-spacing: -0.02em; color: rgba(255,255,255,0.92); }
        .date-time { font-family: 'Rajdhani', sans-serif; font-size: 42px; font-weight: 700; letter-spacing: 0.04em; line-height: 0.85; color: transparent; -webkit-text-stroke: 1.2px rgba(${config.accentRgb},0.55); padding-right: 2px; }
        .date-month { font-family: 'Rajdhani', sans-serif; font-size: 32px; font-weight: 400; letter-spacing: 0.2em; color: rgba(255,255,255,0.38); line-height: 1; margin-top: 0; margin-left: 2px; }
        .day-full { font-family: 'Rajdhani', sans-serif; font-size: 9px; font-weight: 600; letter-spacing: 0.35em; color: rgba(${config.accentRgb},0.4); text-transform: uppercase; margin: 4px 0 12px 4px; }
        .weather-desc { font-size: 10.5px; line-height: 1.6; color: rgba(255,255,255,0.38); margin: 4px 0 12px; padding-left: 2px; font-style: italic; }
        .weather-desc .hl { color: ${config.accent}; font-weight: 600; font-style: normal; }
        .spotify { display: flex; align-items: center; gap: 8px; padding: 0 2px; margin-top: 8px; }
        .sp-ic { font-size: 16px; color: rgba(${config.accentRgb},0.6); flex-shrink: 0; }
        .sp-info { flex: 1; min-width: 0; }
        .sp-track { font-size: 11px; font-weight: 600; color: ${isPlaying ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sp-artist { font-size: 9.5px; color: ${isPlaying ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pulse { width: 5px; height: 5px; border-radius: 50%; background: ${config.accent}; flex-shrink: 0; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.5); } }
        .sp-controls { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
        .sp-btn { background: none; border: 1px solid rgba(${config.accentRgb},0.15); color: rgba(${config.accentRgb},0.5); cursor: pointer; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 10px; padding: 0; transition: color 0.2s, border-color 0.2s, background 0.2s, transform 0.15s; line-height: 1; }
        .sp-btn:hover { color: ${config.accent}; border-color: rgba(${config.accentRgb},0.4); background: rgba(${config.accentRgb},0.08); transform: scale(1.1); }
        .sp-btn:active { transform: scale(0.95); }
        .sp-btn.sp-play { width: 26px; height: 26px; font-size: 12px; }
    </style>
</head>
<body>
    ${isVideo
        ? `<video class="bg-video" autoplay loop muted playsinline src="${mediaUri}"></video>`
        : `<img class="bg-video" src="${mediaUri}" />`
    }

    <div class="date-row">
        <div class="day-col">
            <div class="day-outlined">${dayShort}</div>
        </div>
        <div class="date-col">
            <div class="date-top">
                <div class="date-num">${dateNum}</div>
                <div class="date-time">${timeStr}</div>
            </div>
            <div class="date-month">${monthName}</div>
        </div>
    </div>

    <div class="day-full">${dayName}</div>

    <div class="weather-desc">
        ${weather.city === 'Unknown' || !weather.city
            ? 'Weather unavailable'
            : `${weather.icon} The weather in <span class="hl">${escapeHtml(cityDisplay)}</span> is <span class="hl">${escapeHtml(weather.desc || 'loading...')}</span> with temperature <span class="hl">${escapeHtml(weather.temp)}</span>${weather.feelsLike ? ` but it feels like <span class="hl">${escapeHtml(weather.feelsLike)}</span>.` : '.'}`
        }
    </div>

    ${musicHtml}

    <script nonce="${nonce}">
        const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

        function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

        function updateDateTime() {
            const now = new Date();
            const h = now.getHours();
            const m = String(now.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;

            const timeEl = document.querySelector('.date-time');
            if (timeEl) timeEl.textContent = h12 + ':' + m + ' ' + ampm;

            const numEl = document.querySelector('.date-num');
            if (numEl) numEl.textContent = now.getDate();

            const monthEl = document.querySelector('.date-month');
            if (monthEl) monthEl.textContent = months[now.getMonth()];

            const dayEl = document.querySelector('.day-outlined');
            if (dayEl) dayEl.textContent = days[now.getDay()].substring(0, 3);

            const fullEl = document.querySelector('.day-full');
            if (fullEl) fullEl.textContent = days[now.getDay()];
        }

        window.addEventListener('message', function(event) {
            const msg = event.data;
            if (msg.type === 'music') {
                const d = msg.data;
                const trackEl = document.querySelector('.sp-track');
                const artistEl = document.querySelector('.sp-artist');
                const pulseEl = document.querySelector('.pulse');
                if (!d.available) {
                    if (trackEl) { trackEl.textContent = d.reason; trackEl.style.color = 'rgba(255,255,255,0.3)'; }
                    if (artistEl) artistEl.style.display = 'none';
                    if (pulseEl) pulseEl.style.display = 'none';
                } else {
                    const playing = d.isPlaying;
                    if (trackEl) { trackEl.textContent = d.track; trackEl.style.color = playing ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'; }
                    if (artistEl) { if (d.artist) { artistEl.textContent = d.artist; artistEl.style.display = ''; } else { artistEl.style.display = 'none'; } }
                    if (pulseEl) pulseEl.style.display = playing ? '' : 'none';
                    // Update play/pause button icon
                    const playBtn = document.querySelector('.sp-play');
                    if (playBtn) playBtn.textContent = playing ? '\u23F8' : '\u25B6';
                }
            }
            if (msg.type === 'weather') {
                const d = msg.data;
                const el = document.querySelector('.weather-desc');
                if (el) {
                    if (d.city === 'Unknown' || !d.city) {
                        el.textContent = 'Weather unavailable';
                    } else {
                        el.innerHTML = esc(d.icon) + ' The weather in <span class="hl">' + esc(d.city) + '</span> is <span class="hl">' + esc(d.desc) + '</span> with temperature <span class="hl">' + esc(d.temp) + '</span>' + (d.feelsLike ? ' but it feels like <span class="hl">' + esc(d.feelsLike) + '</span>.' : '.');
                    }
                }
            }
        });

        // Music control buttons
        const vscode = acquireVsCodeApi();
        document.querySelectorAll('.sp-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                vscode.postMessage({ type: 'control', action: btn.dataset.action });
            });
        });

        setInterval(updateDateTime, 1000);
    </script>
</body>
</html>`;
    }
}

module.exports = { DashboardViewProvider };
