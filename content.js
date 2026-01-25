// Better Claude Code on the Web - Content Script
// Features: Mode Button, Show Actual Model, Better Label

(function() {
  'use strict';

  const LOG_PREFIX = '[BCC]';

  console.log(LOG_PREFIX, 'Script loaded');
  console.log(LOG_PREFIX, 'URL:', window.location.href);
  console.log(LOG_PREFIX, 'Document readyState:', document.readyState);

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
    modeButton.addEventListener('click', toggleDropdown);

    // Create dropdown
    dropdown = document.createElement('div');
    dropdown.className = 'bcc-mode-dropdown';
    // Apply inline styles for dropdown
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
    console.log(LOG_PREFIX, 'Created dropdown:', dropdown);

    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      option.addEventListener('click', (e) => {
        console.log(LOG_PREFIX, 'Option clicked:', option.dataset.mode);
        e.preventDefault();
        e.stopPropagation();
        selectMode(option.dataset.mode);
      });
    });

    container.appendChild(modeButton);
    container.appendChild(dropdown);

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
    console.log(LOG_PREFIX, 'toggleDropdown() called');
    e.stopPropagation();
    e.preventDefault();
    const isVisible = dropdown.style.visibility === 'visible';
    console.log(LOG_PREFIX, 'Current visibility:', isVisible);

    if (isVisible) {
      closeDropdown();
    } else {
      dropdown.style.opacity = '1';
      dropdown.style.visibility = 'visible';
      dropdown.style.transform = 'translateY(0)';
      console.log(LOG_PREFIX, 'Dropdown now visible');
      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', closeDropdown, { once: true });
      }, 0);
    }
  }

  function closeDropdown() {
    console.log(LOG_PREFIX, 'closeDropdown() called');
    dropdown.style.opacity = '0';
    dropdown.style.visibility = 'hidden';
    dropdown.style.transform = 'translateY(4px)';
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
      console.log(LOG_PREFIX, 'Better label already exists in parent, skipping');
      return true;
    }
    if (claudeCodeLink.nextElementSibling?.classList?.contains('better-label')) {
      console.log(LOG_PREFIX, 'Better label already exists as sibling, skipping');
      return true;
    }

    const betterLabel = document.createElement('span');
    betterLabel.textContent = 'Better';
    betterLabel.className = 'better-label';

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
    `;

    console.log(LOG_PREFIX, 'Inserting Better label');
    claudeCodeLink.parentNode.insertBefore(betterLabel, claudeCodeLink.nextSibling);
    console.log(LOG_PREFIX, 'Better label inserted successfully');

    return true;
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

  function init() {
    console.log(LOG_PREFIX, 'init() called, readyState:', document.readyState);

    // Set up model display watchers
    watchLocalStorage();
    pollForModelChanges();

    // Store initial model
    lastKnownModel = getSelectedModel();
    console.log(LOG_PREFIX, 'Initial model:', lastKnownModel);

    // Wait for page to load
    if (document.readyState === 'loading') {
      console.log(LOG_PREFIX, 'Document still loading, adding DOMContentLoaded listener');
      document.addEventListener('DOMContentLoaded', () => {
        console.log(LOG_PREFIX, 'DOMContentLoaded fired');
        setTimeout(findAndInjectModeButton, 1000);
        addBetterLabel();
        updateModelSelector();
      });
    } else {
      console.log(LOG_PREFIX, 'Document already loaded, scheduling injection');
      setTimeout(findAndInjectModeButton, 1000);
      addBetterLabel();
      updateModelSelector();
    }

    // Watch for DOM changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      // Re-inject mode button if missing
      if (!document.querySelector('.bcc-mode-container')) {
        console.log(LOG_PREFIX, 'MutationObserver: mode container missing, re-injecting');
        findAndInjectModeButton();
      }
      // Re-add better label if missing
      debouncedAddBetterLabel();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log(LOG_PREFIX, 'MutationObserver started');
  }

  init();
})();
