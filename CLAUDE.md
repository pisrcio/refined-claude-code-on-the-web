# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

This is a Chrome extension project called "Refined Claude Code on the Web". The extension aims to enhance the Claude web experience with improved code editing capabilities.

## Project Structure

```
/
├── manifest.json    # Chrome extension manifest (Manifest V3)
├── CLAUDE.md        # This file - guidance for Claude Code
└── README.md        # Project documentation
```

## Development Guidelines

### Chrome Extension Development

- This extension uses Manifest V3 (the latest Chrome extension format)
- Follow Chrome extension best practices and security guidelines
- Test changes in Chrome by loading the unpacked extension from `chrome://extensions/`

### Code Style

- Use modern JavaScript (ES6+)
- Follow consistent formatting
- Add comments for complex logic

## Common Commands

```bash
# No build step required - load unpacked extension directly in Chrome
# Navigate to chrome://extensions/, enable Developer mode, click "Load unpacked"
```

## Key Files

- `manifest.json` - Extension configuration and permissions
- `content.js` - Main content script with all UI injection and detection logic

## Claude Code Web Interface - DOM Structure

### Finding Sessions in the Sidebar

Sessions are rendered in a virtualized list in the sidebar. Each session item has this structure:

```
div[data-index="N"]                    <- Session wrapper (N = 0, 1, 2, ...)
  └── div.group                        <- Hover state container
      └── div.cursor-pointer           <- Clickable row (bg-bg-300 if selected)
          ├── div.flex-1               <- Content area
          │   └── div.flex-col
          │       ├── span.font-base.text-text-100.leading-relaxed  <- Title
          │       └── span.text-xs.text-text-500                    <- Metadata (repo, date, diff)
          └── div.flex-shrink-0        <- Buttons area
              └── div.relative
                  └── div.group-hover:opacity-100  <- Buttons container (hidden until hover)
                      ├── span[data-state] > button  <- Delete button
                      └── div > button               <- Archive button
```

**Reliable selectors:**
- All sessions: `document.querySelectorAll('[data-index]')`
- Session title: `sessionEl.querySelector('span.font-base.text-text-100.leading-relaxed')`
- Selected session: Look for `.cursor-pointer` with `bg-bg-300` class
- Running session: Has `.code-spinner-animate` element

### Finding Session Action Buttons

Buttons are identified by their SVG icons, not by class names (which change frequently).

**Delete button:**
- SVG viewBox: `0 0 256 256`
- Path starts with: `M216,48H176V40a24`

**Archive button:**
- SVG viewBox: `0 0 20 20`
- Path contains: `M11.5 9.5C11.7761`

**Detection pattern:**
```javascript
// Find delete button
const buttons = sessionEl.querySelectorAll('button');
for (const button of buttons) {
  const svg = button.querySelector('svg');
  if (svg?.getAttribute('viewBox') === '0 0 256 256') {
    const path = svg.querySelector('path');
    if (path?.getAttribute('d')?.startsWith('M216,48H176V40a24')) {
      return button; // This is the delete button
    }
  }
}
```

### API Access

The extension exposes utilities at `window.RefinedClaudeCode.sessions`:
- `getAll()` - Get all session elements
- `getAllWithData()` - Get sessions with parsed data
- `findByTitle(title)` - Find session by title
- `getActive()` - Get currently selected session
- `getRunning()` - Get sessions with active spinner
- `findDeleteButton(el)` - Find delete button in session
- `findArchiveButton(el)` - Find archive button in session
- `findBlockedButton(el)` - Find blocked button (if added)
- `triggerHover(el)` - Simulate hover to reveal buttons
- `addBlockedButton(el)` - Add blocked button to session
