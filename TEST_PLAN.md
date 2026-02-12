# Local Test Plan - Refined Claude Code on the Web

This document provides a manual test plan for verifying the Chrome extension functionality locally.

---

## Prerequisites

1. **Load the extension in Chrome:**
   ```
   1. Navigate to chrome://extensions/
   2. Enable "Developer mode" (toggle in top-right)
   3. Click "Load unpacked"
   4. Select the extension folder
   ```

2. **Open Claude Code:**
   - Navigate to https://claude.ai/code
   - Ensure you're logged in

3. **Open DevTools:**
   - Press `F12` or right-click → "Inspect"
   - Keep Console tab open for debugging (look for `[BCC]` logs)

---

## Test Suite 1: Extension Loading

### Test 1.1: Extension Loads Successfully
**Steps:**
1. Open chrome://extensions/
2. Verify the extension appears in the list
3. Verify it shows "Enabled" status
4. Check for any error badges on the extension card

**Expected Result:** Extension loaded without errors

### Test 1.2: Content Script Injection
**Steps:**
1. Navigate to https://claude.ai/code
2. Open DevTools Console
3. Type `window.RefinedClaudeCode` and press Enter

**Expected Result:** Returns an object with `sessions` property containing utility functions

### Test 1.3: Popup Opens
**Steps:**
1. Click the extension icon in Chrome toolbar
2. Verify the settings popup appears

**Expected Result:** Popup displays with feature toggles and project settings

---

## Test Suite 2: Refined Label Badge

### Test 2.1: Label Appears
**Steps:**
1. Navigate to https://claude.ai/code
2. Look at the sidebar header where "Claude Code" text appears

**Expected Result:** A green "Refined" badge appears next to "Claude Code"

### Test 2.2: Label Toggle (Disable)
**Steps:**
1. Click on the "Refined" badge
2. Observe the visual change

**Expected Result:**
- Badge turns gray with strikethrough text
- Toast notification appears: "Refined Claude Code disabled"
- All injected UI elements disappear

### Test 2.3: Label Toggle (Enable)
**Steps:**
1. Click the gray "Refined" badge again

**Expected Result:**
- Badge turns green again
- Toast notification appears: "Refined Claude Code enabled"
- All features re-appear

---

## Test Suite 3: Pull Branch Button

### Test 3.1: Button Appears on PR Page
**Steps:**
1. Create a session that mentions a GitHub PR
2. Or navigate to a session where Claude created a PR
3. Look for the "Pull Branch in CLI" button

**Expected Result:** Button appears near PR-related content

### Test 3.2: Copy Branch Command
**Steps:**
1. Click "Pull Branch in CLI" button

**Expected Result:**
- Command copied to clipboard
- Verify by pasting: should be `git fetch && git co {branch-name} && git pull`
- Toast notification confirms copy

---

## Test Suite 4: Merge Branch Button

### Test 4.1: Button Appears
**Steps:**
1. On a page with branch content, look for "Merge [main]" button

**Expected Result:** Button appears with configured main branch name

### Test 4.2: Insert Merge Prompt
**Steps:**
1. Click the "Merge [main]" button
2. Check the chat input field

**Expected Result:** Input field populated with: `Merge the "{branch}" branch in and fix merge conflicts.`

---

## Test Suite 5: Project Colors

### Test 5.1: Configure Project Color
**Steps:**
1. Click extension icon to open popup
2. Scroll to "Project Settings"
3. Enter a project name (must match a project in your sidebar)
4. Select a color from the palette
5. Click "Add"

**Expected Result:** Project added to the list below

### Test 5.2: Color Applied in Sidebar
**Steps:**
1. Look at the sidebar project list
2. Find the project you configured

**Expected Result:** Project name has a colored background matching your selection

### Test 5.3: Remove Project Color
**Steps:**
1. Open popup
2. Click the X next to the configured project

**Expected Result:** Color removed from project in sidebar

---

## Test Suite 6: Session Management API

### Test 6.1: Get All Sessions
**Steps:**
1. Open DevTools Console
2. Run: `window.RefinedClaudeCode.sessions.getAll()`

**Expected Result:** Returns array of session DOM elements

### Test 6.2: Get Sessions with Data
**Steps:**
1. Run: `window.RefinedClaudeCode.sessions.getAllWithData()`

**Expected Result:** Returns array of objects with `element`, `title`, and `index` properties

### Test 6.3: Find Session by Title
**Steps:**
1. Note a session title from sidebar
2. Run: `window.RefinedClaudeCode.sessions.findByTitle("Your Title Here")`

**Expected Result:** Returns the matching session element or null

### Test 6.4: Get Active Session
**Steps:**
1. Click on a session in the sidebar to select it
2. Run: `window.RefinedClaudeCode.sessions.getActive()`

**Expected Result:** Returns the currently selected session element

### Test 6.5: Trigger Hover
**Steps:**
1. Get a session element: `let s = window.RefinedClaudeCode.sessions.getAll()[0]`
2. Run: `window.RefinedClaudeCode.sessions.triggerHover(s)`

**Expected Result:** Session shows hover state with action buttons visible

