// Refined Claude Code on the Web - Content Script
// Features: Mode Button, Show Actual Model, Refined Label, Pull Branch in CLI

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
  let currentMode = localStorage.getItem(MODE_STORAGE_KEY) || 'Agent';

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
        <span class="bcc-check">${currentMode === 'Agent' ? '&#10003;' : ''}</span>
        <span>Agent</span>
      </div>
      <div class="bcc-mode-option" data-mode="Plan">
        <span class="bcc-check">${currentMode === 'Plan' ? '&#10003;' : ''}</span>
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
    localStorage.setItem(MODE_STORAGE_KEY, mode);
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

  const PLAN_INSTRUCTION = 'DO NOT write any code yet. I just need the plan for me to review.';
  const PLAN_PREFIX = 'use @agent-plan : ';
  const PLAN_FULL_PREFIX = PLAN_INSTRUCTION + '\n\n' + PLAN_PREFIX;

  function addPlanPrefix() {
    console.log(LOG_PREFIX, 'addPlanPrefix() called');
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');

    console.log(LOG_PREFIX, 'Found textField:', textField);

    if (textField) {
      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        if (!textField.value.startsWith(PLAN_INSTRUCTION)) {
          textField.value = PLAN_FULL_PREFIX + textField.value;
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
          console.log(LOG_PREFIX, 'Added prefix, new value:', textField.value);
        }
      } else {
        const currentText = textField.innerText || textField.textContent || '';
        if (!currentText.startsWith(PLAN_INSTRUCTION)) {
          textField.focus();
          textField.innerText = PLAN_FULL_PREFIX + currentText;
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
      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        if (textField.value.startsWith(PLAN_INSTRUCTION)) {
          textField.value = textField.value.slice(PLAN_FULL_PREFIX.length);
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
          console.log(LOG_PREFIX, 'Removed prefix, new value:', textField.value);
        }
      } else {
        const currentText = textField.innerText || textField.textContent || '';
        if (currentText.startsWith(PLAN_INSTRUCTION)) {
          textField.focus();
          textField.innerText = currentText.slice(PLAN_FULL_PREFIX.length);
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

    let injected = false;
    if (insertionPoint) {
      console.log(LOG_PREFIX, 'Injecting into insertionPoint');
      const modeContainer = createModeButton();
      insertionPoint.insertBefore(modeContainer, insertionPoint.firstChild);
      console.log(LOG_PREFIX, 'Injection complete');
      injected = true;
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
        injected = true;
      } else {
        console.log(LOG_PREFIX, 'No injection point found!');
      }
    }

    // Apply plan prefix if Plan mode is active after injection
    if (injected && currentMode === 'Plan') {
      console.log(LOG_PREFIX, 'Plan mode is active, applying prefix to text field');
      // Small delay to ensure text field is ready
      setTimeout(() => {
        addPlanPrefix();
      }, 100);
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
  // Refined Label Feature
  // ============================================

  function addRefinedLabel() {
    console.log(LOG_PREFIX, 'addRefinedLabel() called');

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
      console.log(LOG_PREFIX, 'No a[href="/code"] found yet');
      return false;
    }

    console.log(LOG_PREFIX, 'Found Claude Code link:', {
      tagName: claudeCodeLink.tagName,
      className: claudeCodeLink.className,
      href: claudeCodeLink.href
    });

    const parent = claudeCodeLink.parentElement;
    if (parent?.querySelector('.refined-label')) {
      console.log(LOG_PREFIX, 'Refined label already exists in parent, updating state');
      updateRefinedLabelState();
      return true;
    }
    if (claudeCodeLink.nextElementSibling?.classList?.contains('refined-label')) {
      console.log(LOG_PREFIX, 'Refined label already exists as sibling, updating state');
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
    refinedLabel.addEventListener('mouseenter', () => {
      refinedLabel.style.opacity = '0.8';
    });
    refinedLabel.addEventListener('mouseleave', () => {
      refinedLabel.style.opacity = '1';
    });

    console.log(LOG_PREFIX, 'Inserting Refined label');
    claudeCodeLink.parentNode.insertBefore(refinedLabel, claudeCodeLink.nextSibling);
    console.log(LOG_PREFIX, 'Refined label inserted successfully');

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
        console.log(LOG_PREFIX, 'PR button not found yet');
        return;
      }

      // Extract branch name
      currentBranchName = extractBranchName();
      if (!currentBranchName) {
        console.log(LOG_PREFIX, 'Branch name not found');
        return;
      }

      console.log(LOG_PREFIX, `📋 Found PR button and branch: ${currentBranchName}`);

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

      // Find the flex container - structure varies between Create PR and View PR
      // View PR: prButton > animate-wrapper > flex-container
      // Create PR: prButton > flex-h-8 > animate-wrapper > flex-container
      const flexContainer = prButton.closest('.flex.items-center.gap-2');

      if (!flexContainer) {
        console.log(LOG_PREFIX, 'Flex container not found');
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

    console.log(LOG_PREFIX, 'Pull Branch in CLI button watcher active');
    return observer;
  }

  // ============================================
  // Merge Branch Feature
  // ============================================

  // Add "Merge [main]" button next to View PR button
  function watchForMergeBranchButton() {
    console.log(LOG_PREFIX, '👀 Setting up Merge Branch button watcher...');

    // Function to get main branch from settings
    // Simply checks if any configured project name appears in the page text
    function getMainBranchFromSettings() {
      const projectMainBranch = currentSettings.projectMainBranch || {};
      const pageText = document.body.innerText || '';

      // Check each configured project name
      for (const [projectName, branch] of Object.entries(projectMainBranch)) {
        if (pageText.includes(projectName)) {
          console.log(LOG_PREFIX, `Found project "${projectName}" in page, using branch: ${branch}`);
          return branch;
        }
      }

      // Default to 'main' if no match found
      console.log(LOG_PREFIX, 'No configured project found in page, using default "main"');
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
        console.log(LOG_PREFIX, 'PR button not found yet for merge button');
        return;
      }

      // Get main branch from settings (defaults to 'main')
      const mainBranch = getMainBranchFromSettings();

      console.log(LOG_PREFIX, `📋 Found target button and main branch: ${mainBranch}`);

      // Create the Merge Branch button with similar styling
      const mergeBranchBtn = document.createElement('button');
      mergeBranchBtn.type = 'button';
      mergeBranchBtn.className = 'group flex items-center gap-[6px] px-[10px] py-2 bg-bg-000 border-0.5 border-border-300 rounded-[6px] shadow-sm hover:bg-bg-100 transition-colors refined-merge-branch-btn';
      mergeBranchBtn.title = `Insert merge request into text field`;

      // Match exact HTML structure with merge icon - branch name in italics
      mergeBranchBtn.innerHTML = `
        <span class="text-xs font-medium text-text-100 group-disabled:text-text-500">Merge <em style="font-style: italic;">${mainBranch}</em></span>
        <div class="group-disabled:text-text-500" style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: #8b5cf6;">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="group-disabled:text-text-500" aria-hidden="true" style="flex-shrink: 0; color: #8b5cf6;">
            <path d="M108,64A36,36,0,1,0,60,97.94v60.12a36,36,0,1,0,24,0V97.94A36.07,36.07,0,0,0,108,64ZM72,52A12,12,0,1,1,60,64,12,12,0,0,1,72,52Zm0,152a12,12,0,1,1,12-12A12,12,0,0,1,72,204Zm140-45.94V110.63a27.81,27.81,0,0,0-8.2-19.8L173,60h19a12,12,0,0,0,0-24H144a12,12,0,0,0-12,12V96a12,12,0,0,0,24,0V77l30.83,30.83a4,4,0,0,1,1.17,2.83v47.43a36,36,0,1,0,24,0ZM200,204a12,12,0,1,1,12-12A12,12,0,0,1,200,204Z"></path>
          </svg>
        </div>
      `;

      mergeBranchBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Get main branch from settings
        const branch = getMainBranchFromSettings();
        const mergeMessage = `Merge the "${branch}" branch in and fix merge conflicts.`;
        console.log(LOG_PREFIX, `📋 Inserting merge message: ${mergeMessage}`);

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
          console.log(LOG_PREFIX, '✅ Merge message inserted into text field');
          showMergeCopyFeedback('Merge message inserted');
        } else {
          console.error(LOG_PREFIX, '❌ Text field not found');
        }
      });

      // Find the flex container - structure varies between Create PR and View PR
      const flexContainer = prButton.closest('.flex.items-center.gap-2');

      if (!flexContainer) {
        console.log(LOG_PREFIX, 'Flex container not found for merge button');
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
      console.log(LOG_PREFIX, '✅ Merge Branch button added');
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

    console.log(LOG_PREFIX, 'Merge Branch button watcher active');
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
    console.log(LOG_PREFIX, `Found ${sessions.length} sessions`);
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
          console.log(LOG_PREFIX, 'Found delete button for session');
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
          console.log(LOG_PREFIX, 'Found archive button for session');
          return button;
        }
      }
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
    console.log(LOG_PREFIX, '>>> addBlockedButtonToSession called', sessionEl);
    if (!sessionEl) {
      console.log(LOG_PREFIX, '>>> sessionEl is null/undefined');
      return null;
    }

    // Check if already added
    const existingBtn = findBlockedButton(sessionEl);
    if (existingBtn) {
      console.log(LOG_PREFIX, '>>> Blocked button already exists for this session');
      return null;
    }

    // Find the archive button to insert after (blocked button goes to the right)
    console.log(LOG_PREFIX, '>>> Looking for archive button...');
    const archiveButton = findArchiveButton(sessionEl);
    console.log(LOG_PREFIX, '>>> Archive button found:', archiveButton);
    if (!archiveButton) {
      console.log(LOG_PREFIX, '>>> Archive button not found, cannot add blocked button');
      // Log all buttons in the session for debugging
      const allButtons = sessionEl.querySelectorAll('button');
      console.log(LOG_PREFIX, '>>> All buttons in session:', allButtons.length);
      allButtons.forEach((btn, i) => {
        const svg = btn.querySelector('svg');
        console.log(LOG_PREFIX, `>>>   Button ${i}:`, btn.className, 'SVG viewBox:', svg?.getAttribute('viewBox'));
      });
      return null;
    }

    // Find the container - the archive button is wrapped in a div
    console.log(LOG_PREFIX, '>>> Looking for archive wrapper div...');
    const archiveWrapper = archiveButton.parentElement;
    console.log(LOG_PREFIX, '>>> Archive wrapper found:', archiveWrapper);
    if (!archiveWrapper) {
      console.log(LOG_PREFIX, '>>> Archive button wrapper not found');
      return null;
    }

    // Create the blocked button
    console.log(LOG_PREFIX, '>>> Creating blocked button...');
    const blockedButton = createBlockedButton();
    console.log(LOG_PREFIX, '>>> Blocked button created:', blockedButton);

    // Create a wrapper div similar to the archive button wrapper
    const blockedWrapper = document.createElement('div');
    blockedWrapper.className = 'bcc-blocked-wrapper';
    blockedWrapper.appendChild(blockedButton);

    // Insert after the archive button wrapper (to the right)
    console.log(LOG_PREFIX, '>>> Inserting blocked button after archive wrapper...');
    console.log(LOG_PREFIX, '>>> archiveWrapper.parentNode:', archiveWrapper.parentNode);
    archiveWrapper.parentNode.insertBefore(blockedWrapper, archiveWrapper.nextSibling);

    console.log(LOG_PREFIX, '>>> SUCCESS: Added blocked button to session');

    // Check if this session was previously blocked (restore state from storage)
    const sessionData = getSessionData(sessionEl);
    getBlockedReason(sessionData).then((reason) => {
      if (reason) {
        console.log(LOG_PREFIX, '>>> Found stored blocked reason, restoring blocked state');
        // Mark as blocked without showing modal
        blockedButton.classList.add('bcc-blocked-active');
        blockedButton.style.color = '#f59e0b';
        blockedButton.title = 'Marked as blocked - click to unblock';
        addBlockedIndicator(sessionEl);
      }
    });

    // Add click handler
    blockedButton.addEventListener('click', (e) => {
      console.log(LOG_PREFIX, '>>> CLICK EVENT FIRED on blocked button!');
      console.log(LOG_PREFIX, '>>> Event:', e);
      console.log(LOG_PREFIX, '>>> Target:', e.target);
      e.preventDefault();
      e.stopPropagation();
      handleBlockedClick(sessionEl, blockedButton);
    });

    // Add hover handler to show tooltip
    let tooltipElement = null;
    blockedButton.addEventListener('mouseenter', () => {
      getBlockedReason(sessionData).then((message) => {
        if (message) {
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

    // Also add mousedown for debugging
    blockedButton.addEventListener('mousedown', (e) => {
      console.log(LOG_PREFIX, '>>> MOUSEDOWN EVENT on blocked button');
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

  /**
   * Save blocked reason message to storage
   * @param {Object} sessionData - The session data object
   * @param {string} message - The blocked reason message
   */
  function saveBlockedReason(sessionData, message) {
    const storageKey = getSessionStorageId(sessionData);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const data = {};
      data[storageKey] = message;
      chrome.storage.sync.set(data, () => {
        console.log(LOG_PREFIX, '>>> Saved blocked reason to chrome storage:', storageKey);
      });
    } else {
      // Fallback to localStorage
      localStorage.setItem(storageKey, message);
      console.log(LOG_PREFIX, '>>> Saved blocked reason to localStorage:', storageKey);
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
            console.log(LOG_PREFIX, '>>> Error reading from chrome storage:', chrome.runtime.lastError);
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
   * @param {Function} onSave - Callback when message is saved
   */
  function showBlockedReasonEditor(blockedButton, sessionData, onSave) {
    console.log(LOG_PREFIX, '>>> showBlockedReasonEditor called');

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
      inputEl.value = existingMessage || '';
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
        if (onSave) onSave(message);
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
    console.log(LOG_PREFIX, '>>> handleBlockedClick called');
    console.log(LOG_PREFIX, '>>> sessionEl:', sessionEl);
    console.log(LOG_PREFIX, '>>> button:', button);

    const sessionData = getSessionData(sessionEl);
    console.log(LOG_PREFIX, '>>> sessionData:', sessionData);
    console.log(LOG_PREFIX, '>>> Blocked button clicked for session:', sessionData?.title);

    // Toggle blocked state visually
    console.log(LOG_PREFIX, '>>> Toggling bcc-blocked-active class...');
    const isBlocked = button.classList.toggle('bcc-blocked-active');
    console.log(LOG_PREFIX, '>>> isBlocked after toggle:', isBlocked);

    if (isBlocked) {
      console.log(LOG_PREFIX, '>>> Setting blocked state (amber color)');
      button.style.color = '#f59e0b';
      button.title = 'Marked as blocked - click to unblock';
      // Add always-visible blocked indicator next to title
      addBlockedIndicator(sessionEl);
      console.log(LOG_PREFIX, '>>> Showing modal for reason input...');
      // Show inline editor for entering reason
      showBlockedReasonEditor(button, sessionData, (message) => {
        showBlockedFeedback(`Session "${sessionData?.title}" marked as blocked`, true);
      });
    } else {
      console.log(LOG_PREFIX, '>>> Clearing blocked state');
      button.style.color = '';
      button.title = 'Mark as blocked';
      // Remove the blocked indicator
      removeBlockedIndicator(sessionEl);
      // Remove any existing tooltip from the button
      const existingTooltip = button.querySelector('.bcc-blocked-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
        console.log(LOG_PREFIX, '>>> Removed tooltip from button');
      }
      // Clear the stored reason
      const storageKey = getSessionStorageId(sessionData);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.remove([storageKey], () => {
          console.log(LOG_PREFIX, '>>> Removed blocked reason from storage');
        });
      } else {
        localStorage.removeItem(storageKey);
      }
      console.log(LOG_PREFIX, '>>> Calling showBlockedFeedback...');
      showBlockedFeedback(`Session "${sessionData?.title}" unblocked`, false);
    }

    // Emit custom event for external listeners
    console.log(LOG_PREFIX, '>>> Dispatching bcc:session-blocked event');
    window.dispatchEvent(new CustomEvent('bcc:session-blocked', {
      detail: {
        sessionData,
        isBlocked
      }
    }));
    console.log(LOG_PREFIX, '>>> handleBlockedClick complete');
  }

  /**
   * Show visual feedback when blocking/unblocking
   * @param {string} message - The message to display
   * @param {boolean} isBlocked - True for blocked (amber), false for unblocked (green)
   */
  function showBlockedFeedback(message, isBlocked = true) {
    console.log(LOG_PREFIX, '>>> showBlockedFeedback called with message:', message, 'isBlocked:', isBlocked);

    const bgColor = isBlocked ? '#f59e0b' : '#059669'; // amber for blocked, green for unblocked
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
      console.log(LOG_PREFIX, '>>> Adding animation keyframes to document');
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

    console.log(LOG_PREFIX, '>>> Appending feedback element to body');
    document.body.appendChild(feedback);
    console.log(LOG_PREFIX, '>>> Feedback element added, will remove in 2s');
    setTimeout(() => {
      feedback.remove();
      console.log(LOG_PREFIX, '>>> Feedback element removed');
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

    // Find the relative container inside buttons area (parent of hover container)
    const relativeContainer = sessionEl.querySelector('.flex-shrink-0 .relative');
    if (!relativeContainer) {
      console.log(LOG_PREFIX, '>>> Relative container not found for blocked indicator');
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
    indicator.style.cssText = `color: #f59e0b; display: ${isCurrentlyHovering ? 'none' : 'inline-flex'}; position: relative;`;

    if (groupEl) {
      groupEl.addEventListener('mouseenter', () => {
        indicator.style.display = 'none';
      });
      groupEl.addEventListener('mouseleave', () => {
        indicator.style.display = 'inline-flex';
      });
    }

    // Append to relative container (sibling of hover buttons container)
    relativeContainer.appendChild(indicator);
    console.log(LOG_PREFIX, '>>> Added blocked indicator to relative container (hides on hover)');
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
      console.log(LOG_PREFIX, '>>> Removed blocked indicator from session');
    }
  }

  /**
   * Add blocked buttons to all visible sessions
   */
  function addBlockedButtonsToAllSessions() {
    console.log(LOG_PREFIX, '>>> addBlockedButtonsToAllSessions called');
    const sessions = getAllSessions();
    console.log(LOG_PREFIX, `>>> Found ${sessions.length} sessions to process`);
    let addedCount = 0;

    sessions.forEach((sessionEl, index) => {
      console.log(LOG_PREFIX, `>>> Processing session ${index}...`);
      const button = addBlockedButtonToSession(sessionEl);
      if (button) {
        addedCount++;
        console.log(LOG_PREFIX, `>>> Button added for session ${index}`);
      } else {
        console.log(LOG_PREFIX, `>>> No button added for session ${index} (already exists or failed)`);
      }
    });

    console.log(LOG_PREFIX, `>>> addBlockedButtonsToAllSessions complete. Added: ${addedCount}`);
  }

  /**
   * Set up observer to add blocked buttons when new sessions appear
   */
  function setupBlockedButtonObserver() {
    console.log(LOG_PREFIX, '>>> setupBlockedButtonObserver called');

    // Find the sessions container - try multiple selectors
    let sessionsContainer = document.querySelector('.flex.flex-col.gap-0\\.5.px-1');
    console.log(LOG_PREFIX, '>>> Sessions container (escaped selector):', sessionsContainer);

    // Try alternative selectors if the first one fails
    if (!sessionsContainer) {
      sessionsContainer = document.querySelector('[data-index="0"]')?.closest('.flex.flex-col');
      console.log(LOG_PREFIX, '>>> Sessions container (via data-index):', sessionsContainer);
    }

    if (!sessionsContainer) {
      // Just find any container with data-index elements
      const firstSession = document.querySelector('[data-index]');
      if (firstSession) {
        sessionsContainer = firstSession.parentElement;
        console.log(LOG_PREFIX, '>>> Sessions container (via parent):', sessionsContainer);
      }
    }

    if (!sessionsContainer) {
      console.log(LOG_PREFIX, '>>> Sessions container not found, will retry in 1s');
      setTimeout(setupBlockedButtonObserver, 1000);
      return;
    }

    console.log(LOG_PREFIX, '>>> Sessions container found:', sessionsContainer);

    // Add buttons to existing sessions
    console.log(LOG_PREFIX, '>>> Adding buttons to existing sessions...');
    addBlockedButtonsToAllSessions();

    // Watch for new sessions
    console.log(LOG_PREFIX, '>>> Setting up MutationObserver...');
    const observer = new MutationObserver((mutations) => {
      console.log(LOG_PREFIX, '>>> MutationObserver triggered, mutations:', mutations.length);
      // Debounce to avoid excessive processing
      clearTimeout(observer._timeout);
      observer._timeout = setTimeout(() => {
        console.log(LOG_PREFIX, '>>> Debounced: calling addBlockedButtonsToAllSessions');
        addBlockedButtonsToAllSessions();
      }, 100);
    });

    observer.observe(sessionsContainer, {
      childList: true,
      subtree: true
    });

    console.log(LOG_PREFIX, '>>> Blocked button observer active and watching:', sessionsContainer);
    return observer;
  }

  // Initialize blocked button feature after a delay to ensure page is loaded
  console.log(LOG_PREFIX, '>>> Scheduling setupBlockedButtonObserver in 2s...');
  setTimeout(() => {
    console.log(LOG_PREFIX, '>>> 2s delay complete, calling setupBlockedButtonObserver');
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
    getButtons: getSessionButtons,
    triggerHover: triggerSessionHover,
    clearHover: clearSessionHover,
    addBlockedButton: addBlockedButtonToSession,
    addBlockedButtonsToAll: addBlockedButtonsToAllSessions
  };

  console.log(LOG_PREFIX, 'Session detection utilities loaded. Access via window.RefinedClaudeCode.sessions');

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
        addRefinedLabel(); // Always add the label (it's the toggle)
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

    // Watch for merge branch button (only if enabled)
    if (isFeatureEnabled('mergeBranch')) {
      watchForMergeBranchButton();
    }

    // Watch for DOM changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      // Re-inject mode button if missing and enabled
      if (isFeatureEnabled('modeButton') && !document.querySelector('.bcc-mode-container')) {
        console.log(LOG_PREFIX, 'MutationObserver: mode container missing, re-injecting');
        findAndInjectModeButton();
      }
      // Re-add refined label if missing (always, since it's the toggle control)
      debouncedAddRefinedLabel();

      // Re-add pull branch button if missing and enabled
      if (isFeatureEnabled('pullBranch') && !document.querySelector('.refined-pull-branch-btn')) {
        // The watcher handles this, but we can trigger a check
      }

      // Re-add merge branch button if missing and enabled
      if (isFeatureEnabled('mergeBranch') && !document.querySelector('.refined-merge-branch-btn')) {
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
    // Fallback: try to add the refined label anyway
    setTimeout(() => addRefinedLabel(), 1000);
  });
})();
