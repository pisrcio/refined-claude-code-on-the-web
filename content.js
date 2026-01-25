// Better Claude Code on the Web - Content Script
// Adds a "blocked" button to task items in the Claude web interface

(function() {
  'use strict';

  // SVG icon for the blocked/pause button
  const BLOCKED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>`;

  // Check if we've already processed a button container
  const PROCESSED_MARKER = 'bcotw-processed';

  // Create the blocked button element
  function createBlockedButton() {
    const button = document.createElement('button');
    button.className = 'bcotw-blocked-btn';
    button.innerHTML = BLOCKED_ICON;
    button.title = 'Mark as blocked';
    button.setAttribute('aria-label', 'Mark task as blocked');

    button.addEventListener('click', handleBlockedClick);

    return button;
  }

  // Handle click on the blocked button
  function handleBlockedClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const taskItem = findSessionItem(button);

    if (taskItem) {
      // Toggle blocked state
      const isBlocked = taskItem.classList.toggle('bcotw-blocked');
      button.classList.toggle('bcotw-blocked-active', isBlocked);
      button.title = isBlocked ? 'Unblock task' : 'Mark as blocked';

      // Store blocked state in localStorage
      const taskId = getTaskId(taskItem);
      if (taskId) {
        const blockedTasks = getBlockedTasks();
        if (isBlocked) {
          blockedTasks[taskId] = true;
        } else {
          delete blockedTasks[taskId];
        }
        localStorage.setItem('bcotw-blocked-tasks', JSON.stringify(blockedTasks));
      }
    }
  }

  // Get task ID from element
  function getTaskId(taskItem) {
    // Try to get a unique identifier for the task
    const textContent = taskItem.textContent;
    if (textContent) {
      // Create a simple hash from the task text
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
    // Look for delete buttons specifically within session list items
    // Session items have a specific structure with title, metadata, and action buttons
    const allButtons = document.querySelectorAll('button');

    allButtons.forEach(button => {
      // Skip if already processed
      if (button.hasAttribute(PROCESSED_MARKER)) return;

      // Check if this button contains a trash/delete icon (SVG with specific path)
      const svg = button.querySelector('svg');
      if (!svg) return;

      // Look for trash icon characteristics
      const svgContent = svg.innerHTML || '';
      const isTrashIcon =
        svgContent.includes('M19 7') || // Common trash icon path start
        svgContent.includes('polyline points="3 6 5 6 21 6"') || // Another trash variant
        button.getAttribute('aria-label')?.toLowerCase().includes('delete');

      if (!isTrashIcon) return;

      // Verify this is within a session/task list item by checking for sibling structure
      // Session items typically have: text content + timestamp + buttons
      const parent = button.parentElement;
      if (!parent) return;

      // Check if this is in a list-like context with multiple items
      const grandparent = parent.parentElement;
      if (!grandparent) return;

      // The button container should have exactly 2 buttons (copy and delete)
      // or we should be adding to make it 3 (blocked, copy, delete)
      const siblingButtons = parent.querySelectorAll('button:not(.bcotw-blocked-btn)');
      if (siblingButtons.length > 3) return; // Too many buttons, probably not a session item

      // Check if there's already a blocked button in this container
      if (parent.querySelector('.bcotw-blocked-btn')) return;

      // Mark button as processed
      button.setAttribute(PROCESSED_MARKER, 'true');

      // Create and insert the blocked button before the delete button
      const blockedButton = createBlockedButton();
      parent.insertBefore(blockedButton, button);

      // Check if this task was previously blocked
      const taskItem = findSessionItem(button);
      if (taskItem) {
        const taskId = getTaskId(taskItem);
        if (taskId && getBlockedTasks()[taskId]) {
          taskItem.classList.add('bcotw-blocked');
          blockedButton.classList.add('bcotw-blocked-active');
          blockedButton.title = 'Unblock task';
        }
      }
    });
  }

  // Find the parent session item element
  function findSessionItem(button) {
    let element = button.parentElement;
    // Walk up to find a reasonable container (but not too far)
    for (let i = 0; i < 5 && element; i++) {
      // Session items typically have clickable behavior and contain text + timestamp
      if (element.textContent && element.textContent.length > 20) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  // Set up MutationObserver to watch for new task items
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }

      if (shouldProcess) {
        // Debounce processing
        clearTimeout(window.bcotwProcessTimeout);
        window.bcotwProcessTimeout = setTimeout(processTaskItems, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial processing
    processTaskItems();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }
})();
