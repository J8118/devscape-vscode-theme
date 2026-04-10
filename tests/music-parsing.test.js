const { describe, it } = require('node:test');
const assert = require('node:assert');

// Extract parsing logic from MusicService for testability
// These mirror the parsing in src/services/music.js

function parseWindowsTitle(title) {
    if (!title || title === 'Spotify' || title === '') {
        return { track: 'Not playing', artist: '', isPlaying: false };
    }
    const dash = title.indexOf(' - ');
    if (dash > -1) {
        return {
            artist: title.substring(0, dash),
            track: title.substring(dash + 3),
            isPlaying: true
        };
    }
    return { artist: '', track: title, isPlaying: true };
}

function parseMacOutput(title) {
    if (!title || title === 'false' || title === '') {
        return { track: 'Not playing', artist: '', isPlaying: false };
    }
    const dash = title.indexOf(' - ');
    if (dash > -1) {
        return {
            artist: title.substring(0, dash),
            track: title.substring(dash + 3),
            isPlaying: true
        };
    }
    return { artist: '', track: title, isPlaying: true };
}

function parseDbusOutput(output) {
    let artist = '';
    let track = '';
    const titleMatch = output.match(/xesam:title[\s\S]*?string\s+"([^"]+)"/);
    if (titleMatch) track = titleMatch[1];
    const artistMatch = output.match(/xesam:artist[\s\S]*?string\s+"([^"]+)"/);
    if (artistMatch) artist = artistMatch[1];
    return { artist, track: track || 'Not playing' };
}

describe('Music title parsing', () => {

    describe('Windows (PowerShell window title)', () => {
        it('parses "Artist - Track" format', () => {
            const result = parseWindowsTitle('Daft Punk - Get Lucky');
            assert.strictEqual(result.artist, 'Daft Punk');
            assert.strictEqual(result.track, 'Get Lucky');
            assert.strictEqual(result.isPlaying, true);
        });

        it('handles tracks with dashes in the name', () => {
            const result = parseWindowsTitle('AC/DC - Back in Black - Remastered');
            assert.strictEqual(result.artist, 'AC/DC');
            assert.strictEqual(result.track, 'Back in Black - Remastered');
        });

        it('returns not playing for empty string', () => {
            const result = parseWindowsTitle('');
            assert.strictEqual(result.track, 'Not playing');
            assert.strictEqual(result.isPlaying, false);
        });

        it('returns not playing for "Spotify" (app open but not playing)', () => {
            const result = parseWindowsTitle('Spotify');
            assert.strictEqual(result.track, 'Not playing');
            assert.strictEqual(result.isPlaying, false);
        });

        it('returns not playing for null', () => {
            const result = parseWindowsTitle(null);
            assert.strictEqual(result.track, 'Not playing');
            assert.strictEqual(result.isPlaying, false);
        });

        it('handles title with no dash (podcast or single word)', () => {
            const result = parseWindowsTitle('Some Podcast Episode');
            assert.strictEqual(result.track, 'Some Podcast Episode');
            assert.strictEqual(result.artist, '');
            assert.strictEqual(result.isPlaying, true);
        });
    });

    describe('macOS (AppleScript output)', () => {
        it('parses artist - track format', () => {
            const result = parseMacOutput('The Weeknd - Blinding Lights');
            assert.strictEqual(result.artist, 'The Weeknd');
            assert.strictEqual(result.track, 'Blinding Lights');
        });

        it('returns not playing for "false" (Spotify not running)', () => {
            const result = parseMacOutput('false');
            assert.strictEqual(result.track, 'Not playing');
            assert.strictEqual(result.isPlaying, false);
        });

        it('returns not playing for empty', () => {
            const result = parseMacOutput('');
            assert.strictEqual(result.track, 'Not playing');
        });
    });

    describe('Linux (D-Bus metadata)', () => {
        it('parses xesam metadata', () => {
            const dbusOutput = `method return time=123
   array [
      dict entry(
         string "xesam:title"
         variant             string "Bohemian Rhapsody"
      )
      dict entry(
         string "xesam:artist"
         variant             array [
               string "Queen"
            ]
      )
   ]`;
            const result = parseDbusOutput(dbusOutput);
            assert.strictEqual(result.track, 'Bohemian Rhapsody');
            assert.strictEqual(result.artist, 'Queen');
        });

        it('returns Not playing when no metadata found', () => {
            const result = parseDbusOutput('');
            assert.strictEqual(result.track, 'Not playing');
            assert.strictEqual(result.artist, '');
        });

        it('handles title without artist', () => {
            const dbusOutput = `dict entry(
         string "xesam:title"
         variant             string "Unknown Track"
      )`;
            const result = parseDbusOutput(dbusOutput);
            assert.strictEqual(result.track, 'Unknown Track');
            assert.strictEqual(result.artist, '');
        });
    });
});
