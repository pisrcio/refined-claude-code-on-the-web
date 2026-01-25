// Better Claude Code on the Web - Content Script
// Adds a "blocked" button to task items in the Claude web interface

(function() {
  'use strict';

  const LOG_PREFIX = '[BCOTW]';

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function logGroup(label) {
    console.group(LOG_PREFIX + ' ' + label);
  }

  function logGroupEnd() {
    console.groupEnd();
  }

  // SVG icon for the blocked button (exclamation mark in triangle)
  const BLOCKED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>`;

  // Check if we've already processed a button container
  const PROCESSED_MARKER = 'data-bcotw-processed';

  // Create the blocked button element
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

  // Handle click on the blocked button
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
        log('Saved blocked state to localStorage for task:', taskId);
      }
    }
  }

  // Get task ID from element
  function getTaskId(taskItem) {
    const textContent = taskItem.textContent;
    if (textContent) {
      return btoa(textContent.substring(0, 100)).replace(/[^a-zA-Z0-9]/g, '');
    }
    return null;
  }

  // Get blocked tasks from localStorage
  function getBlockedTasks() {
    try {
      return JSON.parse(localStorage.getItem('bcotw-blocked-tasks') || '{}');
    } catch {
      return {};
    }
  }

  // Check if an element is within a session list item
  // Session items have specific patterns: repo name, timestamp (pm/am or day names), optionally diff stats
  function isWithinSessionItem(element) {
    // Walk up the tree to find a potential session item container
    let current = element;
    for (let i = 0; i < 10 && current; i++) {
      const text = current.textContent || '';

      // Look for session item patterns:
      // - Timestamps like "9:40 pm", "Thu", "Wed", etc.
      // - Diff stats like "+376 -3"
      // - Should NOT be in the main input area (which has contenteditable or textarea)

      const hasTimestamp = /\d{1,2}:\d{2}\s*(am|pm)/i.test(text) ||
                          /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.test(text);
      const hasDiffStats = /\+\d+\s+-\d+/.test(text);
      const hasRepoPattern = text.includes('·'); // Session items use · as separator

      // Check if we're in an input area (avoid these)
      const isInputArea = current.querySelector('textarea, [contenteditable="true"]') ||
                         current.closest('textarea, [contenteditable="true"]');

      if (isInputArea) {
        log('Skipping - found input area ancestor');
        return false;
      }

      // Session items typically have timestamp and separator
      if (hasTimestamp && hasRepoPattern) {
        log('Found session item pattern in ancestor:', {
          hasTimestamp,
          hasDiffStats,
          hasRepoPattern,
          textPreview: text.substring(0, 100)
        });
        return true;
      }

      current = current.parentElement;
    }
    return false;
  }

  // Find and process session items with delete buttons
  function processTaskItems() {
    logGroup('Processing task items');

    const allButtons = document.querySelectorAll('button');
    log('Total buttons found on page:', allButtons.length);

    let stats = {
      alreadyProcessed: 0,
      noSvg: 0,
      notInSession: 0,
      notDeleteButton: 0,
      alreadyHasBlocked: 0,
      added: 0
    };

    allButtons.forEach((button, index) => {
      // Skip if already processed
      if (button.hasAttribute(PROCESSED_MARKER)) {
        stats.alreadyProcessed++;
        return;
      }

      // Check if this button contains an SVG (icon button)
      const svg = button.querySelector('svg');
      if (!svg) {
        stats.noSvg++;
        return;
      }

      // CRITICAL: First check if this button is within a session list item
      if (!isWithinSessionItem(button)) {
        stats.notInSession++;
        return;
      }

      const buttonParent = button.parentElement;
      const siblingButtons = buttonParent ? buttonParent.querySelectorAll('button:not(.bcotw-blocked-btn)') : [];

      logGroup(`Button #${index} analysis (in session item)`);
      log('Button element:', button);
      log('Button classes:', button.className);
      log('Sibling buttons count:', siblingButtons.length);

      // Within a session item, look for the delete button
      // It's typically the last button, or has delete in aria-label/title
      const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
      const title = (button.title || '').toLowerCase();
      const isDeleteByAttr = ariaLabel.includes('delete') || title.includes('delete');
      const isLastOfTwo = siblingButtons.length === 2 && siblingButtons[1] === button;

      log('Is delete by attr:', isDeleteByAttr);
      log('Is last of 2 buttons:', isLastOfTwo);
      logGroupEnd();

      const isDeleteButton = isDeleteByAttr || isLastOfTwo;

      if (!isDeleteButton) {
        stats.notDeleteButton++;
        return;
      }

      log('>>> Found delete button in session item #' + index);

      const parent = button.parentElement;
      if (!parent) {
        log('No parent element, skipping');
        return;
      }

      // Check if there's already a blocked button
      if (parent.querySelector('.bcotw-blocked-btn')) {
        stats.alreadyHasBlocked++;
        log('Blocked button already exists, skipping');
        return;
      }

      // Mark as processed
      button.setAttribute(PROCESSED_MARKER, 'true');

      // Create and insert the blocked button BEFORE the delete button
      const blockedButton = createBlockedButton();
      parent.insertBefore(blockedButton, button);
      stats.added++;
      log('>>> INSERTED blocked button before delete button');

      // Check if this task was previously blocked
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

    log('--- Summary ---');
    log('Stats:', stats);
    logGroupEnd();
  }

  // Find the parent session item element
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

  // Set up MutationObserver to watch for new task items
  function setupObserver() {
    log('Setting up MutationObserver');

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
        window.bcotwProcessTimeout = setTimeout(() => {
          log('DOM changed, reprocessing...');
          processTaskItems();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    log('MutationObserver started');
    log('Running initial processing...');
    processTaskItems();
  }

  // Initialize when DOM is ready
  log('Content script loaded');
  if (document.readyState === 'loading') {
    log('DOM still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    log('DOM ready, initializing immediately');
    setupObserver();
  }
})();
