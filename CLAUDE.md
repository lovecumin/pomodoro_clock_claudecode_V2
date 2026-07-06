# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pomodoro Clock - An Electron-based desktop pomodoro timer application with task management, statistics, white noise, and theme support. Built with vanilla JavaScript (no frameworks) using IIFE module pattern.

## Quick Commands

```bash
# Install dependencies
npm install

# Start development
npm start

# Build distributable (Windows installer)
npm run build
```

## Architecture

### Electron Process Model

This application follows the standard Electron two-process architecture:

- **Main Process** (`main.js`): Node.js environment, manages windows, system API calls (notifications via `node-notifier`), IPC handlers
- **Renderer Process** (`src/`): Chromium-based browser environment, handles UI and user interaction
- **Preload Script** (`preload.js`): Bridge between processes, exposes `window.electronAPI` with safe IPC methods (`minimize()`, `maximize()`, `close()`, `sendNotification()`, `playAlert()`)

**IPC Communication Flow:**
```
Renderer → window.electronAPI.xxx() → preload.js bridge → ipcMain.on() → System APIs
```

### Module System (IIFE Pattern)

All modules use Immediately Invoked Function Expression (IIFE) pattern for encapsulation:

| Module | Responsibility |
|--------|----------------|
| `app.js` | Entry point, initialization, UI bindings, state management |
| `timer.js` | Countdown logic, mode transitions, progress bar animation |
| `tasks.js` | Task CRUD operations, localStorage persistence |
| `stats.js` | Pomodoro history recording, Canvas chart rendering |
| `sound.js` | White noise generation via Web Audio API |
| `theme.js` | CSS variable-based theme switching (3 themes) |
| `notification.js` | Desktop notifications via Electron API |

**Initialization Order** (in `app.js`):
```
Theme.init() → Stats.init() → Notification_.init() → Sound.init() → Tasks.init() → Timer.init(onTimerComplete)
```

### Key Technical Decisions

1. **No External Libraries**: Uses native Canvas API for charts, Web Audio API for noise, avoiding bundle complexity
2. **Data Persistence**: All state stored in localStorage (config, tasks, statistics, theme)
3. **Custom Window Frame**: `frame: false` with custom HTML titlebar; window controls via IPC
4. **CSS Variable Theming**: Three themes (`light`, `dark`, `green`) managed through CSS variables in `themes.css`
5. **Circular Progress Animation**: SVG-based timer using `strokeDasharray` and `strokeDashoffset`

### Directory Structure

```
src/
├── index.html           # Main UI (single-page app)
├── js/                  # Module files (IIFE pattern)
├── styles/              # CSS (main.css, themes.css, animations.css)
└── assets/              # Icons and resources
```

## Configuration

User preferences stored in localStorage with keys:
- `pomodoro-config`: Timer durations (work/shortBreak/longBreak in minutes, longBreakInterval)
- `pomodoro-count`: Current consecutive pomodoro count
- `pomodoro-auto-start`: Auto-advance to next phase
- `pomodoro-tasks`: Task list
- `pomodoro-stats`: Historical statistics
- `theme`: Current theme name

## Development Notes

- The app runs locally and can be tested with `npm start`
- All modules are globally accessible via window scope (no module bundler)
- Timer modes: `work`, `shortBreak`, `longBreak`
- Tag system for tasks supports 6 categories
- No test framework configured in this project
