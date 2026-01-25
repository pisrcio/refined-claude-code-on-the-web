// Better Claude Code on the Web - Show Actual Model Name
// This script replaces the "..." button with the actual selected model name

(function() {
  'use strict';

  const LOG_PREFIX = '[BetterClaude]';

  console.log(LOG_PREFIX, '🚀 Content script loaded!');
  console.log(LOG_PREFIX, 'URL:', window.location.href);
  console.log(LOG_PREFIX, 'Document readyState:', document.readyState);

  const MODEL_NAMES = {
    'opus': 'Opus 4.5',
    'sonnet': 'Sonnet 4.5',
    'haiku': 'Haiku 4.5'
  };

  // Find the model selector button (the "..." button)
  function findModelSelectorButton() {
    console.log(LOG_PREFIX, '🔍 Looking for model selector button...');

    // Look for buttons that might be the model selector
    const buttons = document.querySelectorAll('button');
    console.log(LOG_PREFIX, `Found ${buttons.length} buttons on page`);

    for (const button of buttons) {
      // The "..." button typically contains just an ellipsis or three dots icon
      const text = button.textContent.trim();
      const innerHTML = button.innerHTML;

      // Log buttons that might be relevant (short text or contain svg)
      if (text.length < 10 || button.querySelector('svg')) {
        console.log(LOG_PREFIX, 'Button candidate:', {
          text: text,
          innerHTML: innerHTML.substring(0, 200),
          classList: button.className,
          ariaLabel: button.getAttribute('aria-label'),
          dataTestId: button.getAttribute('data-testid')
        });
      }

      if (text === '...' || text === '\u2026' || text === '\u22EF') {
        console.log(LOG_PREFIX, '✅ Found "..." button by text!', button);
        return button;
      }

      // Also check for SVG with three dots pattern
      const svg = button.querySelector('svg');
      if (svg && button.closest('[data-testid]')?.dataset.testid?.includes('model')) {
        console.log(LOG_PREFIX, '✅ Found model button by data-testid!', button);
        return button;
      }
    }

    console.log(LOG_PREFIX, '❌ No model selector button found');
    return null;
  }

  // Get the currently selected model from the dropdown or page state
  function getSelectedModel() {
    console.log(LOG_PREFIX, '🔍 Looking for selected model...');

    // Method 1: Look for a checked/selected item in a model dropdown
    const checkedItem = document.querySelector('[role="menuitemradio"][aria-checked="true"]');
    console.log(LOG_PREFIX, 'Method 1 - menuitemradio checked:', checkedItem?.textContent);
    if (checkedItem) {
      const modelText = checkedItem.textContent;
      for (const [key, name] of Object.entries(MODEL_NAMES)) {
        if (modelText.toLowerCase().includes(key)) {
          console.log(LOG_PREFIX, '✅ Found model via Method 1:', name);
          return name;
        }
      }
    }

    // Method 2: Look for checkmark icon next to model name
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"]');
    console.log(LOG_PREFIX, `Method 2 - Found ${menuItems.length} menu items`);
    for (const item of menuItems) {
      const hasCheck = item.querySelector('svg[data-state="checked"], .check-icon, [data-checked="true"]') ||
                       item.querySelector('svg')?.innerHTML.includes('check') ||
                       item.getAttribute('aria-checked') === 'true' ||
                       item.getAttribute('data-state') === 'checked';

      console.log(LOG_PREFIX, 'Menu item:', {
        text: item.textContent.substring(0, 50),
        hasCheck: hasCheck,
        ariaChecked: item.getAttribute('aria-checked'),
        dataState: item.getAttribute('data-state')
      });

      if (hasCheck) {
        const text = item.textContent.toLowerCase();
        for (const [key, name] of Object.entries(MODEL_NAMES)) {
          if (text.includes(key)) {
            console.log(LOG_PREFIX, '✅ Found model via Method 2:', name);
            return name;
          }
        }
      }
    }

    // Method 3: Look for model indicator in the UI
    const modelIndicators = document.querySelectorAll('[class*="model"], [data-model]');
    console.log(LOG_PREFIX, `Method 3 - Found ${modelIndicators.length} model indicators`);
    for (const indicator of modelIndicators) {
      const text = indicator.textContent.toLowerCase();
      console.log(LOG_PREFIX, 'Model indicator:', text.substring(0, 100));
      for (const [key, name] of Object.entries(MODEL_NAMES)) {
        if (text.includes(key)) {
          console.log(LOG_PREFIX, '✅ Found model via Method 3:', name);
          return name;
        }
      }
    }

    // Method 4: Check page URL or local storage for model preference
    try {
      console.log(LOG_PREFIX, 'Method 4 - Checking localStorage...');
      const allKeys = Object.keys(localStorage);
      console.log(LOG_PREFIX, 'LocalStorage keys:', allKeys);

      for (const key of allKeys) {
        const value = localStorage.getItem(key);
        if (value && (key.toLowerCase().includes('model') || value.toLowerCase().includes('opus') || value.toLowerCase().includes('sonnet') || value.toLowerCase().includes('haiku'))) {
          console.log(LOG_PREFIX, `LocalStorage ${key}:`, value.substring(0, 200));
        }
      }

      const stored = localStorage.getItem('selectedModel') || localStorage.getItem('model');
      if (stored) {
        const storedLower = stored.toLowerCase();
        for (const [key, name] of Object.entries(MODEL_NAMES)) {
          if (storedLower.includes(key)) {
            console.log(LOG_PREFIX, '✅ Found model via Method 4:', name);
            return name;
          }
        }
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'localStorage error:', e);
    }

    // Method 5: Search entire page text for model names
    console.log(LOG_PREFIX, 'Method 5 - Searching page text...');
    const pageText = document.body.innerText.toLowerCase();
    for (const [key, name] of Object.entries(MODEL_NAMES)) {
      if (pageText.includes(key + ' 4.5')) {
        console.log(LOG_PREFIX, `Found "${key}" in page text`);
      }
    }

    console.log(LOG_PREFIX, '❌ No selected model found');
    return null;
  }

  // Create or update the model display
  function updateModelDisplay(button, modelName) {
    console.log(LOG_PREFIX, '📝 updateModelDisplay called with:', { button: !!button, modelName });

    if (!button || !modelName) {
      console.log(LOG_PREFIX, '❌ Missing button or modelName');
      return;
    }

    // Check if we've already modified this button
    if (button.dataset.modelDisplayUpdated === 'true' &&
        button.dataset.currentModel === modelName) {
      console.log(LOG_PREFIX, 'Button already updated with this model');
      return;
    }

    // Store original content if not already stored
    if (!button.dataset.originalContent) {
      button.dataset.originalContent = button.innerHTML;
      console.log(LOG_PREFIX, 'Stored original content:', button.innerHTML.substring(0, 100));
    }

    // Update button to show model name
    console.log(LOG_PREFIX, '✅ Updating button to show:', modelName);
    button.innerHTML = `<span style="font-size: 12px; font-weight: 500;">${modelName}</span>`;
    button.dataset.modelDisplayUpdated = 'true';
    button.dataset.currentModel = modelName;

    // Adjust button styling to accommodate text
    button.style.minWidth = 'auto';
    button.style.paddingLeft = '8px';
    button.style.paddingRight = '8px';
  }

  // Main function to find and update the model display
  function updateModelSelector() {
    console.log(LOG_PREFIX, '🔄 updateModelSelector called');
    const button = findModelSelectorButton();
    const model = getSelectedModel();

    console.log(LOG_PREFIX, 'Results:', { buttonFound: !!button, model });

    if (button && model) {
      updateModelDisplay(button, model);
    }
  }

  // Watch for dropdown opening to detect model selection
  function watchForModelDropdown() {
    console.log(LOG_PREFIX, '👀 Setting up MutationObserver...');

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if a dropdown/menu appeared
          const addedNodes = Array.from(mutation.addedNodes);
          for (const node of addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Log significant DOM additions
              if (node.querySelector?.('[role="menu"], [role="listbox"], [role="dialog"]') ||
                  node.matches?.('[role="menu"], [role="listbox"], [role="dialog"]')) {
                console.log(LOG_PREFIX, '🆕 Dropdown/menu detected:', {
                  tagName: node.tagName,
                  className: node.className,
                  role: node.getAttribute('role'),
                  innerHTML: node.innerHTML.substring(0, 500)
                });
              }

              // If a dropdown with model options appeared, watch for selection
              const isDropdown = node.matches?.('[role="menu"], [role="listbox"], [role="dialog"]') ||
                                node.querySelector?.('[role="menu"], [role="listbox"]');
              if (isDropdown) {
                console.log(LOG_PREFIX, '📋 Dropdown appeared, checking for model...');

                // Delay to let the dropdown fully render
                setTimeout(() => {
                  const model = getSelectedModel();
                  if (model) {
                    const button = findModelSelectorButton();
                    updateModelDisplay(button, model);
                  }
                }, 100);

                // Watch for clicks within the dropdown
                node.addEventListener('click', () => {
                  console.log(LOG_PREFIX, '🖱️ Click in dropdown detected');
                  setTimeout(updateModelSelector, 200);
                });
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log(LOG_PREFIX, '✅ MutationObserver active');
    return observer;
  }

  // Alternative: Find model by looking at specific Claude UI patterns
  function findModelFromClaudeUI() {
    console.log(LOG_PREFIX, '🔍 findModelFromClaudeUI called');

    // Look for the model selector region
    const selectors = [
      '[aria-label*="model" i]',
      '[aria-label*="Model" i]',
      '[data-testid*="model" i]',
      'button:has(svg):has(+ [role="menu"])',
    ];

    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        console.log(LOG_PREFIX, `Selector "${selector}": found ${elements.length} elements`);

        for (const element of elements) {
          const text = element.textContent.toLowerCase();
          console.log(LOG_PREFIX, 'Element text:', text.substring(0, 100));
          for (const [key, name] of Object.entries(MODEL_NAMES)) {
            if (text.includes(key)) {
              console.log(LOG_PREFIX, '✅ Found model from Claude UI:', name);
              return { element, model: name };
            }
          }
        }
      } catch (e) {
        console.log(LOG_PREFIX, `Selector "${selector}" error:`, e.message);
      }
    }

    console.log(LOG_PREFIX, '❌ No model found from Claude UI patterns');
    return null;
  }

  // Dump all interesting elements for debugging
  function dumpPageStructure() {
    console.log(LOG_PREFIX, '📊 === PAGE STRUCTURE DUMP ===');

    // All buttons
    const buttons = document.querySelectorAll('button');
    console.log(LOG_PREFIX, `Total buttons: ${buttons.length}`);
    buttons.forEach((btn, i) => {
      if (btn.textContent.trim().length < 20) {
        console.log(LOG_PREFIX, `Button ${i}:`, {
          text: btn.textContent.trim(),
          ariaLabel: btn.getAttribute('aria-label'),
          className: btn.className.substring(0, 100)
        });
      }
    });

    // Elements with "model" in attributes
    const modelElements = document.querySelectorAll('[class*="model"], [data-testid*="model"], [aria-label*="model"]');
    console.log(LOG_PREFIX, `Elements with "model": ${modelElements.length}`);
    modelElements.forEach((el, i) => {
      console.log(LOG_PREFIX, `Model element ${i}:`, {
        tagName: el.tagName,
        text: el.textContent.substring(0, 50),
        className: el.className.substring(0, 100)
      });
    });

    // Menu/dropdown related elements
    const menuElements = document.querySelectorAll('[role="menu"], [role="menuitem"], [role="listbox"], [role="option"]');
    console.log(LOG_PREFIX, `Menu elements: ${menuElements.length}`);

    console.log(LOG_PREFIX, '📊 === END DUMP ===');
  }

  // Scan the page for model information and update display
  function scanAndUpdate() {
    console.log(LOG_PREFIX, '🔄 scanAndUpdate called');

    // First try to get model from the UI
    const uiModel = findModelFromClaudeUI();
    if (uiModel) {
      updateModelDisplay(uiModel.element, uiModel.model);
      return;
    }

    // Otherwise try the general approach
    updateModelSelector();
  }

  // Initialize
  function init() {
    console.log(LOG_PREFIX, '🎬 Initializing...');

    // Dump page structure for debugging
    dumpPageStructure();

    // Initial scan
    scanAndUpdate();

    // Watch for DOM changes
    watchForModelDropdown();

    // Periodic check as fallback
    setInterval(() => {
      console.log(LOG_PREFIX, '⏰ Periodic scan...');
      scanAndUpdate();
    }, 5000);

    console.log(LOG_PREFIX, '✅ Initialization complete');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    console.log(LOG_PREFIX, 'Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log(LOG_PREFIX, 'DOM already ready, initializing now');
    init();
  }
})();
