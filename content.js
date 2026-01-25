// Better Claude Code on the Web - Content Script
// Adds mode button and "Better" label

(function() {
  'use strict';

  console.log('[BCC] Script loaded');

  // ============================================
  // Mode Button Feature
  // ============================================

  let modeButton = null;
  let dropdown = null;
  let currentMode = 'Agent';

  function createModeButton() {
    console.log('[BCC] createModeButton() called');

    // Create container
    const container = document.createElement('div');
    container.className = 'bcc-mode-container';
    // Apply inline styles to override page CSS
    container.style.cssText = 'position: relative !important; display: inline-flex !important; flex-direction: row !important; align-items: center !important; margin-right: 8px !important; z-index: 1000 !important;';
    console.log('[BCC] Created container:', container);

    // Create button
    modeButton = document.createElement('button');
    modeButton.className = 'bcc-mode-button';
    modeButton.type = 'button'; // Prevent form submission
    // Apply inline styles to override page CSS
    modeButton.style.cssText = 'display: inline-flex !important; flex-direction: row !important; align-items: center !important; gap: 6px !important; padding: 6px 10px !important; background: transparent !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; cursor: pointer !important; font-size: 13px !important; white-space: nowrap !important;';
    modeButton.innerHTML = `
      <span class="bcc-mode-label" style="display: inline !important; font-weight: 500 !important;">${currentMode}</span>
      <svg class="bcc-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block !important; opacity: 0.6 !important;">
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    `;
    console.log('[BCC] Created modeButton:', modeButton);
    console.log('[BCC] modeButton.innerHTML:', modeButton.innerHTML);
    modeButton.addEventListener('click', toggleDropdown);

    // Create dropdown
    dropdown = document.createElement('div');
    dropdown.className = 'bcc-mode-dropdown';
    // Apply inline styles for dropdown
    dropdown.style.cssText = 'position: absolute !important; bottom: calc(100% + 4px) !important; left: 0 !important; min-width: 120px !important; background: #ffffff !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important; opacity: 0 !important; visibility: hidden !important; transform: translateY(4px) !important; transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s !important; overflow: hidden !important;';
    dropdown.innerHTML = `
      <div class="bcc-mode-option" data-mode="Agent" style="display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; padding: 10px 12px !important; cursor: pointer !important; font-size: 13px !important;">
        <span class="bcc-check" style="display: inline-block !important; width: 16px !important; color: #10a37f !important; font-weight: bold !important;">&#10003;</span>
        <span>Agent</span>
      </div>
      <div class="bcc-mode-option" data-mode="Plan" style="display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; padding: 10px 12px !important; cursor: pointer !important; font-size: 13px !important;">
        <span class="bcc-check" style="display: inline-block !important; width: 16px !important; color: #10a37f !important; font-weight: bold !important;"></span>
        <span>Plan</span>
      </div>
    `;
    console.log('[BCC] Created dropdown:', dropdown);

    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      option.addEventListener('click', (e) => {
        console.log('[BCC] Option clicked:', option.dataset.mode);
        e.preventDefault();
        e.stopPropagation();
        selectMode(option.dataset.mode);
      });
    });

    container.appendChild(modeButton);
    container.appendChild(dropdown);

    console.log('[BCC] Final container:', container);
    console.log('[BCC] Container children:', container.children);
    console.log('[BCC] Container innerHTML:', container.innerHTML);

    // Log computed styles after a tick
    setTimeout(() => {
      const containerStyle = window.getComputedStyle(container);
      const buttonStyle = window.getComputedStyle(modeButton);
      console.log('[BCC] Container computed style - display:', containerStyle.display, 'flexDirection:', containerStyle.flexDirection);
      console.log('[BCC] Button computed style - display:', buttonStyle.display, 'flexDirection:', buttonStyle.flexDirection);
    }, 100);

    return container;
  }

  function toggleDropdown(e) {
    console.log('[BCC] toggleDropdown() called');
    e.stopPropagation();
    e.preventDefault();
    const isVisible = dropdown.style.visibility === 'visible';
    console.log('[BCC] Current visibility:', isVisible);

    if (isVisible) {
      closeDropdown();
    } else {
      dropdown.style.opacity = '1';
      dropdown.style.visibility = 'visible';
      dropdown.style.transform = 'translateY(0)';
      console.log('[BCC] Dropdown now visible');
      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', closeDropdown, { once: true });
      }, 0);
    }
  }

  function closeDropdown() {
    console.log('[BCC] closeDropdown() called');
    dropdown.style.opacity = '0';
    dropdown.style.visibility = 'hidden';
    dropdown.style.transform = 'translateY(4px)';
  }

  function selectMode(mode) {
    console.log('[BCC] selectMode() called with:', mode);
    currentMode = mode;
    modeButton.querySelector('.bcc-mode-label').textContent = mode;
    console.log('[BCC] Updated label to:', mode);

    // Update checkmarks
    dropdown.querySelectorAll('.bcc-mode-option').forEach(option => {
      const check = option.querySelector('.bcc-check');
      check.textContent = option.dataset.mode === mode ? '✓' : '';
    });

    closeDropdown();

    // Handle mode change
    if (mode === 'Plan') {
      console.log('[BCC] Calling addPlanPrefix()');
      addPlanPrefix();
    } else if (mode === 'Agent') {
      console.log('[BCC] Calling removePlanPrefix()');
      removePlanPrefix();
    }
  }

  function addPlanPrefix() {
    console.log('[BCC] addPlanPrefix() called');
    // Find the textarea/input field in Claude's interface
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');

    console.log('[BCC] Found textField:', textField);
    console.log('[BCC] textField tagName:', textField?.tagName);

    if (textField) {
      const prefix = 'use @agent-plan : ';

      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        console.log('[BCC] Handling TEXTAREA/INPUT');
        console.log('[BCC] Current value:', textField.value);
        // For textarea/input elements
        if (!textField.value.startsWith(prefix)) {
          textField.value = prefix + textField.value;
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          // Trigger input event for React
          textField.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('[BCC] Added prefix, new value:', textField.value);
        } else {
          console.log('[BCC] Prefix already present');
        }
      } else {
        console.log('[BCC] Handling contenteditable');
        // For contenteditable divs
        const currentText = textField.innerText || textField.textContent || '';
        console.log('[BCC] Current text:', currentText);
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
          console.log('[BCC] Added prefix, new text:', textField.innerText);
        } else {
          console.log('[BCC] Prefix already present');
        }
      }
    } else {
      console.log('[BCC] No textField found!');
    }
  }

  function removePlanPrefix() {
    console.log('[BCC] removePlanPrefix() called');
    // Find the textarea/input field in Claude's interface
    const textField = document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('textarea') ||
                      document.querySelector('[data-placeholder]');

    console.log('[BCC] Found textField:', textField);
    console.log('[BCC] textField tagName:', textField?.tagName);

    if (textField) {
      const prefix = 'use @agent-plan : ';

      if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
        console.log('[BCC] Handling TEXTAREA/INPUT');
        console.log('[BCC] Current value:', textField.value);
        // For textarea/input elements
        if (textField.value.startsWith(prefix)) {
          textField.value = textField.value.slice(prefix.length);
          textField.focus();
          textField.setSelectionRange(textField.value.length, textField.value.length);
          // Trigger input event for React
          textField.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('[BCC] Removed prefix, new value:', textField.value);
        } else {
          console.log('[BCC] No prefix to remove');
        }
      } else {
        console.log('[BCC] Handling contenteditable');
        // For contenteditable divs
        const currentText = textField.innerText || textField.textContent || '';
        console.log('[BCC] Current text:', currentText);
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
          console.log('[BCC] Removed prefix, new text:', textField.innerText);
        } else {
          console.log('[BCC] No prefix to remove');
        }
      }
    } else {
      console.log('[BCC] No textField found!');
    }
  }

  function findAndInjectModeButton() {
    console.log('[BCC] findAndInjectModeButton() called');

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
      console.log('[BCC] Trying selector:', selector, '- Found:', targetButton);
      if (targetButton) break;
    }

    // If no specific button found, try to find the input container
    let insertionPoint = null;

    if (targetButton) {
      insertionPoint = targetButton.closest('div');
      console.log('[BCC] Found insertionPoint via targetButton:', insertionPoint);
    } else {
      // Fallback: find the form or input area
      const form = document.querySelector('form');
      console.log('[BCC] Found form:', form);
      if (form) {
        // Look for button containers within the form
        const buttonContainers = form.querySelectorAll('button');
        console.log('[BCC] Found buttons in form:', buttonContainers.length);
        if (buttonContainers.length > 0) {
          // Find the first button's parent
          insertionPoint = buttonContainers[0].parentElement;
          console.log('[BCC] Using first button parent as insertionPoint:', insertionPoint);
        }
      }
    }

    // Check if we already injected
    if (document.querySelector('.bcc-mode-container')) {
      console.log('[BCC] Already injected, skipping');
      return;
    }

    if (insertionPoint) {
      console.log('[BCC] Injecting into insertionPoint');
      const modeContainer = createModeButton();
      insertionPoint.insertBefore(modeContainer, insertionPoint.firstChild);
      console.log('[BCC] Injection complete');
      console.log('[BCC] InsertionPoint innerHTML after inject:', insertionPoint.innerHTML);
    } else {
      // Ultimate fallback: create a floating button
      const form = document.querySelector('form') || document.querySelector('[contenteditable="true"]')?.closest('div');
      console.log('[BCC] Fallback - form:', form);
      if (form && !document.querySelector('.bcc-mode-container')) {
        console.log('[BCC] Using floating fallback');
        const modeContainer = createModeButton();
        modeContainer.classList.add('bcc-floating');
        form.style.position = 'relative';
        form.insertBefore(modeContainer, form.firstChild);
        console.log('[BCC] Floating injection complete');
      } else {
        console.log('[BCC] No injection point found!');
      }
    }
  }

  // ============================================
  // Better Label Feature
  // ============================================

  function addBetterLabel() {
    console.log('[BCC] addBetterLabel() called');

    // Find the anchor element that links to /code (the Claude Code header link)
    const claudeCodeLink = document.querySelector('a[href="/code"]');

    if (!claudeCodeLink) {
      console.log('[BCC] No a[href="/code"] found yet');
      return false;
    }

    console.log('[BCC] Found Claude Code link:', {
      tagName: claudeCodeLink.tagName,
      className: claudeCodeLink.className,
      href: claudeCodeLink.href
    });

    // Check if we already added the Better label
    const parent = claudeCodeLink.parentElement;
    if (parent?.querySelector('.better-label')) {
      console.log('[BCC] Better label already exists in parent, skipping');
      return true;
    }
    if (claudeCodeLink.nextElementSibling?.classList?.contains('better-label')) {
      console.log('[BCC] Better label already exists as sibling, skipping');
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
    console.log('[BCC] Inserting Better label');
    claudeCodeLink.parentNode.insertBefore(betterLabel, claudeCodeLink.nextSibling);
    console.log('[BCC] Better label inserted successfully');

    return true;
  }

  // ============================================
  // Initialization
  // ============================================

  // Debounce for Better Label
  let debounceTimer = null;
  function debouncedAddBetterLabel() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      addBetterLabel();
    }, 100);
  }

  function init() {
    console.log('[BCC] init() called, readyState:', document.readyState);

    // Wait for page to load
    if (document.readyState === 'loading') {
      console.log('[BCC] Document still loading, adding DOMContentLoaded listener');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[BCC] DOMContentLoaded fired');
        setTimeout(findAndInjectModeButton, 1000);
        addBetterLabel();
      });
    } else {
      console.log('[BCC] Document already loaded, scheduling injection');
      setTimeout(findAndInjectModeButton, 1000);
      addBetterLabel();
    }

    // Watch for DOM changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      // Re-inject mode button if missing
      if (!document.querySelector('.bcc-mode-container')) {
        console.log('[BCC] MutationObserver: mode container missing, re-injecting');
        findAndInjectModeButton();
      }
      // Re-add better label if missing
      debouncedAddBetterLabel();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('[BCC] MutationObserver started');
  }

  init();
})();
