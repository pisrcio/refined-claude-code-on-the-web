# Release Notes

## v0.12.1

### Removed

- **Mode Button (Agent/Plan Toggle)** - Removed the Agent/Plan mode switcher feature. Claude Code on the web now has a native plan/code switch button built in, making the extension's implementation redundant. This includes:
  - Removed the mode button from the input area
  - Removed the "Default Mode" setting from the extension popup
  - Removed the `modeButton` and `defaultMode` settings
  - Removed the plan mode text injection on form submission
  - Removed `mode-button.png` and `default-mode-setting.png` screenshots
  - Cleaned up related CSS styles

### Notes

- All other features (Pull Branch, Merge Branch, Project Colors, Blocked Sessions, Scroll to Top, Refined Label) remain unchanged.
- If you previously relied on the extension's plan/code switch, use the native toggle now available in Claude Code on the web.
