// Better Claude Code on the Web - Content Script
// Features:
// 1. Blocked button for session items
// 2. Mode button (Agent/Plan)
// 3. Show actual model name
// 4. Better label

// IMMEDIATE LOG
console.log('🚀🚀🚀 [BetterClaude] SCRIPT FILE LOADED 🚀🚀🚀');
console.log('🚀🚀🚀 [BetterClaude] URL:', window.location.href, '🚀🚀🚀');

(function() {
  'use strict';

  const LOG_PREFIX = '[BetterClaude]';

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function logGroup(label) {
    console.group(LOG_PREFIX + ' ' + label);
  }

  function logGroupEnd() {
    console.groupEnd();
  }

  log('Content script loaded!');

  // ============================================
  // FEATURE 1: Blocked Button for Session Items
  // ============================================

  const BLOCKED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>`;

  const PROCESSED_MARKER = 'data-bcotw-processed';

  function createBlockedButton() {
    const button = document.createElement('button');
    button.className = 'bcotw-blocked-btn';
    button.innerHTML = BLOCKED_ICON;
    button.title = 'Mark as blocked';
    button.setAttribute('aria-label', 'Mark task as blocked');
    button.addEventListener('click', handleBlockedClick);
    log('Created blocked button element');
    return button;
  }

  function handleBlockedClick(event) {
    event.preventDefault();
    event.stopPropagation();
    log('Blocked button clicked');

    const button = event.currentTarget;
    const taskItem = findSessionItem(button);

    if (taskItem) {
      const isBlocked = taskItem.classList.toggle('bcotw-blocked');
      button.classList.toggle('bcotw-blocked-active', isBlocked);
      button.title = isBlocked ? 'Unblock task' : 'Mark as blocked';
      log('Task blocked state toggled:', isBlocked);

      const taskId = getTaskId(taskItem);
      if (taskId) {
        const blockedTasks = getBlockedTasks();
        if (isBlocked) {
          blockedTasks[taskId] = true;
        } else {
          delete blockedTasks[taskId];
        }
        localStorage.setItem('bcotw-blocked-tasks', JSON.stringify(blockedTasks));
        log('Saved blocked state to localStorage');
      }
    }
  }

  function getTaskId(taskItem) {
    const textContent = taskItem.textContent;
    if (textContent) {
      return btoa(textContent.substring(0, 100)).replace(/[^a-zA-Z0-9]/g, '');
    }
    return null;
  }

  function getBlockedTasks() {
    try {
      return JSON.parse(localStorage.getItem('bcotw-blocked-tasks') || '{}');
    } catch {
      return {};
    }
  }

  function isWithinSessionItem(element, buttonIndex) {
    log(`[Button #${buttonIndex}] isWithinSessionItem check started`);
    let current = element;
    for (let i = 0; i < 10 && current; i++) {
      const text = current.textContent || '';
      const textPreview = text.substring(0, 80).replace(/\n/g, ' ');

      const hasTimestamp = /\d{1,2}:\d{2}\s*(am|pm)/i.test(text) ||
                          /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.test(text);
      const hasRepoPattern = text.includes('·');

      const isInputArea = current.querySelector('textarea, [contenteditable="true"]') ||
                         current.closest('textarea, [contenteditable="true"]');

      log(`[Button #${buttonIndex}] Level ${i}: tag=${current.tagName}, hasTimestamp=${hasTimestamp}, hasRepoPattern=${hasRepoPattern}, isInputArea=${!!isInputArea}, text="${textPreview}..."`);

      if (isInputArea) {
        log(`[Button #${buttonIndex}] REJECTED: input area found`);
        return false;
      }

      if (hasTimestamp && hasRepoPattern) {
        log(`[Button #${buttonIndex}] ACCEPTED: found session item pattern`);
        return true;
      }

      current = current.parentElement;
    }
    log(`[Button #${buttonIndex}] REJECTED: no session item pattern found after 10 levels`);
    return false;
  }

  function processTaskItems() {
    logGroup('Processing task items');

    const allButtons = document.querySelectorAll('button');
    log('Total buttons found on page:', allButtons.length);

    log('=== LOGGING ALL BUTTONS WITH SVG ===');
    allButtons.forEach((button, index) => {
      const svg = button.querySelector('svg');
      if (svg) {
        const ariaLabel = button.getAttribute('aria-label') || '';
        const title = button.title || '';
        const className = button.className || '';
        const parentTag = button.parentElement?.tagName || 'none';
        const parentClass = button.parentElement?.className || '';
        const siblingCount = button.parentElement?.querySelectorAll('button').length || 0;

        log(`[SVG Button #${index}] aria="${ariaLabel}", title="${title}", class="${className}", parent=${parentTag}, parentClass="${parentClass}", siblings=${siblingCount}`);
      }
    });
    log('=== END ALL SVG BUTTONS ===');

    let stats = {
      alreadyProcessed: 0,
      noSvg: 0,
      notInSession: 0,
      notDeleteButton: 0,
      alreadyHasBlocked: 0,
      added: 0
    };

    allButtons.forEach((button, index) => {
      if (button.hasAttribute(PROCESSED_MARKER)) {
        stats.alreadyProcessed++;
        return;
      }

      const svg = button.querySelector('svg');
      if (!svg) {
        stats.noSvg++;
        return;
      }

      log(`[Button #${index}] Has SVG, checking if in session item...`);

      if (!isWithinSessionItem(button, index)) {
        stats.notInSession++;
        return;
      }

      const buttonParent = button.parentElement;
      const siblingButtons = buttonParent ? buttonParent.querySelectorAll('button:not(.bcotw-blocked-btn)') : [];

      const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
      const title = (button.title || '').toLowerCase();
      const isDeleteByAttr = ariaLabel.includes('delete') || title.includes('delete');
      const isLastOfTwo = siblingButtons.length === 2 && siblingButtons[1] === button;

      log(`[Button #${index}] In session! ariaLabel="${ariaLabel}", title="${title}", isDeleteByAttr=${isDeleteByAttr}, siblingCount=${siblingButtons.length}, isLastOfTwo=${isLastOfTwo}`);

      const isDeleteButton = isDeleteByAttr || isLastOfTwo;

      if (!isDeleteButton) {
        log(`[Button #${index}] NOT a delete button, skipping`);
        stats.notDeleteButton++;
        return;
      }

      log(`[Button #${index}] >>> IS DELETE BUTTON!`);

      const parent = button.parentElement;
      if (!parent) {
        log(`[Button #${index}] No parent, skipping`);
        return;
      }

      if (parent.querySelector('.bcotw-blocked-btn')) {
        log(`[Button #${index}] Already has blocked button, skipping`);
        stats.alreadyHasBlocked++;
        return;
      }

      button.setAttribute(PROCESSED_MARKER, 'true');

      const blockedButton = createBlockedButton();
      parent.insertBefore(blockedButton, button);
      stats.added++;
      log(`[Button #${index}] >>> INSERTED blocked button!`);

      const taskItem = findSessionItem(button);
      if (taskItem) {
        const taskId = getTaskId(taskItem);
        if (taskId && getBlockedTasks()[taskId]) {
          taskItem.classList.add('bcotw-blocked');
          blockedButton.classList.add('bcotw-blocked-active');
          blockedButton.title = 'Unblock task';
          log('Restored blocked state for task');
        }
      }
    });

    log('=== FINAL SUMMARY ===');
    log('Stats:', stats);
    logGroupEnd();
  }

  function findSessionItem(button) {
    let element = button.parentElement;
    for (let i = 0; i < 5 && element; i++) {
      if (element.textContent && element.textContent.length > 20) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  // ============================================
  // FEATURE 2: Mode Button (Agent/Plan)
  // ============================================

  let modeButton = null;
  let modeDropdown = null;
  let currentMode = 'Agent';

  function createModeButton() {
    log('createModeButton() called');

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
    modeButton.addEventListener('click', toggleModeDropdown);

    modeDropdown = document.createElement('div');
    modeDropdown.className = 'bcc-mode-dropdown';
    modeDropdown.style.cssText = 'position: absolute !important; bottom: calc(100% + 4px) !important; left: 0 !important; min-width: 120px !important; background: #ffffff !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important; opacity: 0 !important; visibility: hidden !important; transform: translateY(4px) !important; overflow: hidden !important;';
    modeDropdown.innerHTML = `
      <div class="bcc-mode-option" data-mode="Agent" style="display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; padding: 10px 12px !important; cursor: pointer !important; font-size: 13px !important;">
        <span class="bcc-check" style="display: inline-block !important; width: 16px !important; color: #10a37f !important; font-weight: bold !important;">&#10003;</span>
        <span>Agent</span>
      </div>
      <div class="bcc-mode-option" data-mode="Plan" style="display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; padding: 10px 12px !important; cursor: pointer !important; font-size: 13px !important;">
        <span class="bcc-check" style="display: inline-block !important; width: 16px !important; color: #10a37f !important; font-weight: bold !important;"></span>
        <span>Plan</span>
      </div>
    `;

    modeDropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectMode(option.dataset.mode);
      });
    });

    container.appendChild(modeButton);
    container.appendChild(modeDropdown);

    return container;
  }

  function toggleModeDropdown(e) {
    e.stopPropagation();
    e.preventDefault();
    const isVisible = modeDropdown.style.visibility === 'visible';

    if (isVisible) {
      closeModeDropdown();
    } else {
      modeDropdown.style.opacity = '1';
      modeDropdown.style.visibility = 'visible';
      modeDropdown.style.transform = 'translateY(0)';
      setTimeout(() => {
        document.addEventListener('click', closeModeDropdown, { once: true });
      }, 0);
    }
  }

  function closeModeDropdown() {
    modeDropdown.style.opacity = '0';
    modeDropdown.style.visibility = 'hidden';
    modeDropdown.style.transform = 'translateY(4px)';
  }

  function selectMode(mode) {
    log('selectMode:', mode);
    currentMode = mode;
    modeButton.querySelector('.bcc-mode-label').textContent = mode;

    modeDropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      const check = option.querySelector('.bcc-check');
      check.textContent = option.dataset.mode === mode ? '✓' : '';
    });

    closeModeDropdown();

    if (mode === 'Plan') {
      addPlanPrefix();
    } else if (mode === 'Agent') {
      removePlanPrefix();
    }
  }

  function addPlanPrefix() {
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea');
    if (textField) {
      const prefix = 'use @agent-plan : ';
      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        if (!textField.value.startsWith(prefix)) {
          textField.value = prefix + textField.value;
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        const currentText = textField.innerText || '';
        if (!currentText.startsWith(prefix)) {
          textField.innerText = prefix + currentText;
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  }

  function removePlanPrefix() {
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea');
    if (textField) {
      const prefix = 'use @agent-plan : ';
      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        if (textField.value.startsWith(prefix)) {
          textField.value = textField.value.slice(prefix.length);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        const currentText = textField.innerText || '';
        if (currentText.startsWith(prefix)) {
          textField.innerText = currentText.slice(prefix.length);
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  }

  function findAndInjectModeButton() {
    log('findAndInjectModeButton() called');

    if (document.querySelector('.bcc-mode-container')) {
      log('Mode button already exists');
      return;
    }

    const form = document.querySelector('form');
    if (form) {
      const buttons = form.querySelectorAll('button');
      if (buttons.length > 0) {
        const insertionPoint = buttons[0].parentElement;
        if (insertionPoint) {
          const modeContainer = createModeButton();
          insertionPoint.insertBefore(modeContainer, insertionPoint.firstChild);
          log('Mode button injected');
          return;
        }
      }
    }

    log('No injection point found for mode button');
  }

  // ============================================
  // FEATURE 3: Show Actual Model Name
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
        if (!quiet) log(`Parsed model ID "${modelId}" -> "${name}"`);
        return name;
      }
    }
    return null;
  }

  function findModelSelectorButton() {
    const moreOptionsButton = document.querySelector('button[aria-label="More options"]');
    if (moreOptionsButton) return moreOptionsButton;

    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const text = button.textContent.trim();
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

    return null;
  }

  function updateModelDisplay(button, modelName) {
    if (!button || !modelName) return;
    const currentText = button.textContent.trim();
    if (currentText === modelName) return;

    log('Updating button to show:', modelName);
    button.innerHTML = `<span style="font-size: 12px; font-weight: 500;">${modelName}</span>`;
    button.style.minWidth = 'auto';
    button.style.paddingLeft = '8px';
    button.style.paddingRight = '8px';

    watchModelButtonForChanges(button, modelName);
  }

  function watchModelButtonForChanges(button, modelName) {
    if (modelButtonObserver) modelButtonObserver.disconnect();

    modelButtonObserver = new MutationObserver(() => {
      const currentText = button.textContent.trim();
      if (currentText !== modelName && currentText !== lastKnownModel) {
        const currentModel = parseModelId(localStorage.getItem('default-model'), true);
        if (currentModel) {
          button.innerHTML = `<span style="font-size: 12px; font-weight: 500;">${currentModel}</span>`;
        }
      }
    });

    modelButtonObserver.observe(button, { childList: true, subtree: true, characterData: true });
  }

  function updateModelSelector() {
    const button = findModelSelectorButton();
    const model = getSelectedModel();
    if (button && model) updateModelDisplay(button, model);
  }

  function watchLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      originalSetItem(key, value);
      if (key === 'ccr-sticky-model-selector' || key === 'default-model') {
        log(`localStorage ${key} changed`);
        const newModel = parseModelId(value);
        if (newModel && newModel !== lastKnownModel) {
          lastKnownModel = newModel;
          setTimeout(updateModelSelector, 100);
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
  // FEATURE 4: Better Label
  // ============================================

  function addBetterLabel() {
    const claudeCodeLink = document.querySelector('a[href="/code"]');
    if (!claudeCodeLink) return false;

    const parent = claudeCodeLink.parentElement;
    if (parent?.querySelector('.better-label')) return true;
    if (claudeCodeLink.nextElementSibling?.classList?.contains('better-label')) return true;

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

    claudeCodeLink.parentNode.insertBefore(betterLabel, claudeCodeLink.nextSibling);
    log('Better label inserted');
    return true;
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function setupBlockedButtonObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }

      if (shouldProcess) {
        clearTimeout(window.bcotwProcessTimeout);
        window.bcotwProcessTimeout = setTimeout(processTaskItems, 100);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    log('Blocked button MutationObserver started');
    processTaskItems();
  }

  function init() {
    log('Initializing all features...');

    // Feature 1: Blocked button
    setupBlockedButtonObserver();

    // Feature 2: Mode button
    setTimeout(findAndInjectModeButton, 1000);

    // Feature 3: Model display
    watchLocalStorage();
    pollForModelChanges();
    updateModelSelector();
    lastKnownModel = getSelectedModel();

    // Feature 4: Better label
    addBetterLabel();
    setTimeout(addBetterLabel, 1000);

    // Watch for SPA navigation
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.bcc-mode-container')) {
        findAndInjectModeButton();
      }
      addBetterLabel();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    log('Initialization complete');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
