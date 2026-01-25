// Better Claude Code on the Web - Show Actual Model Name
// This script replaces the "..." button with the actual selected model name

(function() {
  'use strict';

  const MODEL_NAMES = {
    'opus': 'Opus 4.5',
    'sonnet': 'Sonnet 4.5',
    'haiku': 'Haiku 4.5'
  };

  // Find the model selector button (the "..." button)
  function findModelSelectorButton() {
    // Look for buttons that might be the model selector
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      // The "..." button typically contains just an ellipsis or three dots icon
      const text = button.textContent.trim();
      if (text === '...' || text === '\u2026' || text === '\u22EF') {
        return button;
      }
      // Also check for SVG with three dots pattern
      const svg = button.querySelector('svg');
      if (svg && button.closest('[data-testid]')?.dataset.testid?.includes('model')) {
        return button;
      }
    }
    return null;
  }

  // Get the currently selected model from the dropdown or page state
  function getSelectedModel() {
    // Method 1: Look for a checked/selected item in a model dropdown
    const checkedItem = document.querySelector('[role="menuitemradio"][aria-checked="true"]');
    if (checkedItem) {
      const modelText = checkedItem.textContent;
      for (const [key, name] of Object.entries(MODEL_NAMES)) {
        if (modelText.toLowerCase().includes(key)) {
          return name;
        }
      }
    }

    // Method 2: Look for checkmark icon next to model name
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"]');
    for (const item of menuItems) {
      // Check if this item has a checkmark (SVG with check path or specific class)
      const hasCheck = item.querySelector('svg[data-state="checked"], .check-icon, [data-checked="true"]') ||
                       item.querySelector('svg')?.innerHTML.includes('check') ||
                       item.getAttribute('aria-checked') === 'true' ||
                       item.getAttribute('data-state') === 'checked';
      if (hasCheck) {
        const text = item.textContent.toLowerCase();
        for (const [key, name] of Object.entries(MODEL_NAMES)) {
          if (text.includes(key)) {
            return name;
          }
        }
      }
    }

    // Method 3: Look for model indicator in the UI
    const modelIndicators = document.querySelectorAll('[class*="model"], [data-model]');
    for (const indicator of modelIndicators) {
      const text = indicator.textContent.toLowerCase();
      for (const [key, name] of Object.entries(MODEL_NAMES)) {
        if (text.includes(key)) {
          return name;
        }
      }
    }

    // Method 4: Check page URL or local storage for model preference
    try {
      const stored = localStorage.getItem('selectedModel') || localStorage.getItem('model');
      if (stored) {
        const storedLower = stored.toLowerCase();
        for (const [key, name] of Object.entries(MODEL_NAMES)) {
          if (storedLower.includes(key)) {
            return name;
          }
        }
      }
    } catch (e) {
      // localStorage might not be accessible
    }

    return null;
  }

  // Create or update the model display
  function updateModelDisplay(button, modelName) {
    if (!button || !modelName) return;

    // Check if we've already modified this button
    if (button.dataset.modelDisplayUpdated === 'true' &&
        button.dataset.currentModel === modelName) {
      return;
    }

    // Store original content if not already stored
    if (!button.dataset.originalContent) {
      button.dataset.originalContent = button.innerHTML;
    }

    // Update button to show model name
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
    const button = findModelSelectorButton();
    const model = getSelectedModel();

    if (button && model) {
      updateModelDisplay(button, model);
    }
  }

  // Watch for dropdown opening to detect model selection
  function watchForModelDropdown() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Check if a dropdown/menu appeared
          const addedNodes = Array.from(mutation.addedNodes);
          for (const node of addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // If a dropdown with model options appeared, watch for selection
              const isDropdown = node.matches?.('[role="menu"], [role="listbox"], [role="dialog"]') ||
                                node.querySelector?.('[role="menu"], [role="listbox"]');
              if (isDropdown) {
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

    return observer;
  }

  // Alternative: Find model by looking at specific Claude UI patterns
  function findModelFromClaudeUI() {
    // Look for the model selector region
    const selectors = [
      // Various possible selectors for the Claude UI
      '[aria-label*="model" i]',
      '[aria-label*="Model" i]',
      '[data-testid*="model" i]',
      'button:has(svg):has(+ [role="menu"])',
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.toLowerCase();
          for (const [key, name] of Object.entries(MODEL_NAMES)) {
            if (text.includes(key)) {
              return { element, model: name };
            }
          }
        }
      } catch (e) {
        // Selector might be invalid
      }
    }
    return null;
  }

  // Scan the page for model information and update display
  function scanAndUpdate() {
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
    // Initial scan
    scanAndUpdate();

    // Watch for DOM changes
    watchForModelDropdown();

    // Periodic check as fallback
    setInterval(scanAndUpdate, 2000);
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
