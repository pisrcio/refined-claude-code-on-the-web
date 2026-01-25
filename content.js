// Better Claude Code on the Web - Content Script
// Features: Mode Button, Show Actual Model, Better Label, Pull Branch in CLI

(function() {
  'use strict';

  const LOG_PREFIX = '[BCC]';

  console.log(LOG_PREFIX, 'Script loaded');
  console.log(LOG_PREFIX, 'URL:', window.location.href);
  console.log(LOG_PREFIX, 'Document readyState:', document.readyState);

  // ============================================
  // Settings Management
  // ============================================

  const DEFAULT_SETTINGS = {
    allEnabled: true,
    modeButton: true,
    showModel: true,
    betterLabel: true,
    pullBranch: true,
    projectColors: true,
    projectColorMap: {} // { "project-name": "#hexcolor" }
  };

  let currentSettings = { ...DEFAULT_SETTINGS };

  // Load settings from storage
  function loadSettings() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
            if (chrome.runtime.lastError) {
              console.log(LOG_PREFIX, 'Storage error, using defaults:', chrome.runtime.lastError);
              resolve(currentSettings);
            } else {
              currentSettings = result;
              console.log(LOG_PREFIX, 'Settings loaded:', currentSettings);
              resolve(currentSettings);
            }
          });
        } else {
          console.log(LOG_PREFIX, 'Chrome storage not available, using defaults');
          resolve(currentSettings);
        }
      } catch (e) {
        console.log(LOG_PREFIX, 'Error loading settings, using defaults:', e);
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
          console.log(LOG_PREFIX, 'Settings saved:', settings);
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
        console.log(LOG_PREFIX, 'Settings changed:', changes);
        for (const [key, { newValue }] of Object.entries(changes)) {
          currentSettings[key] = newValue;
        }
        applySettings();
      }
    });
  }

  // Apply current settings to the page
  function applySettings() {
    console.log(LOG_PREFIX, 'Applying settings:', currentSettings);

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

    // Apply project colors
    applyProjectColors();
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
    console.log(LOG_PREFIX, 'createModeButton() called');

    // Create container
    const container = document.createElement('div');
    container.className = 'bcc-mode-container';
    // Apply inline styles to override page CSS
    container.style.cssText = 'position: relative !important; display: inline-flex !important; flex-direction: row !important; align-items: center !important; margin-right: 8px !important; z-index: 1000 !important;';
    console.log(LOG_PREFIX, 'Created container:', container);

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
    console.log(LOG_PREFIX, 'Created modeButton:', modeButton);
    console.log(LOG_PREFIX, 'Attaching click event listener to modeButton...');
    modeButton.addEventListener('click', (e) => {
      console.log(LOG_PREFIX, '*** CLICK EVENT FIRED ON MODE BUTTON ***');
      toggleDropdown(e);
    });
    console.log(LOG_PREFIX, 'Click event listener attached successfully');

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
      console.log(LOG_PREFIX, 'Injected dropdown stylesheet');
    }

    dropdown.classList.add('bcc-dropdown-hidden');
    dropdown.innerHTML = `
      <div class="bcc-mode-option" data-mode="Agent">
        <span class="bcc-check">&#10003;</span>
        <span>Agent</span>
      </div>
      <div class="bcc-mode-option" data-mode="Plan">
        <span class="bcc-check"></span>
        <span>Plan</span>
      </div>
    `;
    console.log(LOG_PREFIX, 'Created dropdown:', dropdown);

    // Add hover effect for dropdown options
    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      option.addEventListener('mouseenter', () => {
        option.style.backgroundColor = '#f3f4f6';
      });
      option.addEventListener('mouseleave', () => {
        option.style.backgroundColor = '#ffffff';
      });
      option.addEventListener('click', (e) => {
        console.log(LOG_PREFIX, 'Option clicked:', option.dataset.mode);
        e.preventDefault();
        e.stopPropagation();
        selectMode(option.dataset.mode);
      });
    });

    container.appendChild(modeButton);
    // Append dropdown to body to avoid overflow issues
    document.body.appendChild(dropdown);

    console.log(LOG_PREFIX, 'Final container:', container);

    // Log computed styles after a tick
    setTimeout(() => {
      const containerStyle = window.getComputedStyle(container);
      const buttonStyle = window.getComputedStyle(modeButton);
      console.log(LOG_PREFIX, 'Container computed style - display:', containerStyle.display, 'flexDirection:', containerStyle.flexDirection);
      console.log(LOG_PREFIX, 'Button computed style - display:', buttonStyle.display, 'flexDirection:', buttonStyle.flexDirection);
    }, 100);

    return container;
  }

  function toggleDropdown(e) {
    console.log(LOG_PREFIX, '=== toggleDropdown() START ===');
    console.log(LOG_PREFIX, 'Event:', e);
    console.log(LOG_PREFIX, 'Event type:', e.type);
    console.log(LOG_PREFIX, 'Event target:', e.target);
    console.log(LOG_PREFIX, 'modeButton reference:', modeButton);
    console.log(LOG_PREFIX, 'dropdown reference:', dropdown);
    console.log(LOG_PREFIX, 'dropdown in DOM?:', document.body.contains(dropdown));
    console.log(LOG_PREFIX, 'modeButton in DOM?:', document.body.contains(modeButton));

    e.stopPropagation();
    e.preventDefault();

    if (!dropdown) {
      console.error(LOG_PREFIX, 'ERROR: dropdown is null or undefined!');
      return;
    }

    // Check visibility using class instead of inline style
    const isVisible = dropdown.classList.contains('bcc-dropdown-visible');
    console.log(LOG_PREFIX, 'Has bcc-dropdown-visible class:', isVisible);
    console.log(LOG_PREFIX, 'Has bcc-dropdown-hidden class:', dropdown.classList.contains('bcc-dropdown-hidden'));

    if (isVisible) {
      console.log(LOG_PREFIX, 'Dropdown is visible, closing...');
      closeDropdown();
    } else {
      console.log(LOG_PREFIX, 'Dropdown is hidden, opening...');

      // Position dropdown above the button
      const buttonRect = modeButton.getBoundingClientRect();
      console.log(LOG_PREFIX, 'Button rect:', JSON.stringify(buttonRect));
      console.log(LOG_PREFIX, 'Button rect values - top:', buttonRect.top, 'left:', buttonRect.left, 'width:', buttonRect.width, 'height:', buttonRect.height);

      // Set position using inline styles (these won't conflict with visibility classes)
      // Position dropdown below the button
      const finalTop = buttonRect.bottom + 4;
      const finalLeft = buttonRect.left;
      console.log(LOG_PREFIX, 'Final position - top:', finalTop, 'left:', finalLeft);

      dropdown.style.top = finalTop + 'px';
      dropdown.style.left = finalLeft + 'px';

      // Toggle classes for visibility (CSS handles opacity/visibility with !important)
      dropdown.classList.remove('bcc-dropdown-hidden');
      dropdown.classList.add('bcc-dropdown-visible');

      console.log(LOG_PREFIX, 'Classes after toggle:', dropdown.className);

      // Check computed styles
      const computedStyle = window.getComputedStyle(dropdown);
      console.log(LOG_PREFIX, 'Computed styles:');
      console.log(LOG_PREFIX, '  - display:', computedStyle.display);
      console.log(LOG_PREFIX, '  - visibility:', computedStyle.visibility);
      console.log(LOG_PREFIX, '  - opacity:', computedStyle.opacity);
      console.log(LOG_PREFIX, '  - top:', computedStyle.top);
      console.log(LOG_PREFIX, '  - left:', computedStyle.left);
      console.log(LOG_PREFIX, '  - position:', computedStyle.position);
      console.log(LOG_PREFIX, '  - zIndex:', computedStyle.zIndex);

      console.log(LOG_PREFIX, '=== Dropdown should now be visible ===');

      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', closeDropdown, { once: true });
      }, 0);
    }
    console.log(LOG_PREFIX, '=== toggleDropdown() END ===');
  }

  function closeDropdown(e) {
    console.log(LOG_PREFIX, '=== closeDropdown() called ===');
    console.log(LOG_PREFIX, 'Called from event:', e);
    if (e) {
      console.log(LOG_PREFIX, 'Event target:', e.target);
      console.log(LOG_PREFIX, 'Event type:', e.type);
    }
    if (!dropdown) {
      console.log(LOG_PREFIX, 'No dropdown to close');
      return;
    }
    // Use class toggling for visibility (CSS handles the styles with !important)
    dropdown.classList.remove('bcc-dropdown-visible');
    dropdown.classList.add('bcc-dropdown-hidden');
    console.log(LOG_PREFIX, 'Dropdown hidden, classes:', dropdown.className);
  }

  function selectMode(mode) {
    console.log(LOG_PREFIX, 'selectMode() called with:', mode);
    currentMode = mode;
    modeButton.querySelector('.bcc-mode-label').textContent = mode;
    console.log(LOG_PREFIX, 'Updated label to:', mode);

    // Update checkmarks
    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      const check = option.querySelector('.bcc-check');
      check.textContent = option.dataset.mode === mode ? '✓' : '';
    });

    closeDropdown();

    // Handle mode change
    if (mode === 'Plan') {
      console.log(LOG_PREFIX, 'Calling addPlanPrefix()');
      addPlanPrefix();
    } else if (mode === 'Agent') {
      console.log(LOG_PREFIX, 'Calling removePlanPrefix()');
      removePlanPrefix();
    }
  }

  function addPlanPrefix() {
    console.log(LOG_PREFIX, 'addPlanPrefix() called');
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');

    console.log(LOG_PREFIX, 'Found textField:', textField);

    if (textField) {
      const prefix = 'use @agent-plan : ';

      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        if (!textField.value.startsWith(prefix)) {
          textField.value = prefix + textField.value;
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
          console.log(LOG_PREFIX, 'Added prefix, new value:', textField.value);
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
          console.log(LOG_PREFIX, 'Added prefix, new text:', textField.innerText);
        }
      }
    }
  }

  function removePlanPrefix() {
    console.log(LOG_PREFIX, 'removePlanPrefix() called');
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');

    console.log(LOG_PREFIX, 'Found textField:', textField);

    if (textField) {
      const prefix = 'use @agent-plan : ';

      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        if (textField.value.startsWith(prefix)) {
          textField.value = textField.value.slice(prefix.length);
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
          console.log(LOG_PREFIX, 'Removed prefix, new value:', textField.value);
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
          console.log(LOG_PREFIX, 'Removed prefix, new text:', textField.innerText);
        }
      }
    }
  }

  function findAndInjectModeButton() {
    console.log(LOG_PREFIX, 'findAndInjectModeButton() called');

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
      console.log(LOG_PREFIX, 'Trying selector:', selector, '- Found:', targetButton);
      if (targetButton) break;
    }

    let insertionPoint = null;

    if (targetButton) {
      insertionPoint = targetButton.closest('div');
      console.log(LOG_PREFIX, 'Found insertionPoint via targetButton:', insertionPoint);
    } else {
      const form = document.querySelector('form');
      console.log(LOG_PREFIX, 'Found form:', form);
      if (form) {
        const buttonContainers = form.querySelectorAll('button');
        console.log(LOG_PREFIX, 'Found buttons in form:', buttonContainers.length);
        if (buttonContainers.length > 0) {
          insertionPoint = buttonContainers[0].parentElement;
          console.log(LOG_PREFIX, 'Using first button parent as insertionPoint:', insertionPoint);
        }
      }
    }

    if (document.querySelector('.bcc-mode-container')) {
      console.log(LOG_PREFIX, 'Already injected, skipping');
      return;
    }

    if (insertionPoint) {
      console.log(LOG_PREFIX, 'Injecting into insertionPoint');
      const modeContainer = createModeButton();
      insertionPoint.insertBefore(modeContainer, insertionPoint.firstChild);
      console.log(LOG_PREFIX, 'Injection complete');
    } else {
      const form = document.querySelector('form') || document.querySelector('[contenteditable="true"]')?.closest('div');
      console.log(LOG_PREFIX, 'Fallback - form:', form);
      if (form && !document.querySelector('.bcc-mode-container')) {
        console.log(LOG_PREFIX, 'Using floating fallback');
        const modeContainer = createModeButton();
        modeContainer.classList.add('bcc-floating');
        form.style.position = 'relative';
        form.insertBefore(modeContainer, form.firstChild);
        console.log(LOG_PREFIX, 'Floating injection complete');
      } else {
        console.log(LOG_PREFIX, 'No injection point found!');
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

  function parseModelId(modelId, quiet = false) {
    if (!modelId) return null;
    const modelIdLower = modelId.toLowerCase();
    for (const [key, name] of Object.entries(MODEL_NAMES)) {
      if (modelIdLower.includes(key)) {
        if (!quiet) {
          console.log(LOG_PREFIX, `Parsed model ID "${modelId}" -> "${name}"`);
        }
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
        const parsed = parseModelId(stickyModel, true);
        if (parsed) return parsed;
      }
    } catch (e) {}

    try {
      const defaultModel = localStorage.getItem('default-model');
      if (defaultModel) {
        const parsed = parseModelId(defaultModel, true);
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

    console.log(LOG_PREFIX, 'Updating button to show:', modelName);
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
        const currentModel = parseModelId(localStorage.getItem('default-model'), true);
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
        console.log(LOG_PREFIX, `localStorage ${key} changed to:`, value);
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
        const parsedModel = parseModelId(currentModelId, true);

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
    console.log(LOG_PREFIX, 'addBetterLabel() called');

    // Check if betterLabel feature is enabled (but we always show the label itself)
    if (!isFeatureEnabled('betterLabel') && !currentSettings.allEnabled === false) {
      // Only hide label if betterLabel specifically disabled but allEnabled is true
      const existingLabel = document.querySelector('.better-label');
      if (existingLabel && currentSettings.allEnabled && !currentSettings.betterLabel) {
        existingLabel.style.display = 'none';
        return true;
      }
    }

    const claudeCodeLink = document.querySelector('a[href="/code"]');

    if (!claudeCodeLink) {
      console.log(LOG_PREFIX, 'No a[href="/code"] found yet');
      return false;
    }

    console.log(LOG_PREFIX, 'Found Claude Code link:', {
      tagName: claudeCodeLink.tagName,
      className: claudeCodeLink.className,
      href: claudeCodeLink.href
    });

    const parent = claudeCodeLink.parentElement;
    if (parent?.querySelector('.better-label')) {
      console.log(LOG_PREFIX, 'Better label already exists in parent, updating state');
      updateBetterLabelState();
      return true;
    }
    if (claudeCodeLink.nextElementSibling?.classList?.contains('better-label')) {
      console.log(LOG_PREFIX, 'Better label already exists as sibling, updating state');
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

    // Add click handler to toggle all features
    betterLabel.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const newAllEnabled = !currentSettings.allEnabled;
      console.log(LOG_PREFIX, 'Toggling all features:', newAllEnabled);

      await saveSettings({ allEnabled: newAllEnabled });

      // Show feedback then reload
      showToggleFeedback(newAllEnabled ? 'Features enabled - Reloading...' : 'Features disabled - Reloading...');

      // Reload the page after a short delay to show the feedback
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });

    // Add hover effect
    betterLabel.addEventListener('mouseenter', () => {
      betterLabel.style.opacity = '0.8';
    });
    betterLabel.addEventListener('mouseleave', () => {
      betterLabel.style.opacity = '1';
    });

    console.log(LOG_PREFIX, 'Inserting Better label');
    claudeCodeLink.parentNode.insertBefore(betterLabel, claudeCodeLink.nextSibling);
    console.log(LOG_PREFIX, 'Better label inserted successfully');

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

  // Add "Pull Branch in CLI" button next to Create PR button
  function watchForCopyBranchButton() {
    console.log(LOG_PREFIX, '👀 Setting up Pull Branch in CLI button watcher...');

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
            console.log(LOG_PREFIX, `Found branch in element: "${branch}"`);
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
      if (document.querySelector('.better-pull-branch-btn')) {
        return;
      }

      // Find the Create PR button
      const allButtons = document.querySelectorAll('button');
      let createPRButton = null;

      for (const btn of allButtons) {
        const text = btn.textContent.trim();
        if (text.includes('Create PR') || text.includes('Create pull request')) {
          createPRButton = btn;
          break;
        }
      }

      if (!createPRButton) {
        console.log(LOG_PREFIX, 'Create PR button not found yet');
        return;
      }

      // Extract branch name
      currentBranchName = extractBranchName();
      if (!currentBranchName) {
        console.log(LOG_PREFIX, 'Branch name not found');
        return;
      }

      console.log(LOG_PREFIX, `📋 Found Create PR button and branch: ${currentBranchName}`);

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

        // Re-extract branch name in case it changed
        const branchName = extractBranchName() || currentBranchName;
        const gitCommand = `git fetch && git co ${branchName} && git pull`;
        console.log(LOG_PREFIX, `📋 Copying git command: ${gitCommand}`);

        try {
          await navigator.clipboard.writeText(gitCommand);
          console.log(LOG_PREFIX, '✅ Git command copied to clipboard!');
          showCopyFeedback('Command copied to clipboard');
        } catch (err) {
          console.error(LOG_PREFIX, '❌ Failed to copy:', err);
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
            console.log(LOG_PREFIX, '✅ Git command copied via fallback!');
            showCopyFeedback('Command copied to clipboard');
          } catch (fallbackErr) {
            console.error(LOG_PREFIX, '❌ Fallback copy failed:', fallbackErr);
          }
        }
      });

      // Insert button before the Create PR button
      createPRButton.parentNode.insertBefore(pullBranchBtn, createPRButton);
      console.log(LOG_PREFIX, '✅ Pull Branch in CLI button added');
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

    // Watch for DOM changes to detect when Create PR button appears
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

    console.log(LOG_PREFIX, 'Pull Branch in CLI button watcher active');
    return observer;
  }

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
  function debouncedAddBetterLabel() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      addBetterLabel();
    }, 100);
  }

  async function init() {
    console.log(LOG_PREFIX, 'init() called, readyState:', document.readyState);

    try {
      // Load settings first
      await loadSettings();
      console.log(LOG_PREFIX, 'Settings loaded in init:', currentSettings);
    } catch (e) {
      console.log(LOG_PREFIX, 'Failed to load settings, using defaults:', e);
    }

    // Set up model display watchers (only if enabled)
    if (isFeatureEnabled('showModel')) {
      watchLocalStorage();
      pollForModelChanges();

      // Store initial model
      lastKnownModel = getSelectedModel();
      console.log(LOG_PREFIX, 'Initial model:', lastKnownModel);
    }

    // Function to inject UI elements
    function injectUI() {
      try {
        if (isFeatureEnabled('modeButton')) {
          setTimeout(findAndInjectModeButton, 1000);
        }
        addBetterLabel(); // Always add the label (it's the toggle)
        if (isFeatureEnabled('showModel')) {
          updateModelSelector();
        }
        // Apply project colors
        applyProjectColors();
      } catch (e) {
        console.error(LOG_PREFIX, 'Error injecting UI:', e);
      }
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
      console.log(LOG_PREFIX, 'Document still loading, adding DOMContentLoaded listener');
      document.addEventListener('DOMContentLoaded', () => {
        console.log(LOG_PREFIX, 'DOMContentLoaded fired');
        injectUI();
      });
    } else {
      console.log(LOG_PREFIX, 'Document already loaded, scheduling injection');
      injectUI();
    }

    // Watch for copy branch button clicks (only if enabled)
    if (isFeatureEnabled('pullBranch')) {
      watchForCopyBranchButton();
    }

    // Watch for DOM changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      // Re-inject mode button if missing and enabled
      if (isFeatureEnabled('modeButton') && !document.querySelector('.bcc-mode-container')) {
        console.log(LOG_PREFIX, 'MutationObserver: mode container missing, re-injecting');
        findAndInjectModeButton();
      }
      // Re-add better label if missing (always, since it's the toggle control)
      debouncedAddBetterLabel();

      // Re-add pull branch button if missing and enabled
      if (isFeatureEnabled('pullBranch') && !document.querySelector('.better-pull-branch-btn')) {
        // The watcher handles this, but we can trigger a check
      }

      // Re-apply project colors on DOM changes
      debouncedApplyProjectColors();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log(LOG_PREFIX, 'Initialization complete');
  }

  init().catch(e => {
    console.error(LOG_PREFIX, 'Init failed:', e);
    // Fallback: try to add the better label anyway
    setTimeout(() => addBetterLabel(), 1000);
  });
})();
