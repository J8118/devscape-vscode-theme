const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { DashboardViewProvider } = require('./dashboard');
const injector = require('./injector');
const { WeatherService } = require('./services/weather');
const { MusicService } = require('./services/music');

// ── Load all theme configs from src/themes/ ─────────────────────────────────
function loadThemeConfigs() {
    const themesDir = path.join(__dirname, 'themes');
    const configs = [];
    try {
        const files = fs.readdirSync(themesDir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            configs.push(require(path.join(themesDir, file)));
        }
    } catch {
        // themes dir missing — shouldn't happen in packaged extension
    }
    return configs;
}

function findActiveConfig(configs) {
    const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
    return configs.find(c => c.label === currentTheme) || null;
}

// ── Activate ────────────────────────────────────────────────────────────────
function activate(context) {
    const configs = loadThemeConfigs();
    let activeConfig = findActiveConfig(configs);

    let weatherService = null;
    let musicService = null;
    let dashboardProvider = null;
    let dashboardDisposable = null;

    function startServices() {
        const settings = vscode.workspace.getConfiguration('devscape');

        // Weather
        weatherService = new WeatherService();
        weatherService.onUpdate((data) => {
            if (dashboardProvider) dashboardProvider.updateWeather(data);
        });
        const city = settings.get('weatherCity') || '';
        weatherService.start(city);

        // Music
        musicService = new MusicService();
        musicService.onUpdate((data) => {
            if (dashboardProvider) dashboardProvider.updateMusic(data);
        });
        musicService.start();

        // Route playback controls from dashboard to music service
        if (dashboardProvider) {
            dashboardProvider.onControl((action) => {
                if (musicService) musicService.control(action);
            });
        }
    }

    function stopServices() {
        if (weatherService) { weatherService.stop(); weatherService = null; }
        if (musicService) { musicService.stop(); musicService = null; }
    }

    function registerDashboard(config) {
        if (dashboardDisposable) { dashboardDisposable.dispose(); dashboardDisposable = null; }

        dashboardProvider = new DashboardViewProvider(context.extensionUri, config);
        dashboardDisposable = vscode.window.registerWebviewViewProvider(
            DashboardViewProvider.viewType,
            dashboardProvider,
            { webviewOptions: { retainContextWhenHidden: true } }
        );
        context.subscriptions.push(dashboardDisposable);
    }

    function disposeDashboard() {
        if (dashboardDisposable) { dashboardDisposable.dispose(); dashboardDisposable = null; }
        dashboardProvider = null;
    }

    // ── Initial setup ──
    if (activeConfig) {
        const dashboardEnabled = vscode.workspace.getConfiguration('devscape').get('dashboardEnabled', true);
        if (dashboardEnabled) {
            registerDashboard(activeConfig);
            startServices();
        }

        // Auto-recovery: re-apply if VS Code update wiped the injection
        if (!injector.isInjected(activeConfig)) {
            const opacity = vscode.workspace.getConfiguration('devscape').get('backgroundOpacity', activeConfig.backgroundOpacity);
            injector.apply(activeConfig, context.extensionPath, opacity);
        }
    }

    // ── Commands ──
    context.subscriptions.push(
        vscode.commands.registerCommand('devscape.apply', () => {
            const config = findActiveConfig(configs);
            if (!config) {
                vscode.window.showWarningMessage('Devscape: Please select a Devscape theme first (Ctrl+K Ctrl+T).');
                return;
            }
            const opacity = vscode.workspace.getConfiguration('devscape').get('backgroundOpacity', config.backgroundOpacity);
            injector.apply(config, context.extensionPath, opacity);
        }),
        vscode.commands.registerCommand('devscape.remove', () => {
            injector.remove();
        })
    );

    // ── Config change listener ──
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            // Theme changed
            if (e.affectsConfiguration('workbench.colorTheme')) {
                const newConfig = findActiveConfig(configs);

                if (newConfig && newConfig.id !== (activeConfig && activeConfig.id)) {
                    // Switched to a different Devscape theme
                    injector.remove();
                    activeConfig = newConfig;
                    const opacity = vscode.workspace.getConfiguration('devscape').get('backgroundOpacity', newConfig.backgroundOpacity);
                    injector.apply(newConfig, context.extensionPath, opacity);

                    const dashboardEnabled = vscode.workspace.getConfiguration('devscape').get('dashboardEnabled', true);
                    if (dashboardEnabled) {
                        stopServices();
                        registerDashboard(newConfig);
                        startServices();
                    }
                } else if (!newConfig && activeConfig) {
                    // Switched away from Devscape
                    injector.remove();
                    stopServices();
                    disposeDashboard();
                    activeConfig = null;
                }
            }

            // Opacity changed
            if (e.affectsConfiguration('devscape.backgroundOpacity') && activeConfig) {
                const opacity = vscode.workspace.getConfiguration('devscape').get('backgroundOpacity', activeConfig.backgroundOpacity);
                injector.apply(activeConfig, context.extensionPath, opacity);
            }

            // Weather city changed
            if (e.affectsConfiguration('devscape.weatherCity') && weatherService) {
                const city = vscode.workspace.getConfiguration('devscape').get('weatherCity') || '';
                weatherService.stop();
                weatherService.start(city);
            }

            // Dashboard toggle
            if (e.affectsConfiguration('devscape.dashboardEnabled') && activeConfig) {
                const enabled = vscode.workspace.getConfiguration('devscape').get('dashboardEnabled', true);
                if (enabled) {
                    registerDashboard(activeConfig);
                    startServices();
                } else {
                    stopServices();
                    disposeDashboard();
                }
            }
        })
    );
}

function deactivate() {
    // Intervals are cleaned up by service .stop() calls via disposables
}

module.exports = { activate, deactivate };
