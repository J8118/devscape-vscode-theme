/**
 * Builds the UI injection CSS from a theme config.
 * Every color reference is driven by the config object so new themes
 * only need to provide their own accent/border/glow values.
 */
function buildCss(config) {
    const { accent, accentRgb, borderColor, glowColor } = config;

    return `
/* DEVSCAPE UI — ${config.id} */
* { -webkit-font-smoothing: antialiased !important; }

@keyframes u-glow { 0%,100% { box-shadow: 0 0 8px ${glowColor}; } 50% { box-shadow: 0 0 22px ${glowColor}, 0 0 44px rgba(${accentRgb},0.12); } }
@keyframes u-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes u-scale-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
@keyframes u-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

/* ── Activity Bar ── */
.activitybar { border-right: 1px solid ${borderColor} !important; }
.activitybar .active-item-indicator { display: none !important; }
.activitybar .monaco-action-bar .action-item { margin: 3px 7px !important; border-radius: 10px !important; transition: background 0.2s ease !important; }
.activitybar .monaco-action-bar .action-item > a.action-label { border-radius: 10px !important; width: 36px !important; height: 36px !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease !important; }
.activitybar .monaco-action-bar .action-item:hover > a.action-label { background: rgba(${accentRgb},0.10) !important; color: ${accent} !important; transform: scale(1.08) !important; }
.activitybar .monaco-action-bar .action-item.checked > a.action-label { background: rgba(${accentRgb},0.16) !important; color: ${accent} !important; animation: u-glow 2.5s ease-in-out infinite !important; }
.activitybar .monaco-action-bar .badge .badge-content { background: ${accent} !important; color: #07090c !important; border-radius: 10px !important; font-weight: 700 !important; font-size: 10px !important; }

/* ── Sidebar ── */
.sidebar { border-right: 1px solid ${borderColor} !important; }
.sidebar .composite.title { border-bottom: 1px solid ${borderColor} !important; background: transparent !important; }
.sidebar .pane-header { text-transform: uppercase !important; letter-spacing: 0.12em !important; font-size: 10px !important; font-weight: 600 !important; border-bottom: 1px solid ${borderColor} !important; }
.sidebar .pane-header .title-actions .action-label { opacity: 0.45 !important; transition: opacity 0.2s, color 0.2s !important; }
.sidebar .pane-header .title-actions .action-label:hover { opacity: 1 !important; color: ${accent} !important; }
.monaco-list .monaco-list-row { border-radius: 6px !important; transition: background 0.15s ease !important; }

/* ── Tabs ── */
.tabs-and-actions-container { padding: 5px 8px 0 !important; gap: 2px !important; }
.tab { border-radius: 8px 8px 0 0 !important; border: none !important; border-top: 2px solid transparent !important; margin: 0 2px !important; padding: 0 14px !important; transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important; animation: u-fade-in 0.2s ease !important; backdrop-filter: blur(8px) !important; }
.tab.active { border-top-color: ${accent} !important; background: rgba(${accentRgb},0.06) !important; box-shadow: 0 -3px 14px rgba(${accentRgb},0.12), inset 0 1px 0 rgba(${accentRgb},0.1) !important; }
.tab:not(.active):hover { background: rgba(255,255,255,0.04) !important; }
.tab .tab-actions .codicon-close { opacity: 0 !important; transition: opacity 0.2s !important; }
.tab:hover .tab-actions .codicon-close, .tab.active .tab-actions .codicon-close { opacity: 0.4 !important; }
.tab .tab-actions .codicon-close:hover { opacity: 1 !important; }

/* ── Breadcrumbs ── */
.breadcrumbs-container { padding: 3px 12px !important; border-bottom: 1px solid ${borderColor} !important; background: #07090c !important; }
.breadcrumb-item { font-size: 11px !important; letter-spacing: 0.03em !important; opacity: 0.55 !important; transition: opacity 0.2s, color 0.2s !important; }
.breadcrumb-item:last-child { opacity: 1 !important; }
.breadcrumb-item:hover { opacity: 1 !important; color: ${accent} !important; }

/* ── Scrollbar & Status ── */
.monaco-scrollable-element > .scrollbar > .slider { border-radius: 4px !important; }
.statusbar { border-top: 1px solid ${borderColor} !important; }
.statusbar-item { padding: 0 8px !important; font-size: 11px !important; letter-spacing: 0.04em !important; border-radius: 4px !important; transition: background 0.2s !important; }

/* ── Title & Panel ── */
.titlebar, .part.titlebar { border-bottom: 1px solid ${borderColor} !important; }
.panel { border-top: 1px solid ${borderColor} !important; }
.panel .panel-section-header, .panel .title { background: transparent !important; border-bottom: 1px solid ${borderColor} !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; font-size: 10px !important; }

/* ── Command Palette ── */
.quick-input-widget { border: 1px solid rgba(${accentRgb},0.15) !important; border-radius: 14px !important; overflow: hidden !important; box-shadow: 0 32px 90px rgba(0,0,0,0.90), 0 0 0 1px rgba(${accentRgb},0.07), inset 0 1px 0 rgba(255,255,255,0.04) !important; animation: u-scale-in 0.15s cubic-bezier(0.4,0,0.2,1) !important; }
.quick-input-box .input { font-size: 14px !important; letter-spacing: 0.02em !important; }
.quick-input-list .monaco-list-row { border-radius: 6px !important; margin: 1px 6px !important; }

/* ── Hover, Suggest, Find, Notifications, Menus ── */
.monaco-editor .monaco-hover { border: 1px solid rgba(${accentRgb},0.12) !important; border-radius: 10px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.65) !important; overflow: hidden !important; animation: u-scale-in 0.15s ease !important; }
.monaco-editor .suggest-widget { border: 1px solid rgba(${accentRgb},0.12) !important; border-radius: 12px !important; overflow: hidden !important; box-shadow: 0 8px 32px rgba(0,0,0,0.65) !important; animation: u-scale-in 0.15s ease !important; }
.monaco-editor .suggest-widget .monaco-list-row.focused { border-radius: 6px !important; box-shadow: inset 0 0 0 1px rgba(${accentRgb},0.22) !important; }
.monaco-editor .find-widget { border: 1px solid rgba(${accentRgb},0.12) !important; border-radius: 12px !important; overflow: hidden !important; box-shadow: 0 8px 32px rgba(0,0,0,0.65) !important; top: 10px !important; right: 12px !important; animation: u-fade-up 0.2s ease !important; }
.notification-toast { border: 1px solid rgba(${accentRgb},0.12) !important; border-radius: 12px !important; overflow: hidden !important; box-shadow: 0 8px 32px rgba(0,0,0,0.65) !important; animation: u-fade-up 0.3s ease !important; }
.context-view .monaco-menu { border: 1px solid rgba(${accentRgb},0.1) !important; border-radius: 12px !important; overflow: hidden !important; box-shadow: 0 16px 48px rgba(0,0,0,0.75) !important; animation: u-scale-in 0.12s ease !important; padding: 4px !important; }
.context-view .monaco-menu .monaco-action-bar .action-item { border-radius: 6px !important; margin: 1px 4px !important; }
.monaco-list .monaco-list-row.focused, .monaco-list .monaco-list-row.selected { box-shadow: inset 0 0 0 1px rgba(${accentRgb},0.18) !important; border-radius: 6px !important; }

/* ── Minimap & Scrollbar ── */
.monaco-editor .minimap { border-left: 1px solid ${borderColor} !important; opacity: 0.35 !important; transition: opacity 0.2s !important; }
.monaco-editor .minimap:hover { opacity: 0.65 !important; }
.monaco-scrollable-element > .scrollbar > .slider { background: rgba(${accentRgb},0.10) !important; }
.monaco-scrollable-element > .scrollbar > .slider:hover { background: rgba(${accentRgb},0.22) !important; }
.statusbar-item:hover { background: rgba(${accentRgb},0.08) !important; }
`;
}

module.exports = { buildCss };
