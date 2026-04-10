const { exec } = require('child_process');

class MusicService {
    constructor() {
        this._interval = null;
        this._listeners = [];
        this._platform = process.platform;
        this._failCount = 0;
        this._maxFails = 3;
        this._lastData = { track: 'Not playing', artist: '', isPlaying: false, available: true, reason: '' };
    }

    start() {
        this.stop();
        this._failCount = 0;

        if (!this._getCommand()) {
            this._notify({
                track: '', artist: '', isPlaying: false,
                available: false, reason: 'Music detection unavailable on this system'
            });
            return;
        }

        this._poll();
        this._interval = setInterval(() => this._poll(), 3000);
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

    _getCommand() {
        switch (this._platform) {
            case 'win32':
                return 'powershell -Command "(Get-Process spotify -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle}).MainWindowTitle"';
            case 'darwin':
                return `osascript -e 'tell application "System Events" to set isRunning to (name of processes) contains "Spotify"' -e 'if isRunning then' -e 'tell application "Spotify" to return artist of current track & " - " & name of current track' -e 'else' -e 'return ""' -e 'end if'`;
            case 'linux':
                return `dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get string:'org.mpris.MediaPlayer2.Player' string:'Metadata' 2>/dev/null`;
            default:
                return null;
        }
    }

    _poll() {
        const cmd = this._getCommand();
        if (!cmd) return;

        exec(cmd, { timeout: 5000 }, (err, stdout) => {
            if (err) {
                this._failCount++;
                if (this._failCount >= this._maxFails) {
                    this.stop();
                    this._notify({
                        track: '', artist: '', isPlaying: false,
                        available: false, reason: 'Music detection unavailable on this system'
                    });
                }
                return;
            }

            this._failCount = 0;
            const title = (stdout || '').trim();

            if (!title || title === 'Spotify' || title === 'false' || title === '') {
                const newData = { track: 'Not playing', artist: '', isPlaying: false, available: true, reason: '' };
                if (this._lastData.track !== newData.track) {
                    this._notify(newData);
                }
                return;
            }

            let artist, track;

            if (this._platform === 'linux') {
                const parsed = this._parseDbusOutput(title);
                artist = parsed.artist;
                track = parsed.track;
            } else {
                // Windows and macOS: "Artist - Track"
                const dash = title.indexOf(' - ');
                if (dash > -1) {
                    artist = title.substring(0, dash);
                    track = title.substring(dash + 3);
                } else {
                    artist = '';
                    track = title;
                }
            }

            if (this._lastData.track !== track || this._lastData.artist !== artist) {
                this._notify({ track, artist, isPlaying: true, available: true, reason: '' });
            }
        });
    }

    control(action) {
        const cmd = this._getControlCommand(action);
        if (!cmd) return;
        exec(cmd, { timeout: 3000 }, () => {});
    }

    _getControlCommand(action) {
        switch (this._platform) {
            case 'win32':
                // Virtual key codes: PlayPause=0xB3, Next=0xB0, Prev=0xB1
                const vk = { playPause: '0xB3', next: '0xB0', previous: '0xB1' }[action];
                if (!vk) return null;
                return `powershell -Command "Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class KBD{[DllImport(\\\"user32.dll\\\")]public static extern void keybd_event(byte k,byte s,uint f,UIntPtr e);}'; [KBD]::keybd_event(${vk},0,0,[UIntPtr]::Zero); [KBD]::keybd_event(${vk},0,2,[UIntPtr]::Zero)"`;
            case 'darwin':
                const appleCmd = { playPause: 'playpause', next: 'next track', previous: 'previous track' }[action];
                if (!appleCmd) return null;
                return `osascript -e 'tell application "Spotify" to ${appleCmd}'`;
            case 'linux':
                const dbusCmd = { playPause: 'PlayPause', next: 'Next', previous: 'Previous' }[action];
                if (!dbusCmd) return null;
                return `dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.${dbusCmd}`;
            default:
                return null;
        }
    }

    _parseDbusOutput(output) {
        let artist = '';
        let track = '';

        // Extract xesam:title
        const titleMatch = output.match(/xesam:title[\s\S]*?string\s+"([^"]+)"/);
        if (titleMatch) track = titleMatch[1];

        // Extract xesam:artist
        const artistMatch = output.match(/xesam:artist[\s\S]*?string\s+"([^"]+)"/);
        if (artistMatch) artist = artistMatch[1];

        return { artist, track: track || 'Not playing' };
    }
}

module.exports = { MusicService };
