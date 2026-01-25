# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

This is a Chrome extension project called "Better Claude Code on the Web". The extension aims to enhance the Claude web experience with improved code editing capabilities.

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
