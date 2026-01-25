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

  // Find and process session items with delete buttons
  function processTaskItems() {
    logGroup('Processing task items');

    const allButtons = document.querySelectorAll('button');
    log('Total buttons found on page:', allButtons.length);

    let processedCount = 0;
    let skippedAlreadyProcessed = 0;
    let skippedNoSvg = 0;
    let skippedNotTrash = 0;
    let addedButtons = 0;

    allButtons.forEach((button, index) => {
      // Skip if already processed
      if (button.hasAttribute(PROCESSED_MARKER)) {
        skippedAlreadyProcessed++;
        return;
      }

      // Check if this button contains an SVG
      const svg = button.querySelector('svg');
      if (!svg) {
        skippedNoSvg++;
        return;
      }

      // Log every button with SVG for debugging
      const svgContent = svg.outerHTML;
      const buttonParent = button.parentElement;
      const siblingButtons = buttonParent ? buttonParent.querySelectorAll('button') : [];

      logGroup(`Button #${index} analysis`);
      log('Button element:', button);
      log('Button classes:', button.className);
      log('Button aria-label:', button.getAttribute('aria-label'));
      log('Button title:', button.title);
      log('SVG content preview:', svgContent.substring(0, 200));
      log('Parent element:', buttonParent);
      log('Parent tag:', buttonParent?.tagName);
      log('Parent classes:', buttonParent?.className);
      log('Sibling buttons count:', siblingButtons.length);

      // Check for trash icon - look for common patterns
      const svgLower = svgContent.toLowerCase();
      const hasTrashPath =
        svgLower.includes('m19') ||
        svgLower.includes('polyline') ||
        svgLower.includes('trash') ||
        svgLower.includes('delete');

      const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
      const title = (button.title || '').toLowerCase();
      const isDeleteByAttr = ariaLabel.includes('delete') || title.includes('delete');

      log('Has trash-like SVG path:', hasTrashPath);
      log('Has delete in aria-label/title:', isDeleteByAttr);

      // More permissive: if there are exactly 2 sibling buttons, assume the last one is delete
      const isLastButton = siblingButtons.length === 2 && siblingButtons[1] === button;
      log('Is last of 2 buttons:', isLastButton);

      logGroupEnd();

      // Decide if this is a delete button
      const isDeleteButton = isDeleteByAttr || isLastButton;

      if (!isDeleteButton) {
        skippedNotTrash++;
        return;
      }

      processedCount++;
      log('>>> Found potential delete button #' + index);

      // Check parent
      const parent = button.parentElement;
      if (!parent) {
        log('No parent element, skipping');
        return;
      }

      // Check if there's already a blocked button
      if (parent.querySelector('.bcotw-blocked-btn')) {
        log('Blocked button already exists in parent, skipping');
        return;
      }

      // Mark as processed
      button.setAttribute(PROCESSED_MARKER, 'true');

      // Create and insert the blocked button
      const blockedButton = createBlockedButton();
      parent.insertBefore(blockedButton, button);
      addedButtons++;
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
    log('Skipped (already processed):', skippedAlreadyProcessed);
    log('Skipped (no SVG):', skippedNoSvg);
    log('Skipped (not trash icon):', skippedNotTrash);
    log('Processed as potential delete buttons:', processedCount);
    log('Blocked buttons added:', addedButtons);
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
