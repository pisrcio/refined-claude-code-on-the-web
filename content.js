// Refined Claude Code on the Web - Content Script
// Features: Mode Button, Refined Label, Pull Branch in CLI

(function() {
  'use strict';

  const LOG_PREFIX = '[BCC]';

  // ============================================
  // Settings Management
  // ============================================

  const DEFAULT_SETTINGS = {
    allEnabled: true,
    modeButton: true,
    defaultMode: 'last', // 'agent', 'plan', or 'last'
    refinedLabel: true,
    pullBranch: true,
    mergeBranch: true,
    projectColors: true,
    projectColorMap: {}, // { "project-name": "#hexcolor" }
    projectMainBranch: {} // { "project-name": "main" }
  };

  let currentSettings = { ...DEFAULT_SETTINGS };

  // Load settings from storage
  function loadSettings() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
            if (chrome.runtime.lastError) {
              resolve(currentSettings);
            } else {
              currentSettings = result;
              resolve(currentSettings);
            }
          });
        } else {
          resolve(currentSettings);
        }
      } catch (e) {
        resolve(currentSettings);
      }
    });
  }

  // Save settings to storage
  function saveSettings(settings) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set(settings, () => {
          currentSettings = { ...currentSettings, ...settings };
          resolve();
        });
      } else {
        currentSettings = { ...currentSettings, ...settings };
        resolve();
      }
    });
  }

  // Check if a feature is enabled
  function isFeatureEnabled(feature) {
    return currentSettings.allEnabled && currentSettings[feature];
  }

  // Listen for settings changes from popup
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        for (const [key, { newValue }] of Object.entries(changes)) {
          currentSettings[key] = newValue;
        }
        applySettings();
      }
    });
  }

  // Apply current settings to the page
  function applySettings() {
    // Update Refined label appearance
    updateRefinedLabelState();

    // Toggle mode button
    const modeContainer = document.querySelector('.bcc-mode-container');
    if (modeContainer) {
      modeContainer.style.display = isFeatureEnabled('modeButton') ? 'inline-flex' : 'none';
    }

    // Toggle pull branch button
    const pullBranchBtn = document.querySelector('.refined-pull-branch-btn');
    if (pullBranchBtn) {
      pullBranchBtn.style.display = isFeatureEnabled('pullBranch') ? 'flex' : 'none';
    }

    // Toggle merge branch button
    const mergeBranchBtn = document.querySelector('.refined-merge-branch-btn');
    if (mergeBranchBtn) {
      mergeBranchBtn.style.display = isFeatureEnabled('mergeBranch') ? 'flex' : 'none';
    }

    // Apply project colors
    applyProjectColors();
  }

  // Update Refined label appearance based on settings
  function updateRefinedLabelState() {
    const refinedLabel = document.querySelector('.refined-label');
    if (!refinedLabel) return;

    const allEnabled = currentSettings.allEnabled;

    if (allEnabled) {
      refinedLabel.classList.remove('refined-label-disabled');
      refinedLabel.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        margin-left: 8px;
        font-size: 12px;
        font-family: inherit;
        font-weight: 500;
        line-height: 1.25;
        color: #059669;
        background-color: #d1fae5;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      `;
    } else {
      refinedLabel.classList.add('refined-label-disabled');
      refinedLabel.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        margin-left: 8px;
        font-size: 12px;
        font-family: inherit;
        font-weight: 500;
        line-height: 1.25;
        color: #9ca3af;
        background-color: #f3f4f6;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: line-through;
      `;
    }
  }

  // ============================================
  // Mode Button Feature
  // ============================================

  let modeButton = null;
  let dropdown = null;
  const MODE_STORAGE_KEY = 'bcc-mode-preference';
  let currentMode = 'Agent'; // Will be set properly in init() based on settings

  // Determine initial mode based on settings
  function getInitialMode() {
    const defaultModeSetting = currentSettings.defaultMode || 'last';

    switch (defaultModeSetting) {
      case 'agent':
        return 'Agent';
      case 'plan':
        return 'Plan';
      case 'last':
      default:
        return localStorage.getItem(MODE_STORAGE_KEY) || 'Agent';
    }
  }

  function createModeButton() {
    // Always get fresh initial mode based on current settings
    currentMode = getInitialMode();

    // Create container
    const container = document.createElement('div');
    container.className = 'bcc-mode-container';
    // Apply inline styles to override page CSS
    container.style.cssText = 'position: relative !important; display: inline-flex !important; flex-direction: row !important; align-items: center !important; margin-right: 8px !important; z-index: 1000 !important;';

    // Create button
    modeButton = document.createElement('button');
    modeButton.className = 'bcc-mode-button';
    modeButton.type = 'button'; // Prevent form submission
    // Apply inline styles to override page CSS
    modeButton.style.cssText = 'display: inline-flex !important; flex-direction: row !important; align-items: center !important; gap: 6px !important; padding: 6px 10px !important; background: transparent !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; cursor: pointer !important; font-size: 13px !important; white-space: nowrap !important;';
    modeButton.innerHTML = `
      <span class="bcc-mode-label" style="display: inline !important; font-weight: 500 !important;">${currentMode}</span>
      <svg class="bcc-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block !important; opacity: 0.6 !important;">
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    `;
    modeButton.addEventListener('click', (e) => {
      toggleDropdown(e);
    });

    // Create dropdown - append to body to avoid overflow clipping
    dropdown = document.createElement('div');
    dropdown.id = 'bcc-dropdown-' + Date.now(); // Unique ID for CSS targeting
    dropdown.className = 'bcc-mode-dropdown';

    // Inject stylesheet with high specificity rules
    if (!document.getElementById('bcc-dropdown-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'bcc-dropdown-styles';
      styleEl.textContent = `
        .bcc-mode-dropdown[id^="bcc-dropdown-"] {
          position: fixed !important;
          display: block !important;
          min-width: 120px !important;
          min-height: 40px !important;
          padding: 4px 0 !important;
          background: #ffffff !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          z-index: 999999 !important;
          overflow: visible !important;
        }
        .bcc-mode-dropdown[id^="bcc-dropdown-"].bcc-dropdown-hidden {
          display: block !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .bcc-mode-dropdown[id^="bcc-dropdown-"].bcc-dropdown-visible {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        .bcc-mode-dropdown[id^="bcc-dropdown-"] .bcc-mode-option {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 10px 12px !important;
          margin: 0 !important;
          cursor: pointer !important;
          font-size: 13px !important;
          background: #ffffff !important;
          color: #000000 !important;
          min-height: 36px !important;
          box-sizing: border-box !important;
        }
        .bcc-mode-dropdown[id^="bcc-dropdown-"] .bcc-mode-option:hover {
          background: #f3f4f6 !important;
        }
        .bcc-mode-dropdown[id^="bcc-dropdown-"] .bcc-check {
          display: inline-block !important;
          width: 16px !important;
          color: #10a37f !important;
          font-weight: bold !important;
        }
        .bcc-mode-dropdown[id^="bcc-dropdown-"] span {
          display: inline !important;
          color: #000000 !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    dropdown.classList.add('bcc-dropdown-hidden');
    dropdown.innerHTML = `
      <div class="bcc-mode-option" data-mode="Agent">
        <span class="bcc-check">${currentMode === 'Agent' ? '&#10003;' : ''}</span>
        <span>Agent</span>
      </div>
      <div class="bcc-mode-option" data-mode="Plan">
        <span class="bcc-check">${currentMode === 'Plan' ? '&#10003;' : ''}</span>
        <span>Plan</span>
      </div>
    `;

    // Add hover effect for dropdown options
    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      option.addEventListener('mouseenter', () => {
        option.style.backgroundColor = '#f3f4f6';
      });
      option.addEventListener('mouseleave', () => {
        option.style.backgroundColor = '#ffffff';
      });
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectMode(option.dataset.mode);
      });
    });

    container.appendChild(modeButton);
    // Append dropdown to body to avoid overflow issues
    document.body.appendChild(dropdown);

    return container;
  }

  function toggleDropdown(e) {
    e.stopPropagation();
    e.preventDefault();

    if (!dropdown) {
      console.error(LOG_PREFIX, 'ERROR: dropdown is null or undefined!');
      return;
    }

    // Check visibility using class instead of inline style
    const isVisible = dropdown.classList.contains('bcc-dropdown-visible');

    if (isVisible) {
      closeDropdown();
    } else {
      // Position dropdown below the button
      const buttonRect = modeButton.getBoundingClientRect();
      const finalTop = buttonRect.bottom + 4;
      const finalLeft = buttonRect.left;

      dropdown.style.top = finalTop + 'px';
      dropdown.style.left = finalLeft + 'px';

      // Toggle classes for visibility (CSS handles opacity/visibility with !important)
      dropdown.classList.remove('bcc-dropdown-hidden');
      dropdown.classList.add('bcc-dropdown-visible');

      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', closeDropdown, { once: true });
      }, 0);
    }
  }

  function closeDropdown(e) {
    if (!dropdown) {
      return;
    }
    // Use class toggling for visibility (CSS handles the styles with !important)
    dropdown.classList.remove('bcc-dropdown-visible');
    dropdown.classList.add('bcc-dropdown-hidden');
  }

  function selectMode(mode) {
    currentMode = mode;
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    modeButton.querySelector('.bcc-mode-label').textContent = mode;

    // Update checkmarks
    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      const check = option.querySelector('.bcc-check');
      check.textContent = option.dataset.mode === mode ? '✓' : '';
    });

    closeDropdown();
  }

  // Reset mode to default when navigating to a new session
  function resetModeToDefault() {
    const newMode = getInitialMode();
    currentMode = newMode;

    // Update button if it exists
    if (modeButton) {
      const label = modeButton.querySelector('.bcc-mode-label');
      if (label) {
        label.textContent = newMode;
      }
      // Update checkmarks in dropdown
      if (dropdown) {
        dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
          const check = option.querySelector('.bcc-check');
          check.textContent = option.dataset.mode === newMode ? '✓' : '';
        });
      }
    }
  }

  const PLAN_INSTRUCTION = 'DO NOT write any code yet. I just need the plan for me to review.';
  const PLAN_PREFIX = 'use @agent-plan : ';
  const PLAN_FULL_PREFIX = PLAN_INSTRUCTION + '\n\n' + PLAN_PREFIX;

  // Prepend plan mode text to the input field (called just before submit)
  function prependPlanModeText() {
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');

    if (!textField) return false;

    if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
      const currentValue = textField.value;
      if (currentValue.trim() && !currentValue.startsWith(PLAN_INSTRUCTION)) {
        textField.value = PLAN_FULL_PREFIX + currentValue;
        textField.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    } else {
      const currentText = textField.innerText || textField.textContent || '';
      if (currentText.trim() && !currentText.startsWith(PLAN_INSTRUCTION)) {
        textField.innerText = PLAN_FULL_PREFIX + currentText;
        textField.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // Setup submit handler to intercept form submission in Plan mode
  let submitHandlerSetup = false;
  function setupPlanModeSubmitHandler() {
    if (submitHandlerSetup) return;

    // Intercept Enter key press on text field
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && currentMode === 'Plan') {
        const textField = document.querySelector('div[contenteditable="true"]') ||
                          document.querySelector('textarea');
        if (textField && (e.target === textField || textField.contains(e.target))) {
          prependPlanModeText();
        }
      }
    }, true); // Use capture phase to run before other handlers

    // Intercept send button clicks
    document.addEventListener('click', (e) => {
      if (currentMode !== 'Plan') return;

      // Check if clicked element is or is inside a send button
      const button = e.target.closest('button');
      if (button) {
        // Skip our own extension buttons (e.g., mode button)
        if (button.classList.contains('bcc-mode-button')) return;

        // Look for send button by aria-label or by being inside a form
        const ariaLabel = button.getAttribute('aria-label') || '';
        const isInForm = button.closest('form');
        const isSendButton = ariaLabel.toLowerCase().includes('send') ||
                            ariaLabel.toLowerCase().includes('submit') ||
                            (isInForm && button.type === 'submit') ||
                            (isInForm && button.querySelector('svg') && !button.querySelector('[aria-label]'));

        // Also check for the specific send button (usually has an arrow icon and is in form)
        const formButtons = document.querySelectorAll('form button');
        const isLastFormButton = Array.from(formButtons).pop() === button;

        if (isSendButton || isLastFormButton) {
          prependPlanModeText();
        }
      }
    }, true); // Use capture phase

    submitHandlerSetup = true;
  }

  function findAndInjectModeButton() {
    const possibleContainers = [
      'form button[aria-label*="ttach"]',
      'form button[aria-label*="mage"]',
      'form button[aria-label*="ile"]',
      '[data-testid*="attach"]',
      '[data-testid*="upload"]',
      'form > div button',
      '.flex button svg',
    ];

    let targetButton = null;
    for (const selector of possibleContainers) {
      targetButton = document.querySelector(selector);
      if (targetButton) break;
    }

    let insertionPoint = null;

    if (targetButton) {
      insertionPoint = targetButton.closest('div');
    } else {
      const form = document.querySelector('form');
      if (form) {
        const buttonContainers = form.querySelectorAll('button');
        if (buttonContainers.length > 0) {
          insertionPoint = buttonContainers[0].parentElement;
        }
      }
    }

    if (document.querySelector('.bcc-mode-container')) {
      return;
    }

    let injected = false;
    if (insertionPoint) {
      const modeContainer = createModeButton();
      insertionPoint.insertBefore(modeContainer, insertionPoint.firstChild);
      injected = true;
    } else {
      const form = document.querySelector('form') || document.querySelector('[contenteditable="true"]')?.closest('div');
      if (form && !document.querySelector('.bcc-mode-container')) {
        const modeContainer = createModeButton();
        modeContainer.classList.add('bcc-floating');
        form.style.position = 'relative';
        form.insertBefore(modeContainer, form.firstChild);
        injected = true;
      }
    }

    // Setup submit handler to prepend plan mode text on form submission
    if (injected) {
      setupPlanModeSubmitHandler();
    }
  }

  // ============================================
  // Refined Label Feature
  // ============================================

  function addRefinedLabel() {
    // Check if refinedLabel feature is enabled (but we always show the label itself)
    if (!isFeatureEnabled('refinedLabel') && !currentSettings.allEnabled === false) {
      // Only hide label if refinedLabel specifically disabled but allEnabled is true
      const existingLabel = document.querySelector('.refined-label');
      if (existingLabel && currentSettings.allEnabled && !currentSettings.refinedLabel) {
        existingLabel.style.display = 'none';
        return true;
      }
    }

    const claudeCodeLink = document.querySelector('a[href="/code"]');

    if (!claudeCodeLink) {
      return false;
    }

    const parent = claudeCodeLink.parentElement;
    if (parent?.querySelector('.refined-label')) {
      updateRefinedLabelState();
      return true;
    }
    if (claudeCodeLink.nextElementSibling?.classList?.contains('refined-label')) {
      updateRefinedLabelState();
      return true;
    }

    const refinedLabel = document.createElement('span');
    refinedLabel.textContent = 'Refined';
    refinedLabel.className = 'refined-label';
    refinedLabel.title = 'Click to toggle all extension features';

    // Apply initial style based on current settings
    const allEnabled = currentSettings.allEnabled;
    if (allEnabled) {
      refinedLabel.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        margin-left: 8px;
        font-size: 12px;
        font-family: inherit;
        font-weight: 500;
        line-height: 1.25;
        color: #059669;
        background-color: #d1fae5;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      `;
    } else {
      refinedLabel.classList.add('refined-label-disabled');
      refinedLabel.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        margin-left: 8px;
        font-size: 12px;
        font-family: inherit;
        font-weight: 500;
        line-height: 1.25;
        color: #9ca3af;
        background-color: #f3f4f6;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: line-through;
      `;
    }

    // Add click handler to toggle all features
    refinedLabel.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const newAllEnabled = !currentSettings.allEnabled;

      await saveSettings({ allEnabled: newAllEnabled });

      // Show feedback then reload
      showToggleFeedback(newAllEnabled ? 'Features enabled - Reloading...' : 'Features disabled - Reloading...');

      // Reload the page after a short delay to show the feedback
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });

    // Add hover effect
    refinedLabel.addEventListener('mouseenter', () => {
      refinedLabel.style.opacity = '0.8';
    });
    refinedLabel.addEventListener('mouseleave', () => {
      refinedLabel.style.opacity = '1';
    });

    claudeCodeLink.parentNode.insertBefore(refinedLabel, claudeCodeLink.nextSibling);

    return true;
  }

  // Show visual feedback when toggling features
  function showToggleFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${message.includes('enabled') ? '#059669' : '#6b7280'};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 99999;
      animation: fadeInOut 2s ease-in-out;
    `;

    // Add animation keyframes if not already present
    if (!document.querySelector('#refined-claude-animations')) {
      const style = document.createElement('style');
      style.id = 'refined-claude-animations';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }

  // ============================================
  // Pull Branch in CLI Feature
  // ============================================

  // Add "Pull Branch in CLI" button next to Create PR button
  function watchForCopyBranchButton() {
    // Store the current branch name
    let currentBranchName = null;

    // Function to extract branch name from the page
    function extractBranchName() {
      // Look for elements that likely contain branch info (near GitHub icons, repo info, etc.)
      // First, try to find elements with specific patterns
      const candidates = document.querySelectorAll('span, div, p, a');

      for (const el of candidates) {
        // Skip elements with too much text (likely containers)
        const text = el.textContent || '';
        if (text.length > 100) continue;

        // Look for branch name pattern: claude/something-with-dashes
        // Must end at a word boundary (space, end of string, or non-alphanumeric)
        const branchMatch = text.match(/\b(claude\/[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9])\b/);
        if (branchMatch) {
          // Verify it looks like a real branch (has at least one hyphen and reasonable length)
          const branch = branchMatch[1];
          if (branch.includes('-') && branch.length > 10 && branch.length < 80) {
            return branch;
          }
        }
      }

      // Fallback: search page text more carefully
      const pageText = document.body.textContent || '';
      // Match branch pattern followed by whitespace or end
      const matches = pageText.match(/claude\/[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9](?=\s|$|Context|Rename|Archive|Delete)/g);
      if (matches && matches.length > 0) {
        // Return the first valid-looking branch
        for (const match of matches) {
          if (match.includes('-') && match.length > 10) {
            return match;
          }
        }
      }

      return null;
    }

    // Function to add the Pull Branch in CLI button
    function addPullBranchButton() {
      // Check if button already exists
      if (document.querySelector('.refined-pull-branch-btn')) {
        return;
      }

      // Find the Create PR or View PR button
      const allButtons = document.querySelectorAll('button');
      let prButton = null;

      for (const btn of allButtons) {
        const text = btn.textContent.trim();
        if (text.includes('Create PR') || text.includes('Create pull request') ||
            text.includes('View PR') || text.includes('View pull request')) {
          prButton = btn;
          break;
        }
      }

      if (!prButton) {
        return;
      }

      // Extract branch name
      currentBranchName = extractBranchName();
      if (!currentBranchName) {
        return;
      }

      // Create the Pull Branch in CLI button with exact same structure as Open in CLI
      const pullBranchBtn = document.createElement('button');
      pullBranchBtn.type = 'button';
      pullBranchBtn.className = 'group flex items-center gap-[6px] px-[10px] py-2 bg-bg-000 border-0.5 border-border-300 rounded-[6px] shadow-sm hover:bg-bg-100 transition-colors refined-pull-branch-btn';
      pullBranchBtn.title = `Copy: git fetch && git co ${currentBranchName} && git pull`;

      // Match exact HTML structure: text span first, then icon in wrapper div
      pullBranchBtn.innerHTML = `
        <span class="text-xs font-medium text-text-100 group-disabled:text-text-500">Pull Branch in CLI</span>
        <div class="group-disabled:text-text-500" style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: #3b82f6;">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="group-disabled:text-text-500" aria-hidden="true" style="flex-shrink: 0; color: #3b82f6;">
            <path d="M5.14648 7.14648C5.34175 6.95122 5.65825 6.95122 5.85352 7.14648L8.35352 9.64648C8.44728 9.74025 8.5 9.86739 8.5 10C8.5 10.0994 8.47037 10.1958 8.41602 10.2773L8.35352 10.3535L5.85352 12.8535C5.65825 13.0488 5.34175 13.0488 5.14648 12.8535C4.95122 12.6583 4.95122 12.3417 5.14648 12.1465L7.29297 10L5.14648 7.85352C4.95122 7.65825 4.95122 7.34175 5.14648 7.14648Z"></path>
            <path d="M14.5 12C14.7761 12 15 12.2239 15 12.5C15 12.7761 14.7761 13 14.5 13H9.5C9.22386 13 9 12.7761 9 12.5C9 12.2239 9.22386 12 9.5 12H14.5Z"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5 4C17.3284 4 18 4.67157 18 5.5V14.5C18 15.3284 17.3284 16 16.5 16H3.5C2.67157 16 2 15.3284 2 14.5V5.5C2 4.67157 2.67157 4 3.5 4H16.5ZM3.5 5C3.22386 5 3 5.22386 3 5.5V14.5C3 14.7761 3.22386 15 3.5 15H16.5C16.7761 15 17 14.7761 17 14.5V5.5C17 5.22386 16.7761 5 16.5 5H3.5Z"></path>
          </svg>
        </div>
      `;

      pullBranchBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Re-extract branch name in case it changed
        const branchName = extractBranchName() || currentBranchName;
        const gitCommand = `git fetch && git co ${branchName} && git pull`;

        try {
          await navigator.clipboard.writeText(gitCommand);
          showCopyFeedback('Command copied to clipboard');
        } catch (err) {
          console.error(LOG_PREFIX, 'Failed to copy:', err);
          // Fallback: try execCommand
          try {
            const textArea = document.createElement('textarea');
            textArea.value = gitCommand;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showCopyFeedback('Command copied to clipboard');
          } catch (fallbackErr) {
            console.error(LOG_PREFIX, 'Fallback copy failed:', fallbackErr);
          }
        }
      });

      // Find the flex container - structure varies between Create PR and View PR
      // View PR: prButton > animate-wrapper > flex-container
      // Create PR: prButton > flex-h-8 > animate-wrapper > flex-container
      const flexContainer = prButton.closest('.flex.items-center.gap-2');

      if (!flexContainer) {
        return;
      }

      // Find the Open in CLI button wrapper to insert before it
      const openInCLIBtn = Array.from(flexContainer.querySelectorAll('button')).find(
        btn => btn.textContent.includes('Open in CLI')
      );
      const insertBeforeEl = openInCLIBtn?.closest('.animate-\\[fade_300ms_ease-out\\]') ||
                             flexContainer.lastElementChild;

      // Create our own wrapper div to match the existing structure
      const wrapper = document.createElement('div');
      wrapper.className = 'animate-[fade_300ms_ease-out]';
      wrapper.appendChild(pullBranchBtn);

      // Insert before Open in CLI
      flexContainer.insertBefore(wrapper, insertBeforeEl);
    }

    // Show visual feedback when copy succeeds
    function showCopyFeedback(message) {
      const feedback = document.createElement('div');
      feedback.textContent = message;
      feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #059669;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 99999;
        animation: fadeInOut 2s ease-in-out;
        max-width: 400px;
        word-break: break-all;
      `;

      // Add animation keyframes if not already present
      if (!document.querySelector('#refined-claude-animations')) {
        const style = document.createElement('style');
        style.id = 'refined-claude-animations';
        style.textContent = `
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            15% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 2000);
    }

    // Watch for DOM changes to detect when PR button appears
    const observer = new MutationObserver((mutations) => {
      // Check periodically for the Create PR button
      addPullBranchButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also try immediately and after delays
    addPullBranchButton();
    setTimeout(addPullBranchButton, 500);
    setTimeout(addPullBranchButton, 1000);
    setTimeout(addPullBranchButton, 2000);

    return observer;
  }

  // ============================================
  // Merge Branch Feature
  // ============================================

  // Add "Merge [main]" button next to View PR button
  function watchForMergeBranchButton() {
    // Function to get current project name from GitHub link
    function getCurrentProjectFromGitHubLink() {
      // Find spans containing GitHub URLs (from git push output)
      // e.g., <span>remote:      https://github.com/pisrcio/refined-claude-code-on-the-web/pull/new/...</span>
      const allSpans = document.querySelectorAll('span');

      for (const span of allSpans) {
        const text = span.textContent || '';
        if (!text.includes('github.com/')) continue;

        // Extract GitHub URL from text
        const match = text.match(/github\.com\/([^/]+)\/([^/\s]+)/);
        if (match && match[2]) {
          console.log(LOG_PREFIX, 'Found GitHub URL in span:', text.trim());
          console.log(LOG_PREFIX, 'Extracted project name:', match[2]);
          return match[2];
        }
      }

      console.log(LOG_PREFIX, 'No project name found from spans');
      return null;
    }

    // Function to get main branch from settings
    // Uses the GitHub link to determine current project
    function getMainBranchFromSettings() {
      const projectMainBranch = currentSettings.projectMainBranch || {};
      console.log(LOG_PREFIX, 'projectMainBranch settings:', projectMainBranch);

      // Get current project from GitHub link
      const currentProject = getCurrentProjectFromGitHubLink();
      console.log(LOG_PREFIX, 'Current project:', currentProject);

      if (currentProject && projectMainBranch[currentProject]) {
        console.log(LOG_PREFIX, 'Found main branch for project:', projectMainBranch[currentProject]);
        return projectMainBranch[currentProject];
      }

      // Default to 'main' if no match found
      console.log(LOG_PREFIX, 'Using default branch: main');
      return 'main';
    }

    // Function to add the Merge Branch button
    function addMergeBranchButton() {
      // Check if button already exists
      if (document.querySelector('.refined-merge-branch-btn')) {
        return;
      }

      // Find the Create PR or View PR button (same as Pull Branch uses)
      const allButtons = document.querySelectorAll('button');
      let prButton = null;

      for (const btn of allButtons) {
        const text = btn.textContent.trim();
        if (text.includes('Create PR') || text.includes('Create pull request') ||
            text.includes('View PR') || text.includes('View pull request')) {
          prButton = btn;
          break;
        }
      }

      if (!prButton) {
        return;
      }

      // Create the Merge Branch button with similar styling
      const mergeBranchBtn = document.createElement('button');
      mergeBranchBtn.type = 'button';
      mergeBranchBtn.className = 'group flex items-center gap-[6px] px-[10px] py-2 bg-bg-000 border-0.5 border-border-300 rounded-[6px] shadow-sm hover:bg-bg-100 transition-colors refined-merge-branch-btn';
      mergeBranchBtn.title = `Insert merge request into text field`;

      // Function to update button label with current branch
      function updateButtonLabel() {
        const mainBranch = getMainBranchFromSettings();
        mergeBranchBtn.innerHTML = `
          <span class="text-xs font-medium text-text-100 group-disabled:text-text-500">Merge <em style="font-style: italic;">${mainBranch}</em></span>
          <div class="group-disabled:text-text-500" style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: #8b5cf6;">
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="group-disabled:text-text-500" aria-hidden="true" style="flex-shrink: 0; color: #8b5cf6;">
              <path d="M108,64A36,36,0,1,0,60,97.94v60.12a36,36,0,1,0,24,0V97.94A36.07,36.07,0,0,0,108,64ZM72,52A12,12,0,1,1,60,64,12,12,0,0,1,72,52Zm0,152a12,12,0,1,1,12-12A12,12,0,0,1,72,204Zm140-45.94V110.63a27.81,27.81,0,0,0-8.2-19.8L173,60h19a12,12,0,0,0,0-24H144a12,12,0,0,0-12,12V96a12,12,0,0,0,24,0V77l30.83,30.83a4,4,0,0,1,1.17,2.83v47.43a36,36,0,1,0,24,0ZM200,204a12,12,0,1,1,12-12A12,12,0,0,1,200,204Z"></path>
            </svg>
          </div>
        `;
      }

      // Set initial label
      updateButtonLabel();

      // Update label after delays to catch when GitHub link appears
      setTimeout(updateButtonLabel, 500);
      setTimeout(updateButtonLabel, 1000);
      setTimeout(updateButtonLabel, 2000);

      mergeBranchBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Get main branch from settings
        const branch = getMainBranchFromSettings();
        const mergeMessage = `Merge the "${branch}" branch in and fix merge conflicts.`;

        // Find the main chat text field
        // Look for the textarea with id="turn-textarea" or placeholder="Reply..."
        const textField = document.querySelector('textarea#turn-textarea') ||
                          document.querySelector('textarea[placeholder="Reply..."]') ||
                          document.querySelector('form textarea') ||
                          document.querySelector('div[contenteditable="true"]');

        if (textField) {
          if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
            textField.value = mergeMessage;
            textField.focus();
            textField.setSelectionRange(textField.value.length, textField.value.length);
            textField.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            textField.focus();
            textField.innerText = mergeMessage;
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(textField);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            textField.dispatchEvent(new Event('input', { bubbles: true }));
          }
          showMergeCopyFeedback('Merge message inserted');
        } else {
          console.error(LOG_PREFIX, 'Text field not found');
        }
      });

      // Find the flex container - structure varies between Create PR and View PR
      const flexContainer = prButton.closest('.flex.items-center.gap-2');

      if (!flexContainer) {
        return;
      }

      // Create our own wrapper div to match the existing structure
      const wrapper = document.createElement('div');
      wrapper.className = 'animate-[fade_300ms_ease-out]';
      wrapper.appendChild(mergeBranchBtn);

      // Find Pull Branch wrapper if it exists to insert after it
      const pullBranchBtn = document.querySelector('.refined-pull-branch-btn');
      const pullBranchWrapper = pullBranchBtn?.closest('.animate-\\[fade_300ms_ease-out\\]');

      if (pullBranchWrapper && pullBranchWrapper.parentNode === flexContainer) {
        // Insert after Pull Branch (before the next sibling)
        flexContainer.insertBefore(wrapper, pullBranchWrapper.nextSibling);
      } else {
        // Find Open in CLI to insert before it
        const openInCLIBtn = Array.from(flexContainer.querySelectorAll('button')).find(
          btn => btn.textContent.includes('Open in CLI')
        );
        const insertBeforeEl = openInCLIBtn?.closest('.animate-\\[fade_300ms_ease-out\\]') ||
                               flexContainer.lastElementChild;
        flexContainer.insertBefore(wrapper, insertBeforeEl);
      }
    }

    // Show visual feedback when copy succeeds
    function showMergeCopyFeedback(message) {
      const feedback = document.createElement('div');
      feedback.textContent = message;
      feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #8b5cf6;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 99999;
        animation: fadeInOut 2s ease-in-out;
        max-width: 400px;
        word-break: break-all;
      `;

      // Add animation keyframes if not already present
      if (!document.querySelector('#refined-claude-animations')) {
        const style = document.createElement('style');
        style.id = 'refined-claude-animations';
        style.textContent = `
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            15% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 2000);
    }

    // Watch for DOM changes to detect when View PR button appears
    const observer = new MutationObserver((mutations) => {
      // Check periodically for the View PR button
      addMergeBranchButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also try immediately and after delays
    addMergeBranchButton();
    setTimeout(addMergeBranchButton, 500);
    setTimeout(addMergeBranchButton, 1000);
    setTimeout(addMergeBranchButton, 2000);

    return observer;
  }

  // ============================================
  // Session Detection Feature
  // ============================================

  /**
   * Session detection utilities for reliably finding sessions and their action buttons.
   *
   * Structure of a session item in the sidebar:
   * - Wrapper: div[data-index="N"] (N = 0, 1, 2, ...)
   * - Inside: div.group > div.cursor-pointer > ...
   * - Title: span.font-base.text-text-100.leading-relaxed
   * - Buttons container: div.group-hover:opacity-100 (appears on hover)
   * - Delete button: contains trash icon SVG (viewBox="0 0 256 256")
   * - Archive button: contains archive/box icon SVG (viewBox="0 0 20 20")
   */

  // SVG path fragments for identifying button types
  const DELETE_ICON_PATH_START = 'M216,48H176V40a24';  // Trash icon path
  const ARCHIVE_ICON_PATH_FRAGMENT = 'M11.5 9.5C11.7761';  // Archive/box icon path

  /**
   * Get all session elements from the sidebar
   * @returns {NodeListOf<Element>} All session wrapper elements
   */
  function getAllSessions() {
    // Sessions are in elements with data-index attribute
    // They're inside the scrollable session list container
    const sessions = document.querySelectorAll('[data-index]');
    return sessions;
  }

  /**
   * Get session data from a session element
   * @param {Element} sessionEl - The session element (with data-index)
   * @returns {Object|null} Session data or null if not parseable
   */
  function getSessionData(sessionEl) {
    if (!sessionEl || !sessionEl.hasAttribute('data-index')) {
      return null;
    }

    const index = parseInt(sessionEl.getAttribute('data-index'), 10);

    // Find the title span
    const titleSpan = sessionEl.querySelector('span.font-base.text-text-100.leading-relaxed');
    const title = titleSpan ? titleSpan.textContent.trim() : null;

    // Find metadata (repo name, date, diff stats)
    const metaSpan = sessionEl.querySelector('span.text-xs.text-text-500');
    const metadata = metaSpan ? metaSpan.textContent.trim() : null;

    // Check if this session is currently selected (has bg-bg-300 class on the row)
    const row = sessionEl.querySelector('.cursor-pointer');
    const isSelected = row ? row.classList.contains('bg-bg-300') : false;

    // Check if session is currently running (has the spinner animation)
    const spinner = sessionEl.querySelector('.code-spinner-animate');
    const isRunning = !!spinner;

    return {
      element: sessionEl,
      index,
      title,
      metadata,
      isSelected,
      isRunning
    };
  }

  /**
   * Get all sessions with their data
   * @returns {Array<Object>} Array of session data objects
   */
  function getAllSessionsWithData() {
    const sessions = getAllSessions();
    const sessionData = [];

    sessions.forEach(sessionEl => {
      const data = getSessionData(sessionEl);
      if (data) {
        sessionData.push(data);
      }
    });

    return sessionData;
  }

  /**
   * Find a session by its title
   * @param {string} title - The session title to search for
   * @returns {Object|null} Session data or null if not found
   */
  function findSessionByTitle(title) {
    const sessions = getAllSessions();

    for (const sessionEl of sessions) {
      const data = getSessionData(sessionEl);
      if (data && data.title === title) {
        return data;
      }
    }

    return null;
  }

  /**
   * Find the delete button for a session element
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The delete button or null
   */
  function findDeleteButton(sessionEl) {
    if (!sessionEl) return null;

    // Find all buttons in the session
    const buttons = sessionEl.querySelectorAll('button');

    for (const button of buttons) {
      // Look for the trash icon SVG
      const svg = button.querySelector('svg');
      if (!svg) continue;

      // Check viewBox for the trash icon (256x256)
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox !== '0 0 256 256') continue;

      // Check path for trash icon pattern
      const path = svg.querySelector('path');
      if (path) {
        const d = path.getAttribute('d') || '';
        if (d.startsWith(DELETE_ICON_PATH_START)) {
          return button;
        }
      }
    }

    return null;
  }

  /**
   * Find the archive button for a session element
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The archive button or null
   */
  function findArchiveButton(sessionEl) {
    if (!sessionEl) return null;

    // Find all buttons in the session
    const buttons = sessionEl.querySelectorAll('button');

    for (const button of buttons) {
      // Look for the archive icon SVG
      const svg = button.querySelector('svg');
      if (!svg) continue;

      // Check viewBox for the archive icon (20x20)
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox !== '0 0 20 20') continue;

      // Check paths for archive icon pattern
      const paths = svg.querySelectorAll('path');
      for (const path of paths) {
        const d = path.getAttribute('d') || '';
        if (d.includes(ARCHIVE_ICON_PATH_FRAGMENT)) {
          return button;
        }
      }
    }

    return null;
  }

  /**
   * Find the buttons container in a session element using multiple fallback methods
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The buttons container or null
   */
  function findButtonsContainer(sessionEl) {
    if (!sessionEl) return null;

    // Method 1: Try the known structure - group-hover container (new structure uses this)
    const hoverContainer = sessionEl.querySelector('.group-hover\\:opacity-100');
    if (hoverContainer) {
      return hoverContainer;
    }

    // Method 2: Find the container with absolute positioning that shows on hover
    // New structure: div.absolute.-right-1...opacity-0.group-hover:opacity-100
    const absoluteHoverContainer = sessionEl.querySelector('.flex-shrink-0 .absolute');
    if (absoluteHoverContainer) {
      return absoluteHoverContainer;
    }

    // Method 3: Try to find via the relative container in flex-shrink-0
    const relativeContainer = sessionEl.querySelector('.flex-shrink-0 .relative');
    if (relativeContainer) {
      // Look for the first div child that might be the buttons container
      const firstDiv = relativeContainer.querySelector('div');
      if (firstDiv) {
        return firstDiv;
      }
      // Or return the relative container itself
      return relativeContainer;
    }

    // Method 4: Find any button in the session and get its parent container
    const anyButton = sessionEl.querySelector('button');
    if (anyButton) {
      // The button's immediate parent is likely the buttons container
      return anyButton.parentElement;
    }

    return null;
  }

  /**
   * Find the container for the blocked indicator (should be visible even without hover)
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The container for the indicator or null
   */
  function findIndicatorContainer(sessionEl) {
    if (!sessionEl) return null;

    // Method 1: New structure - div.relative.flex.items-center inside flex-shrink-0
    // The indicator should be a sibling of the hover container, not inside it
    const relativeFlexContainer = sessionEl.querySelector('.flex-shrink-0 > .relative.flex');
    if (relativeFlexContainer) {
      return relativeFlexContainer;
    }

    // Method 2: The documented structure - .flex-shrink-0 .relative
    const relativeContainer = sessionEl.querySelector('.flex-shrink-0 .relative');
    if (relativeContainer) {
      return relativeContainer;
    }

    // Method 3: Find the parent of the buttons container (should be always visible)
    const buttonsContainer = findButtonsContainer(sessionEl);
    if (buttonsContainer?.parentElement) {
      // Make sure we're getting a container that's not hidden on hover
      const parent = buttonsContainer.parentElement;
      if (!parent.classList.contains('opacity-0')) {
        return parent;
      }
      // Go one level up
      if (parent.parentElement) {
        return parent.parentElement;
      }
    }

    // Method 4: Find flex-shrink-0 directly
    const flexShrink = sessionEl.querySelector('.flex-shrink-0');
    if (flexShrink) {
      return flexShrink;
    }

    return null;
  }

  /**
   * Get action buttons for a session
   * @param {Element} sessionEl - The session element
   * @returns {Object} Object with deleteButton and archiveButton properties
   */
  function getSessionButtons(sessionEl) {
    return {
      deleteButton: findDeleteButton(sessionEl),
      archiveButton: findArchiveButton(sessionEl)
    };
  }

  /**
   * Trigger hover state on a session to reveal buttons
   * The buttons are hidden by default and only appear on hover
   * @param {Element} sessionEl - The session element
   * @returns {Promise<void>} Resolves when hover events are dispatched
   */
  function triggerSessionHover(sessionEl) {
    return new Promise((resolve) => {
      if (!sessionEl) {
        resolve();
        return;
      }

      // Find the group container that has hover effects
      const groupEl = sessionEl.querySelector('.group');
      if (groupEl) {
        // Dispatch mouseenter to trigger hover state
        groupEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }

      // Give time for CSS transitions
      setTimeout(resolve, 100);
    });
  }

  /**
   * Clear hover state on a session
   * @param {Element} sessionEl - The session element
   */
  function clearSessionHover(sessionEl) {
    if (!sessionEl) return;

    const groupEl = sessionEl.querySelector('.group');
    if (groupEl) {
      groupEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }
  }

  /**
   * Find the currently selected/active session
   * @returns {Object|null} Session data for the active session or null
   */
  function getActiveSession() {
    const sessions = getAllSessions();

    for (const sessionEl of sessions) {
      const row = sessionEl.querySelector('.cursor-pointer');
      if (row && row.classList.contains('bg-bg-300')) {
        return getSessionData(sessionEl);
      }
    }

    return null;
  }

  /**
   * Find sessions that are currently running (have the spinner)
   * @returns {Array<Object>} Array of running session data objects
   */
  function getRunningSessions() {
    const sessions = getAllSessionsWithData();
    return sessions.filter(session => session.isRunning);
  }

  // ============================================
  // Blocked Button Feature
  // ============================================

  // Exclamation/warning icon SVG (Phosphor WarningCircle style, 256x256 viewBox to match other icons)
  const BLOCKED_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"></path></svg>`;

  // Path fragment to identify blocked button
  const BLOCKED_ICON_PATH_FRAGMENT = 'M128,24A104,104,0,1,0,232,128';

  /**
   * Find the blocked button for a session element (if already added)
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The blocked button or null
   */
  function findBlockedButton(sessionEl) {
    if (!sessionEl) return null;
    return sessionEl.querySelector('.bcc-blocked-btn');
  }

  /**
   * Create a blocked button element
   * @returns {HTMLButtonElement} The blocked button element
   */
  function createBlockedButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bcc-blocked-btn inline-flex items-center justify-center relative shrink-0 can-focus select-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none border-transparent transition font-base duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] h-6 w-6 rounded-md active:scale-95 bg-bg-300 text-text-500 hover:text-warning-100';
    button.title = 'Mark as blocked';
    button.innerHTML = BLOCKED_ICON_SVG;

    // Ensure button is visible with explicit inline styles
    button.style.cssText = `
      display: inline-flex !important;
      width: 24px !important;
      height: 24px !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      margin: 0 !important;
      background-color: rgba(0, 0, 0, 0.05) !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
      color: #6b7280 !important;
      transition: all 0.2s !important;
    `;

    return button;
  }

  /**
   * Add blocked button to a session element
   * @param {Element} sessionEl - The session element
   * @returns {HTMLButtonElement|null} The added button or null if already exists
   */
  function addBlockedButtonToSession(sessionEl) {
    if (!sessionEl) {
      return null;
    }

    // Check if already added
    const existingBtn = findBlockedButton(sessionEl);
    if (existingBtn) {
      return null;
    }

    // Try to find where to insert the blocked button
    let buttonsContainer = null;
    let archiveButton = null;

    // Method 1: Find the archive button - we'll insert next to it
    archiveButton = findArchiveButton(sessionEl);
    if (archiveButton) {
      buttonsContainer = archiveButton.parentElement;
    }

    // Method 2: Find the buttons container directly
    if (!buttonsContainer) {
      buttonsContainer = findButtonsContainer(sessionEl);
    }

    // If we couldn't find anywhere to insert, still try to add the indicator
    // for previously blocked sessions
    if (!buttonsContainer) {
      // Try to restore blocked indicator even without the button
      const sessionData = getSessionData(sessionEl);
      getBlockedReason(sessionData).then((reason) => {
        if (reason !== null) {
          addBlockedIndicator(sessionEl);
        }
      });
      return null;
    }

    // Create the blocked button (no wrapper needed - insert directly like archive button)
    const blockedButton = createBlockedButton();

    // Ensure the container has horizontal flex layout for side-by-side buttons
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'row';
    buttonsContainer.style.alignItems = 'center';
    buttonsContainer.style.gap = '4px';

    // Insert the button next to archive button (or append to container)
    if (archiveButton) {
      // Insert after the archive button (as a sibling inside the same container)
      archiveButton.parentNode.insertBefore(blockedButton, archiveButton.nextSibling);
    } else {
      // Append to the container
      buttonsContainer.appendChild(blockedButton);
    }

    // Check if this session was previously blocked (restore state from storage)
    const sessionData = getSessionData(sessionEl);
    getBlockedReason(sessionData).then((reason) => {
      if (reason !== null) {
        // Mark as blocked without showing modal
        blockedButton.classList.add('bcc-blocked-active');
        blockedButton.style.color = '#ef4444';
        blockedButton.title = 'Marked as blocked - click to unblock';
        addBlockedIndicator(sessionEl);
      }
    });

    // Add click handler
    blockedButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleBlockedClick(sessionEl, blockedButton);
    });

    // Add hover handler to show tooltip
    let tooltipElement = null;
    blockedButton.addEventListener('mouseenter', () => {
      getBlockedReason(sessionData).then((message) => {
        // Only show tooltip if there's an actual message (not just the marker)
        if (message && message !== BLOCKED_NO_REASON_MARKER) {
          // Create tooltip if it doesn't exist
          if (!tooltipElement) {
            tooltipElement = document.createElement('div');
            tooltipElement.className = 'bcc-blocked-tooltip';
            tooltipElement.style.cssText = `
              position: fixed;
              background: #1f2937;
              color: white;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 13px;
              white-space: normal;
              max-width: 250px;
              word-wrap: break-word;
              z-index: 100001;
              line-height: 1.4;
              cursor: pointer;
              pointer-events: auto;
            `;
            tooltipElement.textContent = message;

            // Edit on click
            tooltipElement.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              if (tooltipElement && document.body.contains(tooltipElement)) {
                tooltipElement.remove();
                tooltipElement = null;
              }
              showBlockedReasonEditor(blockedButton, sessionData, (newMessage) => {
                // Clear tooltip so it gets recreated with new message
                if (tooltipElement) {
                  tooltipElement.remove();
                  tooltipElement = null;
                }
              });
            });

            document.body.appendChild(tooltipElement);
          }

          // Position the tooltip above the button
          const buttonRect = blockedButton.getBoundingClientRect();
          const tooltipWidth = tooltipElement.offsetWidth;
          const tooltipHeight = tooltipElement.offsetHeight;

          let left = buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2;
          let top = buttonRect.top - tooltipHeight - 8;

          // Clamp to viewport bounds
          const minMargin = 8;
          if (left < minMargin) {
            left = minMargin;
          }
          if (left + tooltipWidth > window.innerWidth - minMargin) {
            left = window.innerWidth - tooltipWidth - minMargin;
          }
          if (top < minMargin) {
            top = buttonRect.bottom + 8;
          }

          tooltipElement.style.left = left + 'px';
          tooltipElement.style.top = top + 'px';
        }
      });
    });

    blockedButton.addEventListener('mouseleave', () => {
      if (tooltipElement && document.body.contains(tooltipElement)) {
        tooltipElement.remove();
        tooltipElement = null;
      }
    });

    return blockedButton;
  }

  /**
   * Get session ID for storage (based on title)
   * @param {Object} sessionData - The session data object
   * @returns {string} Session identifier
   */
  function getSessionStorageId(sessionData) {
    // Use title as the session identifier
    return `bcc-blocked-reason-${sessionData?.title?.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
  }

  // Marker used when session is blocked but no reason is provided
  const BLOCKED_NO_REASON_MARKER = '__BLOCKED__';

  /**
   * Save blocked reason message to storage
   * @param {Object} sessionData - The session data object
   * @param {string} message - The blocked reason message
   */
  function saveBlockedReason(sessionData, message) {
    const storageKey = getSessionStorageId(sessionData);
    // Use marker when message is empty so we can still detect blocked state
    const valueToStore = message || BLOCKED_NO_REASON_MARKER;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const data = {};
      data[storageKey] = valueToStore;
      chrome.storage.sync.set(data);
    } else {
      // Fallback to localStorage
      localStorage.setItem(storageKey, valueToStore);
    }
  }

  /**
   * Get blocked reason message from storage
   * @param {Object} sessionData - The session data object
   * @returns {Promise<string|null>} The blocked reason message or null
   */
  function getBlockedReason(sessionData) {
    return new Promise((resolve) => {
      const storageKey = getSessionStorageId(sessionData);

      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get([storageKey], (result) => {
          if (chrome.runtime.lastError) {
            // Fallback to localStorage
            const localValue = localStorage.getItem(storageKey);
            resolve(localValue);
          } else {
            resolve(result[storageKey] || null);
          }
        });
      } else {
        // Use localStorage
        const localValue = localStorage.getItem(storageKey);
        resolve(localValue);
      }
    });
  }

  /**
   * Create and show tooltip-style inline editor for blocked reason
   * @param {HTMLButtonElement} blockedButton - The blocked button element
   * @param {Object} sessionData - The session data object
   */
  function showBlockedReasonEditor(blockedButton, sessionData) {

    // Remove any existing editor
    const existingEditor = blockedButton.querySelector('.bcc-reason-editor');
    if (existingEditor) {
      existingEditor.remove();
    }

    // Get existing message
    getBlockedReason(sessionData).then((existingMessage) => {
      // Create editor container (positioned above the button)
      const editor = document.createElement('div');
      editor.className = 'bcc-reason-editor';
      editor.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px;
        z-index: 100001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 280px;
      `;

      // Create input field
      const inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.placeholder = '(optional) block reason';
      // Don't show the marker in the input field
      inputEl.value = (existingMessage && existingMessage !== BLOCKED_NO_REASON_MARKER) ? existingMessage : '';
      inputEl.style.cssText = `
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 13px;
        font-family: inherit;
        box-sizing: border-box;
        outline: none;
        color: #1f2937 !important;
        background-color: white !important;
      `;

      // Save function (only on Enter)
      const saveMessage = () => {
        const message = inputEl.value.trim();
        saveBlockedReason(sessionData, message);
        editor.remove();
      };

      // Handle Enter key only for saving
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveMessage();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          editor.remove();
        }
      });

      // Handle focus loss (clicking outside) - just dismiss, don't save
      inputEl.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.body.contains(editor)) {
            editor.remove();
          }
        }, 100);
      });

      editor.appendChild(inputEl);
      document.body.appendChild(editor);

      // Position the editor above the button
      setTimeout(() => {
        const buttonRect = blockedButton.getBoundingClientRect();
        const editorWidth = 280; // Match min-width
        const editorHeight = editor.offsetHeight;

        let left = buttonRect.left + buttonRect.width / 2 - editorWidth / 2;
        let top = buttonRect.top - editorHeight - 12;

        // Clamp to viewport bounds
        const minMargin = 8;
        if (left < minMargin) {
          left = minMargin;
        }
        if (left + editorWidth > window.innerWidth - minMargin) {
          left = window.innerWidth - editorWidth - minMargin;
        }
        if (top < minMargin) {
          top = buttonRect.bottom + 8;
        }

        editor.style.left = left + 'px';
        editor.style.top = top + 'px';
        inputEl.focus();
        inputEl.select();
      }, 0);
    });
  }

  /**
   * Handle click on blocked button
   * @param {Element} sessionEl - The session element
   * @param {HTMLButtonElement} button - The blocked button
   */
  function handleBlockedClick(sessionEl, button) {
    const sessionData = getSessionData(sessionEl);

    // Toggle blocked state visually
    const isBlocked = button.classList.toggle('bcc-blocked-active');

    if (isBlocked) {
      button.style.color = '#ef4444';
      button.title = 'Marked as blocked - click to unblock';
      // Add always-visible blocked indicator next to title
      addBlockedIndicator(sessionEl);
      // Save blocked state immediately (with marker if no reason yet)
      saveBlockedReason(sessionData, '');
      showBlockedFeedback(`Session "${sessionData?.title}" marked as blocked`, true);
      // Show inline editor for optionally entering reason
      showBlockedReasonEditor(button, sessionData);
    } else {
      button.style.color = '';
      button.title = 'Mark as blocked';
      // Remove the blocked indicator
      removeBlockedIndicator(sessionEl);
      // Remove any existing tooltip from the button
      const existingTooltip = button.querySelector('.bcc-blocked-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      // Clear the stored reason
      const storageKey = getSessionStorageId(sessionData);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.remove([storageKey]);
      } else {
        localStorage.removeItem(storageKey);
      }
      showBlockedFeedback(`Session "${sessionData?.title}" unblocked`, false);
    }

    // Emit custom event for external listeners
    window.dispatchEvent(new CustomEvent('bcc:session-blocked', {
      detail: {
        sessionData,
        isBlocked
      }
    }));
  }

  /**
   * Show visual feedback when blocking/unblocking
   * @param {string} message - The message to display
   * @param {boolean} isBlocked - True for blocked (amber), false for unblocked (green)
   */
  function showBlockedFeedback(message, isBlocked = true) {
    const bgColor = isBlocked ? '#ef4444' : '#059669'; // bright amber for blocked, green for unblocked
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 99999;
      animation: fadeInOut 2s ease-in-out;
    `;

    // Add animation keyframes if not already present
    if (!document.querySelector('#refined-claude-animations')) {
      const style = document.createElement('style');
      style.id = 'refined-claude-animations';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(feedback);
    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }

  /**
   * Add an always-visible blocked indicator to a session row
   * @param {Element} sessionEl - The session element
   */
  function addBlockedIndicator(sessionEl) {
    if (!sessionEl) return;

    // Check if indicator already exists
    if (sessionEl.querySelector('.bcc-blocked-indicator')) {
      return;
    }

    // Find the container for the indicator using the robust finder
    const indicatorContainer = findIndicatorContainer(sessionEl);
    if (!indicatorContainer) {
      return;
    }

    const sessionData = getSessionData(sessionEl);

    // Create the indicator (same size as button: h-6 w-6 = 24x24, with 14x14 icon inside)
    const indicator = document.createElement('span');
    indicator.className = 'bcc-blocked-indicator inline-flex items-center justify-center h-6 w-6';
    indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"></path></svg>`;
    indicator.title = 'Session is blocked - hover to see reason';

    // Hide indicator on hover (when buttons become visible)
    const groupEl = sessionEl.querySelector('.group');

    // Check if currently hovering (indicator should be hidden if so)
    const isCurrentlyHovering = groupEl && groupEl.matches(':hover');
    indicator.style.cssText = `color: #ef4444; display: ${isCurrentlyHovering ? 'none' : 'inline-flex'}; position: relative;`;

    if (groupEl) {
      groupEl.addEventListener('mouseenter', () => {
        indicator.style.display = 'none';
      });
      groupEl.addEventListener('mouseleave', () => {
        indicator.style.display = 'inline-flex';
      });
    }

    // Append to indicator container
    indicatorContainer.appendChild(indicator);
  }

  /**
   * Remove the blocked indicator from a session row
   * @param {Element} sessionEl - The session element
   */
  function removeBlockedIndicator(sessionEl) {
    if (!sessionEl) return;

    const indicator = sessionEl.querySelector('.bcc-blocked-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Add blocked buttons to all visible sessions
   */
  function addBlockedButtonsToAllSessions() {
    const sessions = getAllSessions();

    sessions.forEach((sessionEl) => {
      addBlockedButtonToSession(sessionEl);
    });
  }

  /**
   * Restore blocked indicators for all sessions that were previously marked as blocked
   * This runs independently of button placement to ensure indicators always appear
   */
  function restoreBlockedIndicators() {
    const sessions = getAllSessions();

    sessions.forEach((sessionEl) => {
      // Skip if indicator already exists
      if (sessionEl.querySelector('.bcc-blocked-indicator')) {
        return;
      }

      const sessionData = getSessionData(sessionEl);
      if (!sessionData) return;

      getBlockedReason(sessionData).then((reason) => {
        if (reason !== null) {
          addBlockedIndicator(sessionEl);

          // Also update the blocked button if it exists
          const blockedBtn = findBlockedButton(sessionEl);
          if (blockedBtn && !blockedBtn.classList.contains('bcc-blocked-active')) {
            blockedBtn.classList.add('bcc-blocked-active');
            blockedBtn.style.color = '#ef4444';
            blockedBtn.title = 'Marked as blocked - click to unblock';
          }
        }
      });
    });
  }

  /**
   * Set up observer to add blocked buttons when new sessions appear
   */
  function setupBlockedButtonObserver() {
    // Find the sessions container - try multiple selectors
    let sessionsContainer = document.querySelector('.flex.flex-col.gap-0\\.5.px-1');

    // Try alternative selectors if the first one fails
    if (!sessionsContainer) {
      sessionsContainer = document.querySelector('[data-index="0"]')?.closest('.flex.flex-col');
    }

    if (!sessionsContainer) {
      // Just find any container with data-index elements
      const firstSession = document.querySelector('[data-index]');
      if (firstSession) {
        sessionsContainer = firstSession.parentElement;
      }
    }

    if (!sessionsContainer) {
      setTimeout(setupBlockedButtonObserver, 1000);
      return;
    }

    // Add buttons and restore indicators for existing sessions
    addBlockedButtonsToAllSessions();
    // Run indicator restoration separately to ensure blocked sessions show indicator
    setTimeout(restoreBlockedIndicators, 500);

    // Watch for new sessions
    const observer = new MutationObserver((mutations) => {
      // Debounce to avoid excessive processing
      clearTimeout(observer._timeout);
      observer._timeout = setTimeout(() => {
        addBlockedButtonsToAllSessions();
        // Also restore indicators for any newly appearing sessions
        restoreBlockedIndicators();
      }, 100);
    });

    observer.observe(sessionsContainer, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // Initialize blocked button feature after a delay to ensure page is loaded
  setTimeout(() => {
    setupBlockedButtonObserver();
  }, 2000);

  // Expose session utilities for debugging and external use
  window.RefinedClaudeCode = window.RefinedClaudeCode || {};
  window.RefinedClaudeCode.sessions = {
    getAll: getAllSessions,
    getAllWithData: getAllSessionsWithData,
    findByTitle: findSessionByTitle,
    getData: getSessionData,
    getActive: getActiveSession,
    getRunning: getRunningSessions,
    findDeleteButton,
    findArchiveButton,
    findBlockedButton,
    findButtonsContainer,
    findIndicatorContainer,
    getButtons: getSessionButtons,
    triggerHover: triggerSessionHover,
    clearHover: clearSessionHover,
    addBlockedButton: addBlockedButtonToSession,
    addBlockedButtonsToAll: addBlockedButtonsToAllSessions,
    restoreBlockedIndicators
  };

  // ============================================
  // Project Colors Feature
  // ============================================

  function applyProjectColors() {
    if (!isFeatureEnabled('projectColors')) {
      // Remove any applied colors
      document.querySelectorAll('[data-bcc-colored]').forEach(el => {
        el.style.removeProperty('color');
        el.style.removeProperty('font-weight');
        el.removeAttribute('data-bcc-colored');
      });
      return;
    }

    const projectColorMap = currentSettings.projectColorMap || {};
    if (Object.keys(projectColorMap).length === 0) return;

    // Find project name elements in the sidebar
    // Look for span.truncate elements that contain project names
    const truncateSpans = document.querySelectorAll('span.truncate');

    truncateSpans.forEach(span => {
      const projectName = span.textContent.trim();

      // Check if this project has a configured color
      // Support both exact match and partial match
      let matchedColor = null;

      // First try exact match
      if (projectColorMap[projectName]) {
        matchedColor = projectColorMap[projectName];
      } else {
        // Try partial match (project name contains or is contained by config)
        for (const [configName, color] of Object.entries(projectColorMap)) {
          if (projectName.includes(configName) || configName.includes(projectName)) {
            matchedColor = color;
            break;
          }
        }
      }

      if (matchedColor) {
        span.style.color = matchedColor;
        span.style.fontWeight = '600';
        span.setAttribute('data-bcc-colored', 'true');
      } else if (span.hasAttribute('data-bcc-colored')) {
        // Remove color if previously applied but no longer matches
        span.style.removeProperty('color');
        span.style.removeProperty('font-weight');
        span.removeAttribute('data-bcc-colored');
      }
    });
  }

  // Debounced version to avoid excessive calls
  let projectColorDebounceTimer = null;
  function debouncedApplyProjectColors() {
    if (projectColorDebounceTimer) clearTimeout(projectColorDebounceTimer);
    projectColorDebounceTimer = setTimeout(() => {
      applyProjectColors();
    }, 100);
  }

  // ============================================
  // Initialization
  // ============================================

  let debounceTimer = null;
  function debouncedAddRefinedLabel() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      addRefinedLabel();
    }, 100);
  }

  async function init() {
    try {
      // Load settings first
      await loadSettings();
    } catch (e) {
      // Use defaults
    }

    // Initialize mode based on settings
    currentMode = getInitialMode();

    // Function to inject UI elements
    function injectUI() {
      try {
        if (isFeatureEnabled('modeButton')) {
          setTimeout(findAndInjectModeButton, 1000);
        }
        addRefinedLabel(); // Always add the label (it's the toggle)
        // Apply project colors
        applyProjectColors();
      } catch (e) {
        console.error(LOG_PREFIX, 'Error injecting UI:', e);
      }
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        injectUI();
      });
    } else {
      injectUI();
    }

    // Watch for copy branch button clicks (only if enabled)
    if (isFeatureEnabled('pullBranch')) {
      watchForCopyBranchButton();
    }

    // Watch for merge branch button (only if enabled)
    if (isFeatureEnabled('mergeBranch')) {
      watchForMergeBranchButton();
    }

    // Watch for DOM changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      // Re-inject mode button if missing and enabled
      if (isFeatureEnabled('modeButton') && !document.querySelector('.bcc-mode-container')) {
        findAndInjectModeButton();
      }
      // Re-add refined label if missing (always, since it's the toggle control)
      debouncedAddRefinedLabel();

      // Re-apply project colors on DOM changes
      debouncedApplyProjectColors();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Watch for URL changes (SPA navigation to new sessions)
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        const oldUrl = lastUrl;
        lastUrl = window.location.href;

        // Check if navigating to a new/different session
        const oldSessionMatch = oldUrl.match(/\/code\/session_([^/]+)/);
        const newSessionMatch = lastUrl.match(/\/code\/session_([^/]+)/);

        // Reset mode if: going to a different session, or going to /code (new session)
        if (lastUrl.includes('/code')) {
          const oldSessionId = oldSessionMatch ? oldSessionMatch[1] : null;
          const newSessionId = newSessionMatch ? newSessionMatch[1] : null;

          if (oldSessionId !== newSessionId) {
            resetModeToDefault();
          }
        }
      }
    });
    urlObserver.observe(document.body, { childList: true, subtree: true });
  }

  init().catch(e => {
    console.error(LOG_PREFIX, 'Init failed:', e);
    // Fallback: try to add the refined label anyway
    setTimeout(() => addRefinedLabel(), 1000);
  });
})();
