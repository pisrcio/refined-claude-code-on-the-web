<p align="center">
  <img src="icons/icon128.png" alt="Refined Claude Code on the Web" width="128" height="128">
</p>

<h1 align="center">Refined Claude Code on the Web</h1>

<p align="center">
  A Chrome extension to enhance the Claude web experience with improved code editing capabilities.
</p>

> **Naming Inspiration**: The name "Refined Claude Code on the Web" is inspired by the excellent [Refined GitHub](https://github.com/refined-github/refined-github) Chrome extension, which enhances the GitHub experience with thoughtful UI improvements.

> **Recommended Workflow**: This extension is built around [this workflow](https://www.youtube.com/watch?v=3bej6c3O8d0), which inspired most of the "refined" features here.

## The Refined Workflow

1. **Plan** - Use Plan mode to design your approach
2. **Execute** - Switch to Agent mode and let Claude implement the changes
3. **Pull** - Click the "Pull Branch" button to get the code locally
4. **Test** - Run your tests locally
5. **Teleport** - If needed, click "Open in CLI" to continue in your local environment
6. **Repeat** - Iterate until the feature is complete
7. **Create PR** - Open a pull request for review
8. **Resolve conflicts** - If conflicts exist, click the "Merge [main]" button
9. **Test again** - Verify everything works after merging
10. **Merge PR** - Complete the pull request

## Features

### Mode Button (Agent/Plan Toggle)
Switch between Agent and Plan modes directly from the input area. Plan mode uses the `@agent-plan` prefix to enable planning-only responses.

![Mode Button](screenshots/mode-button.png)

**How it works:**
When you submit a prompt in **Plan mode**, the extension automatically prepends this text to your message:
```
DO NOT write any code yet. I just need the plan for me to review.

use @agent-plan : [your prompt here]
```
Your mode preference is saved and persists across sessions.

**Default Mode Setting:**
Configure which mode new sessions start with via the extension popup:
- **Last used** - Start with whichever mode you used last (default)
- **Always Agent** - New sessions always start in Agent mode
- **Always Plan** - New sessions always start in Plan mode

**Credits**: Thanks to [@bchan7](https://reddit.com/u/bchan7) and [@batout](https://reddit.com/u/batout) for sharing the [plan mode discovery](https://www.reddit.com/r/ClaudeCode/comments/1p0hypc/changing_to_plan_mode_in_claude_code_on_the_web/).

### Show Actual Model
Displays the actual model being used (e.g., "Opus 4", "Sonnet 4") instead of the generic "..." button.

![Show Model](screenshots/show-model.png)

### Pull Branch Button
Adds a convenient button to copy the `git pull` command for the current branch directly to your clipboard.

![Pull Branch](screenshots/pull-branch.png)

### Merge Branch Button
Adds a button next to PRs to copy the merge command for quick branch merging.

![Merge Branch](screenshots/merge-branch.png)

### Project Settings
Customize how individual projects appear and behave in the sidebar.

![Project Settings](screenshots/project-colors.png)

**Features:**
- **Color Coding** - Assign distinct colors to projects for visual identification in the sidebar
- **Main Branch** - Configure which branch is the "main" branch per project (used by the Merge button)

Access project settings via the extension popup.

### Blocked Sessions
Mark sessions as "blocked" to track sessions that are stuck, need attention, or should be avoided.

![Blocked Sessions](screenshots/blocked-sessions.png)

**How it works:**
- Hover over any session in the sidebar to reveal action buttons
- Click the warning icon to mark a session as blocked
- Optionally add a reason message (appears in tooltip on hover)
- A persistent indicator shows blocked sessions even when not hovering
- Click the blocked button again to unblock

Blocked status persists across browser sessions via Chrome storage.

### Refined Label
Shows a "Refined" badge in the header indicating the extension is active. Click to toggle all features on/off.

![Refined Label](screenshots/refined-label.png)

### Settings Popup
Click the extension icon in your Chrome toolbar to access all settings.

![Settings Popup](screenshots/settings-popup.png)

**Available controls:**
- Master toggle to enable/disable all features at once
- Individual feature toggles for fine-grained control
- Default mode selection for new sessions
- Project settings configuration (colors and main branch)

## Screenshots

> **Note**: Screenshots are located in the `screenshots/` folder. If you're contributing, please add screenshots for any new features.

## Installation

### From Source (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/pisrcio/refined-claude-code-on-the-web.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the cloned repository folder

5. The extension should now be installed and active

## Development

### Prerequisites

- Google Chrome browser
- Basic knowledge of Chrome extension development

### Project Structure

```
├── manifest.json    # Chrome extension manifest (Manifest V3)
├── content.js       # Main content script - all UI injection and features
├── content.css      # Styles for injected UI elements
├── popup.html       # Settings popup UI
├── popup.css        # Settings popup styles
├── popup.js         # Settings popup logic
├── icons/           # Extension icons (16px, 48px, 128px, SVG)
├── screenshots/     # Feature screenshots
├── TEST_PLAN.md     # Manual testing guide
├── CLAUDE.md        # Guidance for Claude Code AI assistant
├── LICENSE          # MIT License
└── README.md        # This file
```

### Making Changes

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card to reload

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
