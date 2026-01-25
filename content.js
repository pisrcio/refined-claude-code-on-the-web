// Better Claude Code on the Web - Show Actual Model Name
// This script replaces the "..." button with the actual selected model name
// Also enhances the copy branch button to copy full git command

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
  let buttonObserver = null;

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

    // Method 1 (PRIMARY): Check localStorage for 'ccr-sticky-model-selector' key
    // This is the ACTUAL selected model for the current session
    try {
      const stickyModel = localStorage.getItem('ccr-sticky-model-selector');
      console.log(LOG_PREFIX, 'Method 1 - ccr-sticky-model-selector from localStorage:', stickyModel);
      if (stickyModel) {
        const parsed = parseModelId(stickyModel);
        if (parsed) {
          console.log(LOG_PREFIX, '✅ Found model via Method 1 (ccr-sticky-model-selector):', parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'localStorage error:', e);
    }

    // Method 2: Fallback to 'default-model' key (used when no sticky selection)
    try {
      const defaultModel = localStorage.getItem('default-model');
      console.log(LOG_PREFIX, 'Method 2 - default-model from localStorage:', defaultModel);
      if (defaultModel) {
        const parsed = parseModelId(defaultModel);
        if (parsed) {
          console.log(LOG_PREFIX, '✅ Found model via Method 2 (default-model):', parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'localStorage error:', e);
    }

    // Method 3: Look for a checked/selected item in a model dropdown
    const checkedItem = document.querySelector('[role="menuitemradio"][aria-checked="true"]');
    console.log(LOG_PREFIX, 'Method 3 - menuitemradio checked:', checkedItem?.textContent);
    if (checkedItem) {
      const modelText = checkedItem.textContent;
      for (const [key, name] of Object.entries(MODEL_NAMES)) {
        if (modelText.toLowerCase().includes(key)) {
          console.log(LOG_PREFIX, '✅ Found model via Method 3:', name);
          return name;
        }
      }
    }

    // Method 4: Look for checkmark icon next to model name in dropdown
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"]');
    console.log(LOG_PREFIX, `Method 4 - Found ${menuItems.length} menu items`);
    for (const item of menuItems) {
      // Check for SVG checkmark (the selected model has an SVG with a checkmark path)
      const svg = item.querySelector('svg');
      const hasCheck = svg !== null ||  // SVG presence often indicates selection
                       item.querySelector('[data-state="checked"]') ||
                       item.getAttribute('aria-checked') === 'true' ||
                       item.getAttribute('data-state') === 'checked';

      if (hasCheck && svg) {
        const text = item.textContent.toLowerCase();
        for (const [key, name] of Object.entries(MODEL_NAMES)) {
          if (text.includes(key)) {
            console.log(LOG_PREFIX, '✅ Found model via Method 4 (checkmark):', name);
            return name;
          }
        }
      }
    }

    // Method 5: Check other localStorage keys
    try {
      console.log(LOG_PREFIX, 'Method 5 - Checking other localStorage keys...');
      const stored = localStorage.getItem('selectedModel') || localStorage.getItem('model');
      if (stored) {
        const parsed = parseModelId(stored);
        if (parsed) {
          console.log(LOG_PREFIX, '✅ Found model via Method 5:', parsed);
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

    // Check if button already shows the correct model name
    const currentText = button.textContent.trim();
    if (currentText === modelName) {
      console.log(LOG_PREFIX, 'Button already shows correct model');
      return;
    }

    // Update button to show model name
    console.log(LOG_PREFIX, '✅ Updating button to show:', modelName);
    button.innerHTML = `<span style="font-size: 12px; font-weight: 500;">${modelName}</span>`;

    // Adjust button styling to accommodate text
    button.style.minWidth = 'auto';
    button.style.paddingLeft = '8px';
    button.style.paddingRight = '8px';

    // Watch this button for React re-renders
    watchButtonForChanges(button, modelName);
  }

  // Watch the button element for changes (React re-renders)
  function watchButtonForChanges(button, modelName) {
    // Disconnect previous observer if any
    if (buttonObserver) {
      buttonObserver.disconnect();
    }

    buttonObserver = new MutationObserver((mutations) => {
      const currentText = button.textContent.trim();
      // If React re-rendered and reverted our changes, re-apply
      if (currentText !== modelName && currentText !== lastKnownModel) {
        console.log(LOG_PREFIX, `🔄 Button content changed to "${currentText}", re-applying model name`);
        // Get the current model from localStorage (it might have changed)
        const currentModel = parseModelId(localStorage.getItem('default-model'), true);
        if (currentModel) {
          button.innerHTML = `<span style="font-size: 12px; font-weight: 500;">${currentModel}</span>`;
          button.style.minWidth = 'auto';
          button.style.paddingLeft = '8px';
          button.style.paddingRight = '8px';
        }
      }
    });

    buttonObserver.observe(button, {
      childList: true,
      subtree: true,
      characterData: true
    });

    console.log(LOG_PREFIX, '👀 Watching button for React re-renders');
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

  // Watch for dropdown opening/closing to detect model selection
  function watchForModelDropdown() {
    console.log(LOG_PREFIX, '👀 Setting up MutationObserver...');

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Watch for attribute changes on menu elements (data-open, aria-hidden, etc.)
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.matches?.('[role="menu"]') || target.closest?.('[role="menu"]')) {
            console.log(LOG_PREFIX, `📋 Menu attribute changed: ${mutation.attributeName}`);
            // Schedule updates after menu closes
            setTimeout(updateModelSelector, 100);
            setTimeout(updateModelSelector, 300);
            setTimeout(updateModelSelector, 500);
          }
        }

        // Watch for dropdown being removed (closed) - this is when React re-renders
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          for (const node of mutation.removedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const wasDropdown = node.matches?.('[role="menu"], [role="listbox"], [role="dialog"]') ||
                                  node.querySelector?.('[role="menu"], [role="listbox"]');
              if (wasDropdown) {
                console.log(LOG_PREFIX, '📋 Dropdown removed from DOM, updating model display...');
                // Multiple updates to catch React re-renders
                setTimeout(updateModelSelector, 50);
                setTimeout(updateModelSelector, 150);
                setTimeout(updateModelSelector, 300);
                setTimeout(updateModelSelector, 500);
              }
            }
          }
        }

        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if a dropdown/menu appeared
          const addedNodes = Array.from(mutation.addedNodes);
          for (const node of addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // If a dropdown with model options appeared, watch for selection
              const isDropdown = node.matches?.('[role="menu"], [role="listbox"], [role="dialog"]') ||
                                node.querySelector?.('[role="menu"], [role="listbox"]');
              if (isDropdown) {
                console.log(LOG_PREFIX, '📋 Dropdown added to DOM');

                // Watch for clicks within the dropdown
                node.addEventListener('click', () => {
                  console.log(LOG_PREFIX, '🖱️ Click in dropdown detected (event listener)');
                  // Multiple updates to catch React re-renders after selection
                  setTimeout(updateModelSelector, 100);
                  setTimeout(updateModelSelector, 200);
                  setTimeout(updateModelSelector, 400);
                  setTimeout(updateModelSelector, 800);
                });
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-open', 'data-state', 'aria-hidden', 'hidden', 'style']
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

      // Check if model was changed - watch both keys
      if (key === 'ccr-sticky-model-selector' || key === 'default-model') {
        console.log(LOG_PREFIX, `🔄 localStorage ${key} changed to:`, value);
        const newModel = parseModelId(value);
        if (newModel && newModel !== lastKnownModel) {
          console.log(LOG_PREFIX, '✅ Model changed! Updating display...');
          lastKnownModel = newModel;
          setTimeout(updateModelSelector, 100);
          setTimeout(updateModelSelector, 300);
          setTimeout(updateModelSelector, 500);
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

      // Check if clicked inside a menu (the model dropdown)
      const menuContainer = target.closest('[role="menu"]');
      if (menuContainer) {
        console.log(LOG_PREFIX, '🖱️ Click detected inside [role="menu"]');

        // Check if we clicked on or inside a menuitem
        const menuItem = target.closest('[role="menuitem"]');
        if (menuItem) {
          const text = menuItem.textContent.toLowerCase();
          console.log(LOG_PREFIX, '🖱️ Clicked menuitem with text:', text.substring(0, 50));

          for (const key of Object.keys(MODEL_NAMES)) {
            if (text.includes(key)) {
              console.log(LOG_PREFIX, `🖱️ Clicked on model: "${key}"`);
              // Multiple delayed updates to catch React re-renders
              setTimeout(updateModelSelector, 100);
              setTimeout(updateModelSelector, 200);
              setTimeout(updateModelSelector, 400);
              setTimeout(updateModelSelector, 800);
              break;
            }
          }
        }
      }

      // Also check for clicks on .font-ui elements (where model names are displayed)
      const fontUiElement = target.closest('.font-ui');
      if (fontUiElement) {
        const text = fontUiElement.textContent.toLowerCase();
        for (const key of Object.keys(MODEL_NAMES)) {
          if (text.includes(key)) {
            console.log(LOG_PREFIX, `🖱️ Clicked on .font-ui with model: "${key}"`);
            setTimeout(updateModelSelector, 100);
            setTimeout(updateModelSelector, 200);
            setTimeout(updateModelSelector, 400);
            setTimeout(updateModelSelector, 800);
            break;
          }
        }
      }
    }, true);

    console.log(LOG_PREFIX, '✅ Click watcher active');
  }

  // Poll localStorage for changes AND ensure button shows correct model
  function pollForModelChanges() {
    console.log(LOG_PREFIX, '👀 Setting up model change polling...');

    setInterval(() => {
      try {
        // Check ccr-sticky-model-selector first (per-session), then fall back to default-model
        const stickyModel = localStorage.getItem('ccr-sticky-model-selector');
        const defaultModel = localStorage.getItem('default-model');
        const currentModelId = stickyModel || defaultModel;
        const parsedModel = parseModelId(currentModelId, true); // quiet mode

        if (parsedModel) {
          // Check if model changed
          if (parsedModel !== lastKnownModel) {
            console.log(LOG_PREFIX, `🔄 Model changed from "${lastKnownModel}" to "${parsedModel}"`);
            lastKnownModel = parsedModel;
            updateModelSelector();
          } else {
            // Even if model didn't change, ensure button shows it (React might have re-rendered)
            const button = document.querySelector('button[aria-label="More options"]');
            if (button && button.textContent.trim() !== parsedModel) {
              console.log(LOG_PREFIX, `🔄 Button shows wrong text, fixing...`);
              updateModelDisplay(button, parsedModel);
            }
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }, 250); // Check every 250ms for more responsive updates

    console.log(LOG_PREFIX, '✅ Model change polling active');
  }

  // Add "Better" label next to Claude Code link
  function addBetterLabel() {
    console.log(LOG_PREFIX, '🏷️ addBetterLabel() called');

    // Find the anchor element that links to /code (the Claude Code header link)
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

    // Check if we already added the Better label
    const parent = claudeCodeLink.parentElement;
    if (parent?.querySelector('.better-label')) {
      console.log(LOG_PREFIX, 'Better label already exists in parent, skipping');
      return true;
    }
    if (claudeCodeLink.nextElementSibling?.classList?.contains('better-label')) {
      console.log(LOG_PREFIX, 'Better label already exists as sibling, skipping');
      return true;
    }

    // Create the Better label element
    const betterLabel = document.createElement('span');
    betterLabel.textContent = 'Better';
    betterLabel.className = 'better-label';

    // Style to match the Research preview label appearance
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

    // Insert after the Claude Code link
    console.log(LOG_PREFIX, 'Inserting Better label');
    claudeCodeLink.parentNode.insertBefore(betterLabel, claudeCodeLink.nextSibling);
    console.log(LOG_PREFIX, '✅ Better label inserted successfully');

    return true;
  }

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

    console.log(LOG_PREFIX, '✅ Pull Branch in CLI button watcher active');
    return observer;
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

    // Add Better label
    addBetterLabel();

    // Also try after a delay in case content loads late
    setTimeout(() => {
      console.log(LOG_PREFIX, 'Delayed Better label check (1s)');
      addBetterLabel();
    }, 1000);

    // Watch for copy branch button clicks
    watchForCopyBranchButton();

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
