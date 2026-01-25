// Better Claude Code on the Web - Content Script
// Features: Mode Button, Show Actual Model, Better Label, Pull Branch in CLI

(function() {
  'use strict';

  const LOG_PREFIX = '[BCC]';

  // ============================================
  // Settings Management
  // ============================================

  const DEFAULT_SETTINGS = {
    allEnabled: true,
    modeButton: true,
    showModel: true,
    betterLabel: true,
    pullBranch: true,
    sessionDot: true
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

    // Update Better label appearance
    updateBetterLabelState();

    // Toggle mode button
    const modeContainer = document.querySelector('.bcc-mode-container');
    if (modeContainer) {
      modeContainer.style.display = isFeatureEnabled('modeButton') ? 'inline-flex' : 'none';
    }

    // Toggle pull branch button
    const pullBranchBtn = document.querySelector('.better-pull-branch-btn');
    if (pullBranchBtn) {
      pullBranchBtn.style.display = isFeatureEnabled('pullBranch') ? 'flex' : 'none';
    }

    // Handle model display - revert or update
    if (isFeatureEnabled('showModel')) {
      updateModelSelector();
    } else {
      // Revert model button to default
      const button = document.querySelector('button[aria-label="More options"]');
      if (button && button.querySelector('span[style*="font-weight: 500"]')) {
        button.innerHTML = '...';
        button.style.minWidth = '';
        button.style.paddingLeft = '';
        button.style.paddingRight = '';
      }
    }
  }

  // Update Better label appearance based on settings
  function updateBetterLabelState() {
    const betterLabel = document.querySelector('.better-label');
    if (!betterLabel) return;

    const allEnabled = currentSettings.allEnabled;

    if (allEnabled) {
      betterLabel.classList.remove('better-label-disabled');
      betterLabel.style.cssText = `
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
      betterLabel.classList.add('better-label-disabled');
      betterLabel.style.cssText = `
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
  let currentMode = 'Agent';

  function createModeButton() {
    const container = document.createElement('div');
    container.className = 'bcc-mode-container';
    container.style.cssText = 'position: relative !important; display: inline-flex !important; flex-direction: row !important; align-items: center !important; margin-right: 8px !important; z-index: 1000 !important;';

    modeButton = document.createElement('button');
    modeButton.className = 'bcc-mode-button';
    modeButton.type = 'button';
    modeButton.style.cssText = 'display: inline-flex !important; flex-direction: row !important; align-items: center !important; gap: 6px !important; padding: 6px 10px !important; background: transparent !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; cursor: pointer !important; font-size: 13px !important; white-space: nowrap !important;';
    modeButton.innerHTML = `
      <span class="bcc-mode-label" style="display: inline !important; font-weight: 500 !important;">${currentMode}</span>
      <svg class="bcc-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block !important; opacity: 0.6 !important;">
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    `;
    modeButton.addEventListener('click', toggleDropdown);

    dropdown = document.createElement('div');
    dropdown.className = 'bcc-mode-dropdown';
    dropdown.style.cssText = 'position: absolute !important; bottom: calc(100% + 4px) !important; left: 0 !important; min-width: 120px !important; background: #ffffff !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important; opacity: 0 !important; visibility: hidden !important; transform: translateY(4px) !important; transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s !important; overflow: hidden !important;';
    dropdown.innerHTML = `
      <div class="bcc-mode-option" data-mode="Agent" style="display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; padding: 10px 12px !important; cursor: pointer !important; font-size: 13px !important;">
        <span class="bcc-check" style="display: inline-block !important; width: 16px !important; color: #10a37f !important; font-weight: bold !important;">&#10003;</span>
        <span>Agent</span>
      </div>
      <div class="bcc-mode-option" data-mode="Plan" style="display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; padding: 10px 12px !important; cursor: pointer !important; font-size: 13px !important;">
        <span class="bcc-check" style="display: inline-block !important; width: 16px !important; color: #10a37f !important; font-weight: bold !important;"></span>
        <span>Plan</span>
      </div>
    `;

    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectMode(option.dataset.mode);
      });
    });

    container.appendChild(modeButton);
    container.appendChild(dropdown);
    return container;
  }

  function toggleDropdown(e) {
    e.stopPropagation();
    e.preventDefault();
    const isVisible = dropdown.style.visibility === 'visible';
    if (isVisible) {
      closeDropdown();
    } else {
      dropdown.style.opacity = '1';
      dropdown.style.visibility = 'visible';
      dropdown.style.transform = 'translateY(0)';
      setTimeout(() => {
        document.addEventListener('click', closeDropdown, { once: true });
      }, 0);
    }
  }

  function closeDropdown() {
    dropdown.style.opacity = '0';
    dropdown.style.visibility = 'hidden';
    dropdown.style.transform = 'translateY(4px)';
  }

  function selectMode(mode) {
    currentMode = mode;
    modeButton.querySelector('.bcc-mode-label').textContent = mode;

    // Update checkmarks
    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      const check = option.querySelector('.bcc-check');
      check.textContent = option.dataset.mode === mode ? '✓' : '';
    });

    closeDropdown();

    if (mode === 'Plan') {
      addPlanPrefix();
    } else if (mode === 'Agent') {
      removePlanPrefix();
    }
  }

  function addPlanPrefix() {
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');
    if (textField) {
      const prefix = 'use @agent-plan : ';
      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        if (!textField.value.startsWith(prefix)) {
          textField.value = prefix + textField.value;
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        const currentText = textField.innerText || textField.textContent || '';
        if (!currentText.startsWith(prefix)) {
          textField.focus();
          textField.innerText = prefix + currentText;
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(textField);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  }

  function removePlanPrefix() {
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');
    if (textField) {
      const prefix = 'use @agent-plan : ';
      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        if (textField.value.startsWith(prefix)) {
          textField.value = textField.value.slice(prefix.length);
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        const currentText = textField.innerText || textField.textContent || '';
        if (currentText.startsWith(prefix)) {
          textField.focus();
          textField.innerText = currentText.slice(prefix.length);
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(textField);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  }

  function findAndInjectModeButton() {
    if (document.querySelector('.bcc-mode-container')) return;

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

    if (insertionPoint) {
      const modeContainer = createModeButton();
      insertionPoint.insertBefore(modeContainer, insertionPoint.firstChild);
    } else {
      const form = document.querySelector('form') || document.querySelector('[contenteditable="true"]')?.closest('div');
      if (form && !document.querySelector('.bcc-mode-container')) {
        const modeContainer = createModeButton();
        modeContainer.classList.add('bcc-floating');
        form.style.position = 'relative';
        form.insertBefore(modeContainer, form.firstChild);
      }
    }
  }

  // ============================================
  // Show Actual Model Feature
  // ============================================

  const MODEL_NAMES = {
    'opus': 'Opus 4.5',
    'sonnet': 'Sonnet 4.5',
    'haiku': 'Haiku 4.5'
  };

  let lastKnownModel = null;
  let modelButtonObserver = null;

  function parseModelId(modelId) {
    if (!modelId) return null;
    const modelIdLower = modelId.toLowerCase();
    for (const [key, name] of Object.entries(MODEL_NAMES)) {
      if (modelIdLower.includes(key)) {
        return name;
      }
    }
    return null;
  }

  function findModelSelectorButton() {
    const moreOptionsButton = document.querySelector('button[aria-label="More options"]');
    if (moreOptionsButton) {
      return moreOptionsButton;
    }

    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const text = button.textContent.trim();
      const ariaLabel = button.getAttribute('aria-label');

      if (ariaLabel && (ariaLabel.toLowerCase().includes('model') || ariaLabel.toLowerCase().includes('options'))) {
        return button;
      }

      if (text === '...' || text === '\u2026' || text === '\u22EF') {
        return button;
      }
    }

    return null;
  }

  function getSelectedModel() {
    try {
      const stickyModel = localStorage.getItem('ccr-sticky-model-selector');
      if (stickyModel) {
        const parsed = parseModelId(stickyModel);
        if (parsed) return parsed;
      }
    } catch (e) {}

    try {
      const defaultModel = localStorage.getItem('default-model');
      if (defaultModel) {
        const parsed = parseModelId(defaultModel);
        if (parsed) return parsed;
      }
    } catch (e) {}

    const checkedItem = document.querySelector('[role="menuitemradio"][aria-checked="true"]');
    if (checkedItem) {
      const modelText = checkedItem.textContent;
      for (const [key, name] of Object.entries(MODEL_NAMES)) {
        if (modelText.toLowerCase().includes(key)) {
          return name;
        }
      }
    }

    return null;
  }

  function updateModelDisplay(button, modelName) {
    if (!button || !modelName) return;
    const currentText = button.textContent.trim();
    if (currentText === modelName) return;
    button.innerHTML = `<span style="font-size: 12px; font-weight: 500;">${modelName}</span>`;
    button.style.minWidth = 'auto';
    button.style.paddingLeft = '8px';
    button.style.paddingRight = '8px';

    watchModelButtonForChanges(button, modelName);
  }

  function watchModelButtonForChanges(button, modelName) {
    if (modelButtonObserver) {
      modelButtonObserver.disconnect();
    }

    modelButtonObserver = new MutationObserver((mutations) => {
      const currentText = button.textContent.trim();
      if (currentText !== modelName && currentText !== lastKnownModel) {
        const currentModel = parseModelId(localStorage.getItem('default-model'));
        if (currentModel) {
          button.innerHTML = `<span style="font-size: 12px; font-weight: 500;">${currentModel}</span>`;
          button.style.minWidth = 'auto';
          button.style.paddingLeft = '8px';
          button.style.paddingRight = '8px';
        }
      }
    });

    modelButtonObserver.observe(button, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function updateModelSelector() {
    const button = findModelSelectorButton();
    const model = getSelectedModel();

    if (button && model) {
      updateModelDisplay(button, model);
    }
  }

  function watchLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      originalSetItem(key, value);
      if (key === 'ccr-sticky-model-selector' || key === 'default-model') {
        const newModel = parseModelId(value);
        if (newModel && newModel !== lastKnownModel) {
          lastKnownModel = newModel;
          setTimeout(updateModelSelector, 100);
          setTimeout(updateModelSelector, 300);
        }
      }
    };
  }

  function pollForModelChanges() {
    setInterval(() => {
      try {
        const stickyModel = localStorage.getItem('ccr-sticky-model-selector');
        const defaultModel = localStorage.getItem('default-model');
        const currentModelId = stickyModel || defaultModel;
        const parsedModel = parseModelId(currentModelId);

        if (parsedModel) {
          if (parsedModel !== lastKnownModel) {
            lastKnownModel = parsedModel;
            updateModelSelector();
          } else {
            const button = document.querySelector('button[aria-label="More options"]');
            if (button && button.textContent.trim() !== parsedModel) {
              updateModelDisplay(button, parsedModel);
            }
          }
        }
      } catch (e) {}
    }, 250);
  }

  // ============================================
  // Better Label Feature
  // ============================================

  function addBetterLabel() {
    if (!isFeatureEnabled('betterLabel') && !currentSettings.allEnabled === false) {
      const existingLabel = document.querySelector('.better-label');
      if (existingLabel && currentSettings.allEnabled && !currentSettings.betterLabel) {
        existingLabel.style.display = 'none';
        return true;
      }
    }

    const claudeCodeLink = document.querySelector('a[href="/code"]');
    if (!claudeCodeLink) return false;

    const parent = claudeCodeLink.parentElement;
    if (parent?.querySelector('.better-label')) {
      updateBetterLabelState();
      return true;
    }
    if (claudeCodeLink.nextElementSibling?.classList?.contains('better-label')) {
      updateBetterLabelState();
      return true;
    }

    const betterLabel = document.createElement('span');
    betterLabel.textContent = 'Better';
    betterLabel.className = 'better-label';
    betterLabel.title = 'Click to toggle all extension features';

    // Apply initial style based on current settings
    const allEnabled = currentSettings.allEnabled;
    if (allEnabled) {
      betterLabel.style.cssText = `
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
      betterLabel.classList.add('better-label-disabled');
      betterLabel.style.cssText = `
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

    betterLabel.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newAllEnabled = !currentSettings.allEnabled;
      await saveSettings({ allEnabled: newAllEnabled });
      showToggleFeedback(newAllEnabled ? 'Features enabled - Reloading...' : 'Features disabled - Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });

    betterLabel.addEventListener('mouseenter', () => {
      betterLabel.style.opacity = '0.8';
    });
    betterLabel.addEventListener('mouseleave', () => {
      betterLabel.style.opacity = '1';
    });

    claudeCodeLink.parentNode.insertBefore(betterLabel, claudeCodeLink.nextSibling);
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
    if (!document.querySelector('#better-claude-animations')) {
      const style = document.createElement('style');
      style.id = 'better-claude-animations';
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

  function watchForCopyBranchButton() {
    let currentBranchName = null;

    function extractBranchName() {
      const candidates = document.querySelectorAll('span, div, p, a');
      for (const el of candidates) {
        const text = el.textContent || '';
        if (text.length > 100) continue;
        const branchMatch = text.match(/\b(claude\/[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9])\b/);
        if (branchMatch) {
          const branch = branchMatch[1];
          if (branch.includes('-') && branch.length > 10 && branch.length < 80) {
            return branch;
          }
        }
      }
      const pageText = document.body.textContent || '';
      const matches = pageText.match(/claude\/[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9](?=\s|$|Context|Rename|Archive|Delete)/g);
      if (matches && matches.length > 0) {
        for (const match of matches) {
          if (match.includes('-') && match.length > 10) {
            return match;
          }
        }
      }
      return null;
    }

    function addPullBranchButton() {
      if (document.querySelector('.better-pull-branch-btn')) return;

      const allButtons = document.querySelectorAll('button');
      let createPRButton = null;
      for (const btn of allButtons) {
        const text = btn.textContent.trim();
        if (text.includes('Create PR') || text.includes('Create pull request')) {
          createPRButton = btn;
          break;
        }
      }
      if (!createPRButton) return;

      currentBranchName = extractBranchName();
      if (!currentBranchName) return;

      // Create the Pull Branch in CLI button with exact same structure as Open in CLI
      const pullBranchBtn = document.createElement('button');
      pullBranchBtn.type = 'button';
      pullBranchBtn.className = 'group flex items-center gap-[6px] px-[10px] py-2 bg-bg-000 border-0.5 border-border-300 rounded-[6px] shadow-sm hover:bg-bg-100 transition-colors better-pull-branch-btn';
      pullBranchBtn.title = `Copy: git fetch && git co ${currentBranchName} && git pull`;
      pullBranchBtn.style.marginRight = '8px';

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
        const branchName = extractBranchName() || currentBranchName;
        const gitCommand = `git fetch && git co ${branchName} && git pull`;
        try {
          await navigator.clipboard.writeText(gitCommand);
          showCopyFeedback('Command copied to clipboard');
        } catch (err) {
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
          } catch (fallbackErr) {}
        }
      });

      createPRButton.parentNode.insertBefore(pullBranchBtn, createPRButton);
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
      if (!document.querySelector('#better-claude-animations')) {
        const style = document.createElement('style');
        style.id = 'better-claude-animations';
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

    const observer = new MutationObserver(() => addPullBranchButton());
    observer.observe(document.body, { childList: true, subtree: true });
    addPullBranchButton();
    setTimeout(addPullBranchButton, 500);
    setTimeout(addPullBranchButton, 1000);
    setTimeout(addPullBranchButton, 2000);
    return observer;
  }

  // ============================================
  // Session Dot Feature
  // ============================================

  const RUNNING_SESSIONS_KEY = 'bcc-running-sessions';
  const VIEWED_SESSIONS_KEY = 'bcc-viewed-sessions';

  function getStoredSessions(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredSessions(key, sessions) {
    try {
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch (e) {}
  }

  function markSessionAsRunning(sessionId) {
    const running = getStoredSessions(RUNNING_SESSIONS_KEY);
    if (!running.includes(sessionId)) {
      running.push(sessionId);
      saveStoredSessions(RUNNING_SESSIONS_KEY, running);
    }
  }

  function markSessionAsViewed(sessionId) {
    const viewed = getStoredSessions(VIEWED_SESSIONS_KEY);
    if (!viewed.includes(sessionId)) {
      viewed.push(sessionId);
      saveStoredSessions(VIEWED_SESSIONS_KEY, viewed);
    }
    const running = getStoredSessions(RUNNING_SESSIONS_KEY);
    const idx = running.indexOf(sessionId);
    if (idx > -1) {
      running.splice(idx, 1);
      saveStoredSessions(RUNNING_SESSIONS_KEY, running);
    }
  }

  function wasSessionRunning(sessionId) {
    const result = getStoredSessions(RUNNING_SESSIONS_KEY).includes(sessionId);
    return result;
  }

  function isSessionViewed(sessionId) {
    return getStoredSessions(VIEWED_SESSIONS_KEY).includes(sessionId);
  }

  function getSessionIdFromElement(element) {
    const link = element.querySelector('a[href*="/code/"]') || element.closest('a[href*="/code/"]');
    if (link) {
      const href = link.getAttribute('href');
      const match = href.match(/\/code\/([^/?]+)/);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  function createGreenDot() {
    const dot = document.createElement('span');
    dot.className = 'bcc-session-dot';
    dot.style.cssText = `
      display: inline-block !important;
      width: 8px !important;
      height: 8px !important;
      background-color: #22c55e !important;
      border-radius: 50% !important;
      flex-shrink: 0 !important;
    `;
    return dot;
  }

  function watchSessionDots() {
    console.log(LOG_PREFIX, '🟢 SESSION DOT: Initializing...');

    function getCurrentSessionId() {
      const match = window.location.pathname.match(/\/code\/([^/?]+)/);
      return match ? match[1] : null;
    }

    const currentSessionId = getCurrentSessionId();
    console.log(LOG_PREFIX, '🟢 SESSION DOT: Current session ID from URL:', currentSessionId);
    if (currentSessionId) {
      markSessionAsViewed(currentSessionId);
    }

    function processSessionItem(sessionItem) {
      const sessionId = getSessionIdFromElement(sessionItem);
      if (!sessionId) {
        console.log(LOG_PREFIX, '🟢 SESSION DOT: Could not extract sessionId from element');
        return;
      }

      console.log(LOG_PREFIX, '🟢 SESSION DOT: Processing session:', sessionId);

      const spinnerContainer = sessionItem.querySelector('.code-spinner-animate');
      const hasSpinner = !!spinnerContainer;
      const existingDot = sessionItem.querySelector('.bcc-session-dot');

      console.log(LOG_PREFIX, '🟢 SESSION DOT: hasSpinner:', hasSpinner, 'existingDot:', !!existingDot);

      if (hasSpinner) {
        markSessionAsRunning(sessionId);
        if (existingDot) {
          existingDot.remove();
        }
      } else {
        const wasRunning = wasSessionRunning(sessionId);
        const isViewed = isSessionViewed(sessionId);

        console.log(LOG_PREFIX, '🟢 SESSION DOT: wasRunning:', wasRunning, 'isViewed:', isViewed);

        if (wasRunning && !isViewed && !existingDot) {
          console.log(LOG_PREFIX, '🟢 SESSION DOT: Conditions met, looking for icon container');
          // Try multiple selectors for the icon container
          let iconContainer = sessionItem.querySelector('.w-6.h-6.flex.items-center.justify-center');
          console.log(LOG_PREFIX, '🟢 SESSION DOT: Tried .w-6.h-6.flex - found:', !!iconContainer);

          if (!iconContainer) {
            iconContainer = sessionItem.querySelector('.relative.flex.items-center');
            console.log(LOG_PREFIX, '🟢 SESSION DOT: Tried .relative.flex.items-center - found:', !!iconContainer);
          }

          if (!iconContainer) {
            const allDivs = sessionItem.querySelectorAll('div');
            iconContainer = allDivs[0];
            console.log(LOG_PREFIX, '🟢 SESSION DOT: Tried fallback div[0] - found:', !!iconContainer);
          }

          if (iconContainer) {
            const dot = createGreenDot();
            iconContainer.innerHTML = '';
            iconContainer.appendChild(dot);
            console.log(LOG_PREFIX, '✅ GREEN DOT ADDED for session:', sessionId);
          } else {
            console.log(LOG_PREFIX, '❌ Could not find icon container for session:', sessionId);
          }
        } else {
          console.log(LOG_PREFIX, '🟢 SESSION DOT: Skipped - wasRunning:', wasRunning, 'isViewed:', isViewed, 'existingDot:', !!existingDot);
        }
      }
    }

    function processAllSessions() {
      const allSessionLinks = document.querySelectorAll('a[href*="/code/"]');
      console.log(LOG_PREFIX, '🟢 SESSION DOT: Found', allSessionLinks.length, 'session links');
      const processedItems = new Set();

      allSessionLinks.forEach((link) => {
        let sessionItem = link.closest('[class*="group"]');
        if (!sessionItem) {
          sessionItem = link.closest('.relative') || link.parentElement?.parentElement?.parentElement;
        }

        if (sessionItem && !processedItems.has(sessionItem)) {
          processedItems.add(sessionItem);
          processSessionItem(sessionItem);
        } else if (!sessionItem) {
          console.log(LOG_PREFIX, '🟢 SESSION DOT: Could not find sessionItem container for link:', link.href);
        }
      });
    }

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href*="/code/"]');
      if (link) {
        const href = link.getAttribute('href');
        const match = href.match(/\/code\/([^/?]+)/);
        if (match) {
          const sessionId = match[1];
          markSessionAsViewed(sessionId);
          const sessionItem = link.closest('[class*="group"]') || link.parentElement?.parentElement;
          if (sessionItem) {
            const dot = sessionItem.querySelector('.bcc-session-dot');
            if (dot) {
              dot.remove();
            }
          }
        }
      }
    }, true);

    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        const newSessionId = getCurrentSessionId();
        if (newSessionId) {
          markSessionAsViewed(newSessionId);
        }
        setTimeout(processAllSessions, 100);
      }
    });

    urlObserver.observe(document.body, { childList: true, subtree: true });

    const sessionObserver = new MutationObserver((mutations) => {
      clearTimeout(sessionObserver._debounceTimer);
      sessionObserver._debounceTimer = setTimeout(() => {
        processAllSessions();
      }, 100);
    });

    sessionObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    processAllSessions();
    setTimeout(processAllSessions, 500);
    setTimeout(processAllSessions, 1000);
    setTimeout(processAllSessions, 3000);

    return { sessionObserver, urlObserver };
  }

  // ============================================
  // Initialization
  // ============================================

  let debounceTimer = null;
  function debouncedAddBetterLabel() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      addBetterLabel();
    }, 100);
  }

  async function init() {
    try {
      await loadSettings();
    } catch (e) {}

    if (isFeatureEnabled('showModel')) {
      watchLocalStorage();
      pollForModelChanges();
      lastKnownModel = getSelectedModel();
    }

    function injectUI() {
      try {
        if (isFeatureEnabled('modeButton')) {
          setTimeout(findAndInjectModeButton, 1000);
        }
        addBetterLabel();
        if (isFeatureEnabled('showModel')) {
          updateModelSelector();
        }
      } catch (e) {}
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => injectUI());
    } else {
      injectUI();
    }

    if (isFeatureEnabled('pullBranch')) {
      watchForCopyBranchButton();
    }

    if (isFeatureEnabled('sessionDot')) {
      watchSessionDots();
    }

    const observer = new MutationObserver(() => {
      if (isFeatureEnabled('modeButton') && !document.querySelector('.bcc-mode-container')) {
        findAndInjectModeButton();
      }
      debouncedAddBetterLabel();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  init().catch(() => {
    setTimeout(() => addBetterLabel(), 1000);
  });
})();
