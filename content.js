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

  // Track the last known model to detect changes
  let lastKnownModel = null;

  // Parse model ID from localStorage format (e.g., "claude-opus-4-5-20251101" -> "Opus 4.5")
  function parseModelId(modelId, quiet = false) {
    if (!modelId) return null;
    const modelIdLower = modelId.toLowerCase();
    for (const [key, name] of Object.entries(MODEL_NAMES)) {
      if (modelIdLower.includes(key)) {
        if (!quiet) {
          console.log(LOG_PREFIX, `✅ Parsed model ID "${modelId}" -> "${name}"`);
        }
        return name;
      }
    }
    if (!quiet) {
      console.log(LOG_PREFIX, `❌ Could not parse model ID: ${modelId}`);
    }
    return null;
  }

  // Find the model selector button (the "..." button with aria-label "More options")
  function findModelSelectorButton() {
    console.log(LOG_PREFIX, '🔍 Looking for model selector button...');

    // Primary method: Find by aria-label "More options" (this is the "..." button)
    const moreOptionsButton = document.querySelector('button[aria-label="More options"]');
    if (moreOptionsButton) {
      console.log(LOG_PREFIX, '✅ Found "More options" button by aria-label!', {
        text: moreOptionsButton.textContent.trim(),
        className: moreOptionsButton.className
      });
      return moreOptionsButton;
    }

    // Fallback: Look for buttons that might be the model selector
    const buttons = document.querySelectorAll('button');
    console.log(LOG_PREFIX, `Found ${buttons.length} buttons on page`);

    for (const button of buttons) {
      const text = button.textContent.trim();
      const ariaLabel = button.getAttribute('aria-label');

      // Check for common model selector patterns
      if (ariaLabel && (ariaLabel.toLowerCase().includes('model') || ariaLabel.toLowerCase().includes('options'))) {
        console.log(LOG_PREFIX, '✅ Found button by aria-label pattern:', ariaLabel);
        return button;
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

    // Method 1 (PRIMARY): Check localStorage for 'default-model' key
    // This is where Claude Code stores the selected model (e.g., "claude-opus-4-5-20251101")
    try {
      const defaultModel = localStorage.getItem('default-model');
      console.log(LOG_PREFIX, 'Method 1 - default-model from localStorage:', defaultModel);
      if (defaultModel) {
        const parsed = parseModelId(defaultModel);
        if (parsed) {
          console.log(LOG_PREFIX, '✅ Found model via Method 1 (default-model):', parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'localStorage error:', e);
    }

    // Method 2: Look for a checked/selected item in a model dropdown
    const checkedItem = document.querySelector('[role="menuitemradio"][aria-checked="true"]');
    console.log(LOG_PREFIX, 'Method 2 - menuitemradio checked:', checkedItem?.textContent);
    if (checkedItem) {
      const modelText = checkedItem.textContent;
      for (const [key, name] of Object.entries(MODEL_NAMES)) {
        if (modelText.toLowerCase().includes(key)) {
          console.log(LOG_PREFIX, '✅ Found model via Method 2:', name);
          return name;
        }
      }
    }

    // Method 3: Look for checkmark icon next to model name
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"]');
    console.log(LOG_PREFIX, `Method 3 - Found ${menuItems.length} menu items`);
    for (const item of menuItems) {
      const hasCheck = item.querySelector('svg[data-state="checked"], .check-icon, [data-checked="true"]') ||
                       item.querySelector('svg')?.innerHTML.includes('check') ||
                       item.getAttribute('aria-checked') === 'true' ||
                       item.getAttribute('data-state') === 'checked';

      if (hasCheck) {
        const text = item.textContent.toLowerCase();
        for (const [key, name] of Object.entries(MODEL_NAMES)) {
          if (text.includes(key)) {
            console.log(LOG_PREFIX, '✅ Found model via Method 3:', name);
            return name;
          }
        }
      }
    }

    // Method 4: Check other localStorage keys
    try {
      console.log(LOG_PREFIX, 'Method 4 - Checking other localStorage keys...');
      const stored = localStorage.getItem('selectedModel') || localStorage.getItem('model');
      if (stored) {
        const parsed = parseModelId(stored);
        if (parsed) {
          console.log(LOG_PREFIX, '✅ Found model via Method 4:', parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'localStorage error:', e);
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

  // Watch for localStorage changes (intercept setItem)
  function watchLocalStorage() {
    console.log(LOG_PREFIX, '👀 Setting up localStorage watcher...');

    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      originalSetItem(key, value);

      // Check if model was changed
      if (key === 'default-model') {
        console.log(LOG_PREFIX, '🔄 localStorage default-model changed to:', value);
        const newModel = parseModelId(value);
        if (newModel && newModel !== lastKnownModel) {
          console.log(LOG_PREFIX, '✅ Model changed! Updating display...');
          lastKnownModel = newModel;
          setTimeout(updateModelSelector, 100);
        }
      }
    };

    console.log(LOG_PREFIX, '✅ localStorage watcher active');
  }

  // Watch for clicks on model menu items
  function watchForModelClicks() {
    console.log(LOG_PREFIX, '👀 Setting up click watcher for model selection...');

    document.addEventListener('click', (event) => {
      const target = event.target;

      // Check if clicked element or its parents contain model-related text
      const clickedElement = target.closest('[role="menuitem"], [role="menuitemradio"], [role="option"], [data-testid*="model"]');
      if (clickedElement) {
        const text = clickedElement.textContent.toLowerCase();
        for (const key of Object.keys(MODEL_NAMES)) {
          if (text.includes(key)) {
            console.log(LOG_PREFIX, `🖱️ Clicked on model option containing "${key}"`);
            // Wait for the selection to be processed
            setTimeout(updateModelSelector, 300);
            setTimeout(updateModelSelector, 500);
            break;
          }
        }
      }
    }, true);

    console.log(LOG_PREFIX, '✅ Click watcher active');
  }

  // Poll localStorage for changes (fallback for /model command)
  function pollForModelChanges() {
    console.log(LOG_PREFIX, '👀 Setting up model change polling...');

    setInterval(() => {
      try {
        const currentModel = localStorage.getItem('default-model');
        const parsedModel = parseModelId(currentModel, true); // quiet mode

        if (parsedModel && parsedModel !== lastKnownModel) {
          console.log(LOG_PREFIX, `🔄 Model changed from "${lastKnownModel}" to "${parsedModel}"`);
          lastKnownModel = parsedModel;
          updateModelSelector();
        }
      } catch (e) {
        // Ignore errors
      }
    }, 500); // Check every 500ms for responsive updates

    console.log(LOG_PREFIX, '✅ Model change polling active');
  }

  // Initialize
  function init() {
    console.log(LOG_PREFIX, '🎬 Initializing...');

    // Dump page structure for debugging
    dumpPageStructure();

    // Set up watchers
    watchLocalStorage();
    watchForModelClicks();
    pollForModelChanges();

    // Initial scan
    scanAndUpdate();

    // Watch for DOM changes
    watchForModelDropdown();

    // Store initial model
    lastKnownModel = getSelectedModel();
    console.log(LOG_PREFIX, 'Initial model:', lastKnownModel);

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
