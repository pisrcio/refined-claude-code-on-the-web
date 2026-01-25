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
    const taskItem = button.closest('[data-testid]') || button.closest('div[class*="flex"]');

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

  // Find and process task items with delete buttons
  function processTaskItems() {
    // Look for button containers that contain delete buttons (trash icon)
    // The delete button typically has a trash/delete icon
    const allButtons = document.querySelectorAll('button');

    allButtons.forEach(button => {
      // Check if this is a delete button by looking for trash icon SVG or aria-label
      const isDeleteButton =
        button.querySelector('svg path[d*="M19"]') || // Common trash icon path
        button.getAttribute('aria-label')?.toLowerCase().includes('delete') ||
        button.title?.toLowerCase().includes('delete') ||
        button.innerHTML.includes('M19 7l-.867 12.142') || // Trash icon path
        (button.querySelector('svg') && button.closest('div')?.querySelectorAll('button').length >= 1);

      if (!isDeleteButton) return;

      // Find the parent container that holds the action buttons
      const buttonContainer = button.parentElement;
      if (!buttonContainer || buttonContainer.hasAttribute(PROCESSED_MARKER)) return;

      // Check if there's already a blocked button
      if (buttonContainer.querySelector('.bcotw-blocked-btn')) return;

      // Mark as processed
      buttonContainer.setAttribute(PROCESSED_MARKER, 'true');

      // Create and insert the blocked button before the delete button
      const blockedButton = createBlockedButton();
      button.parentElement.insertBefore(blockedButton, button);

      // Check if this task was previously blocked
      const taskItem = button.closest('[data-testid]') || button.closest('div[class*="flex"]');
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
