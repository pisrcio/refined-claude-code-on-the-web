// Better Claude Code on the Web - Mode Button
(function() {
  'use strict';

  let modeButton = null;
  let dropdown = null;
  let currentMode = 'Agent';

  function createModeButton() {
    // Create container
    const container = document.createElement('div');
    container.className = 'bcc-mode-container';

    // Create button
    modeButton = document.createElement('button');
    modeButton.className = 'bcc-mode-button';
    modeButton.type = 'button'; // Prevent form submission
    modeButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v10"></path>
        <path d="m4.22 4.22 4.24 4.24m7.08 7.08 4.24 4.24"></path>
        <path d="M1 12h6m6 0h10"></path>
        <path d="m4.22 19.78 4.24-4.24m7.08-7.08 4.24-4.24"></path>
      </svg>
      <span class="bcc-mode-label">${currentMode}</span>
      <svg class="bcc-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    `;
    modeButton.addEventListener('click', toggleDropdown);

    // Create dropdown
    dropdown = document.createElement('div');
    dropdown.className = 'bcc-mode-dropdown';
    dropdown.innerHTML = `
      <div class="bcc-mode-option" data-mode="Agent">
        <span class="bcc-check">&#10003;</span>
        <span>Agent</span>
      </div>
      <div class="bcc-mode-option" data-mode="Plan">
        <span class="bcc-check"></span>
        <span>Plan</span>
      </div>
    `;

    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectMode(option.dataset.mode);
      });
    });

    container.appendChild(modeButton);
    container.appendChild(dropdown);

    return container;
  }

  function toggleDropdown(e) {
    e.stopPropagation();
    dropdown.classList.toggle('bcc-show');

    // Close on outside click
    if (dropdown.classList.contains('bcc-show')) {
      setTimeout(() => {
        document.addEventListener('click', closeDropdown, { once: true });
      }, 0);
    }
  }

  function closeDropdown() {
    dropdown.classList.remove('bcc-show');
  }

  function selectMode(mode) {
    currentMode = mode;
    modeButton.querySelector('.bcc-mode-label').textContent = mode;

    // Update checkmarks
    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      const check = option.querySelector('.bcc-check');
      check.textContent = option.dataset.mode === mode ? '✓' : '';
    });

    closeDropdown();

    // Handle mode change
    if (mode === 'Plan') {
      addPlanPrefix();
    } else if (mode === 'Agent') {
      removePlanPrefix();
    }
  }

  function addPlanPrefix() {
    // Find the textarea/input field in Claude's interface
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');

    if (textField) {
      const prefix = 'use @agent-plan : ';

      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        // For textarea/input elements
        if (!textField.value.startsWith(prefix)) {
          textField.value = prefix + textField.value;
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          // Trigger input event for React
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        // For contenteditable divs
        const currentText = textField.innerText || textField.textContent || '';
        if (!currentText.startsWith(prefix)) {
          textField.focus();
          // Clear and set new content
          textField.innerText = prefix + currentText;
          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(textField);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
          // Trigger input event for React
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  }

  function removePlanPrefix() {
    // Find the textarea/input field in Claude's interface
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');

    if (textField) {
      const prefix = 'use @agent-plan : ';

      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        // For textarea/input elements
        if (textField.value.startsWith(prefix)) {
          textField.value = textField.value.slice(prefix.length);
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          // Trigger input event for React
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        // For contenteditable divs
        const currentText = textField.innerText || textField.textContent || '';
        if (currentText.startsWith(prefix)) {
          textField.focus();
          // Remove prefix from content
          textField.innerText = currentText.slice(prefix.length);
          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(textField);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
          // Trigger input event for React
          textField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  }

  function findAndInjectButton() {
    // Look for the attachment/picture button area in Claude's interface
    // Common selectors for the button area near the input
    const possibleContainers = [
      // Look for button groups near the input
      'form button[aria-label*="ttach"]',
      'form button[aria-label*="mage"]',
      'form button[aria-label*="ile"]',
      '[data-testid*="attach"]',
      '[data-testid*="upload"]',
      // Generic button near input
      'form > div button',
      '.flex button svg',
    ];

    // Try to find the button row/container
    let targetButton = null;
    for (const selector of possibleContainers) {
      targetButton = document.querySelector(selector);
      if (targetButton) break;
    }

    // If no specific button found, try to find the input container
    let insertionPoint = null;

    if (targetButton) {
      insertionPoint = targetButton.closest('div');
    } else {
      // Fallback: find the form or input area
      const form = document.querySelector('form');
      if (form) {
        // Look for button containers within the form
        const buttonContainers = form.querySelectorAll('button');
        if (buttonContainers.length > 0) {
          // Find the first button's parent
          insertionPoint = buttonContainers[0].parentElement;
        }
      }
    }

    // Check if we already injected
    if (document.querySelector('.bcc-mode-container')) {
      return;
    }

    if (insertionPoint) {
      const modeContainer = createModeButton();
      insertionPoint.insertBefore(modeContainer, insertionPoint.firstChild);
    } else {
      // Ultimate fallback: create a floating button
      const form = document.querySelector('form') || document.querySelector('[contenteditable="true"]')?.closest('div');
      if (form && !document.querySelector('.bcc-mode-container')) {
        const modeContainer = createModeButton();
        modeContainer.classList.add('bcc-floating');
        form.style.position = 'relative';
        form.insertBefore(modeContainer, form.firstChild);
      }
    }
  }

  // Initialize
  function init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(findAndInjectButton, 1000);
      });
    } else {
      setTimeout(findAndInjectButton, 1000);
    }

    // Watch for DOM changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      if (!document.querySelector('.bcc-mode-container')) {
        findAndInjectButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  init();
})();