---

## Test Suite 7: Blocked Button Feature

### Test 7.1: Blocked Button Appears
**Steps:**
1. Hover over any session in the sidebar
2. Look for a warning triangle icon button

**Expected Result:** Warning icon button appears alongside delete/archive buttons

### Test 7.2: Mark Session as Blocked
**Steps:**
1. Click the blocked (warning) button on a session
2. Enter a reason when prompted (or leave empty)

**Expected Result:**
- Button turns amber/yellow
- Hover shows tooltip with block reason

### Test 7.3: Edit Block Reason
**Steps:**
1. Hover over a blocked session's warning icon
2. Click on the tooltip text

**Expected Result:** Inline editor appears to modify the block reason

### Test 7.4: Clear Blocked Status
**Steps:**
1. Click the blocked button on an already-blocked session
2. Clear the reason text

**Expected Result:** Warning icon returns to default state

---

## Test Suite 8: Settings Persistence

### Test 8.1: Feature Toggle Persistence
**Steps:**
1. Open popup and disable a feature (e.g., "Pull Branch")
2. Refresh the page
3. Open popup again

**Expected Result:** Feature remains disabled after refresh

### Test 8.2: Cross-Device Sync (if signed into Chrome)
**Steps:**
1. Configure settings on one device
2. Check settings on another device with same Chrome profile

**Expected Result:** Settings sync via Chrome's storage.sync API

### Test 8.3: Master Toggle Persistence
**Steps:**
1. Disable all features via the "Refined" badge
2. Close browser completely
3. Reopen and navigate to claude.ai/code

**Expected Result:** Features remain disabled

---

## Test Suite 9: Edge Cases

### Test 9.1: Empty Session List
**Steps:**
1. Navigate to claude.ai/code with no sessions (new account or delete all)
2. Verify no console errors

**Expected Result:** Extension loads without errors, waiting for sessions

### Test 9.2: Rapid Navigation
**Steps:**
1. Quickly click between multiple sessions
2. Quickly navigate between pages

**Expected Result:** UI elements update correctly without duplicates or missing elements

### Test 9.3: Extension Reload
**Steps:**
1. Go to chrome://extensions/
2. Click "Reload" on the extension
3. Return to claude.ai/code

**Expected Result:** All features re-inject properly

### Test 9.4: Page Refresh
**Steps:**
1. Press F5 or Ctrl+R on claude.ai/code page

**Expected Result:** All features appear after page loads

---

## Test Suite 10: Error Handling

### Test 10.1: Missing DOM Elements
**Steps:**
1. Open DevTools Console
2. Filter for `[BCC]` messages
3. Use the extension normally

**Expected Result:** No error messages, only informational logs

### Test 10.2: Storage Failures
**Steps:**
1. Open DevTools → Application → Storage
2. Clear site data
3. Refresh page

**Expected Result:** Extension uses default settings gracefully

---

## Debugging Tips

1. **Console Logging:** All extension logs are prefixed with `[BCC]`
   ```javascript
   // Filter in DevTools Console:
   // Click filter icon, type: BCC
   ```

2. **Inspect Injected Elements:**
   - Right-click any injected button → Inspect
   - Look for elements with `refined-` class prefixes

3. **Check Storage:**
   - DevTools → Application → Local Storage → claude.ai
   - DevTools → Application → Extension Storage

4. **Force Re-injection:**
   ```javascript
   // In console, trigger mutation observer:
   document.body.appendChild(document.createElement('div'));
   ```

---

## Test Results Template

| Test ID | Test Name | Pass/Fail | Notes |
|---------|-----------|-----------|-------|
| 1.1 | Extension Loads Successfully | | |
| 1.2 | Content Script Injection | | |
| 1.3 | Popup Opens | | |
| 2.1 | Label Appears | | |
| 2.2 | Label Toggle (Disable) | | |
| 2.3 | Label Toggle (Enable) | | |
| 3.1 | Button Appears on PR Page | | |
| 3.2 | Copy Branch Command | | |
| 4.1 | Button Appears | | |
| 4.2 | Insert Merge Prompt | | |
| 5.1 | Configure Project Color | | |
| 5.2 | Color Applied in Sidebar | | |
| 5.3 | Remove Project Color | | |
| 6.1 | Get All Sessions | | |
| 6.2 | Get Sessions with Data | | |
| 6.3 | Find Session by Title | | |
| 6.4 | Get Active Session | | |
| 6.5 | Trigger Hover | | |
| 7.1 | Blocked Button Appears | | |
| 7.2 | Mark Session as Blocked | | |
| 7.3 | Edit Block Reason | | |
| 7.4 | Clear Blocked Status | | |
| 8.1 | Feature Toggle Persistence | | |
| 8.2 | Cross-Device Sync | | |
| 8.3 | Master Toggle Persistence | | |
| 9.1 | Empty Session List | | |
| 9.2 | Rapid Navigation | | |
| 9.3 | Extension Reload | | |
| 9.4 | Page Refresh | | |
| 10.1 | Missing DOM Elements | | |
| 10.2 | Storage Failures | | |
