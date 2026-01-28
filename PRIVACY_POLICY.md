# Privacy Policy

**Refined Claude Code on the Web**
Version 0.9.0
Last Updated: January 28, 2026

## Overview

Refined Claude Code on the Web is a browser extension that enhances the Claude.ai web interface. This privacy policy explains what data the extension collects, how it's used, and your rights regarding that data.

## Data Collection

### What We Collect

This extension collects and stores **only** the following data:

1. **User Preferences** - Your feature toggle settings (which features are enabled/disabled)
2. **Default Mode Selection** - Your preferred Agent/Plan mode setting
3. **Project Settings** - Project names, associated colors, and main branch names you configure
4. **Blocked Session Data** - Session IDs and reasons you provide when marking sessions as blocked

### What We Do NOT Collect

- No personal information
- No browsing history
- No conversation content from Claude.ai
- No analytics or usage tracking
- No data is transmitted to external servers

## Data Storage

All data is stored **locally** on your device using Chrome's `storage.sync` API. This means:

- Data stays on your device and syncs to your Chrome profile if you're signed in
- Data is never sent to our servers (we don't have any servers)
- You can clear all extension data by uninstalling the extension or clearing browser data

## Permissions Explained

This extension requests the following permissions:

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Save your preferences and settings locally |
| `tabs` | Detect when you navigate to Claude.ai to inject the enhancements |
| `activeTab` | Access the current tab to modify the Claude.ai interface |
| `clipboardWrite` | Copy git commands to clipboard (Pull/Merge Branch features) |
| `host_permissions` for `claude.ai` | Only run on Claude.ai pages |

## Third-Party Services

This extension does not use any third-party services, analytics, or tracking tools.

## Data Sharing

We do not share any data with third parties. All data remains on your local device.

## Your Rights

You can:

- **View your data** - Open the extension popup to see your settings
- **Modify your data** - Change any setting at any time through the popup
- **Delete your data** - Uninstall the extension or clear browser data to remove all stored data

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last Updated" date at the top of this document.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository:

https://github.com/pisrcio/better-claude-code-on-the-web

## Open Source

This extension is open source under the MIT License. You can review the complete source code on GitHub to verify our privacy practices.
