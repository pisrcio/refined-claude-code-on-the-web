// Refined Claude Code on the Web - Content Script
// Features: Refined Label, Pull Branch in CLI

(function() {
  'use strict';

  const LOG_PREFIX = '[BCC]';

  // ============================================
  // Settings Management
  // ============================================

  const DEFAULT_SETTINGS = {
    allEnabled: true,
    refinedLabel: true,
    pullBranch: true,
    mergeBranch: true,
    projectColors: true,
    projectColorMap: {}, // { "project-name": "#hexcolor" }
    projectMainBranch: {}, // { "project-name": "main" }
    scrollToTopButton: true,
    fullscreenPlanPanel: true,
    tocSidebar: true,
    fullscreenConversation: true,
    modelCommands: true
  };

  let currentSettings = { ...DEFAULT_SETTINGS };

  // Load settings from storage
  function loadSettings() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
            if (chrome.runtime.lastError) {
              resolve(currentSettings);
            } else {
              currentSettings = result;
              resolve(currentSettings);
            }
          });
        } else {
          resolve(currentSettings);
        }
      } catch (e) {
        resolve(currentSettings);
      }
    });
  }

  // Save settings to storage
  function saveSettings(settings) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set(settings, () => {
          currentSettings = { ...currentSettings, ...settings };
          resolve();
        });
      } else {
        currentSettings = { ...currentSettings, ...settings };
        resolve();
      }
    });
  }

  // Check if a feature is enabled
  function isFeatureEnabled(feature) {
    return currentSettings.allEnabled && currentSettings[feature];
  }

  // Listen for settings changes from popup
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        for (const [key, { newValue }] of Object.entries(changes)) {
          currentSettings[key] = newValue;
        }
        applySettings();
      }
    });
  }

  // Apply current settings to the page
  function applySettings() {
    // Update Refined label appearance
    updateRefinedLabelState();

    // Toggle pull branch button
    const pullBranchBtn = document.querySelector('.refined-pull-branch-btn');
    if (pullBranchBtn) {
      pullBranchBtn.style.display = isFeatureEnabled('pullBranch') ? 'flex' : 'none';
    }

    // Toggle merge branch button
    const mergeBranchBtn = document.querySelector('.refined-merge-branch-btn');
    if (mergeBranchBtn) {
      mergeBranchBtn.style.display = isFeatureEnabled('mergeBranch') ? 'flex' : 'none';
    }

    // Apply project colors
    applyProjectColors();

    // Toggle scroll-to-top button
    initScrollToTopButton();

    // Apply fullscreen plan panel
    applyFullscreenPlanPanel();

    // Toggle ToC sidebar
    initTocSidebar();
  }

  // Update Refined label appearance based on settings
  function updateRefinedLabelState() {
    const refinedLabel = document.querySelector('.refined-label');
    if (!refinedLabel) return;

    const allEnabled = currentSettings.allEnabled;

    if (allEnabled) {
      refinedLabel.classList.remove('refined-label-disabled');
      refinedLabel.style.cssText = `
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
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      `;
    } else {
      refinedLabel.classList.add('refined-label-disabled');
      refinedLabel.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        margin-left: 8px;
        font-size: 12px;
        font-family: inherit;
        font-weight: 500;
        line-height: 1.25;
        color: #9ca3af;
        background-color: #f3f4f6;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: line-through;
      `;
    }
  }


  // ============================================
  // Refined Label Feature
  // ============================================

  function addRefinedLabel() {
    // Check if refinedLabel feature is enabled (but we always show the label itself)
    if (!isFeatureEnabled('refinedLabel') && !currentSettings.allEnabled === false) {
      // Only hide label if refinedLabel specifically disabled but allEnabled is true
      const existingLabel = document.querySelector('.refined-label');
      if (existingLabel && currentSettings.allEnabled && !currentSettings.refinedLabel) {
        existingLabel.style.display = 'none';
        return true;
      }
    }

    const claudeCodeLink = document.querySelector('a[href="/code"]');

    if (!claudeCodeLink) {
      return false;
    }

    const parent = claudeCodeLink.parentElement;
    if (parent?.querySelector('.refined-label')) {
      updateRefinedLabelState();
      return true;
    }
    if (claudeCodeLink.nextElementSibling?.classList?.contains('refined-label')) {
      updateRefinedLabelState();
      return true;
    }

    const refinedLabel = document.createElement('span');
    refinedLabel.textContent = 'Refined';
    refinedLabel.className = 'refined-label';
    refinedLabel.title = 'Click to toggle all extension features';

    // Apply initial style based on current settings
    const allEnabled = currentSettings.allEnabled;
    if (allEnabled) {
      refinedLabel.style.cssText = `
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
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      `;
    } else {
      refinedLabel.classList.add('refined-label-disabled');
      refinedLabel.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        margin-left: 8px;
        font-size: 12px;
        font-family: inherit;
        font-weight: 500;
        line-height: 1.25;
        color: #9ca3af;
        background-color: #f3f4f6;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: line-through;
      `;
    }

    // Add click handler to toggle all features
    refinedLabel.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const newAllEnabled = !currentSettings.allEnabled;

      await saveSettings({ allEnabled: newAllEnabled });

      // Show feedback then reload
      showToggleFeedback(newAllEnabled ? 'Features enabled - Reloading...' : 'Features disabled - Reloading...');

      // Reload the page after a short delay to show the feedback
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });

    // Add hover effect
    refinedLabel.addEventListener('mouseenter', () => {
      refinedLabel.style.opacity = '0.8';
    });
    refinedLabel.addEventListener('mouseleave', () => {
      refinedLabel.style.opacity = '1';
    });

    claudeCodeLink.parentNode.insertBefore(refinedLabel, claudeCodeLink.nextSibling);

    return true;
  }

  // Show visual feedback when toggling features
  function showToggleFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${message.includes('enabled') ? '#059669' : '#6b7280'};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 99999;
      animation: fadeInOut 2s ease-in-out;
    `;

    // Add animation keyframes if not already present
    if (!document.querySelector('#refined-claude-animations')) {
      const style = document.createElement('style');
      style.id = 'refined-claude-animations';
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

  // ============================================
  // Pull Branch in CLI Feature
  // ============================================

  // Add "Pull Branch in CLI" button next to Create PR button
  function watchForCopyBranchButton() {
    // Store the current branch name
    let currentBranchName = null;

    // Function to extract branch name from the page
    function extractBranchName() {
      // Look for the branch name button with "group/copy" class
      // Structure: button.group/copy > span.truncate (contains branch name)
      const branchButtons = document.querySelectorAll('button[class*="group/copy"]');
      for (const btn of branchButtons) {
        const span = btn.querySelector('span.truncate');
        if (span) {
          const text = span.textContent.trim();
          const branchMatch = text.match(/^(claude\/[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9])$/);
          if (branchMatch && branchMatch[1].includes('-') && branchMatch[1].length > 10) {
            return branchMatch[1];
          }
        }
      }

      return null;
    }

    // Function to add the Pull Branch in CLI button
    function addPullBranchButton() {
      // Check if button already exists
      if (document.querySelector('.refined-pull-branch-btn')) {
        return;
      }

      // Find the Create PR or View PR button
      const allButtons = document.querySelectorAll('button');
      let prButton = null;

      for (const btn of allButtons) {
        const text = btn.textContent.trim();
        if (text.includes('Create PR') || text.includes('Create pull request') ||
            text.includes('View PR') || text.includes('View pull request')) {
          prButton = btn;
          break;
        }
      }

      if (!prButton) {
        return;
      }

      // Extract branch name
      currentBranchName = extractBranchName();
      if (!currentBranchName) {
        return;
      }

      // Create the Pull Branch in CLI button with exact same structure as Open in CLI
      const pullBranchBtn = document.createElement('button');
      pullBranchBtn.type = 'button';
      pullBranchBtn.className = 'group flex items-center gap-[6px] px-[10px] py-2 bg-bg-000 border-0.5 border-border-300 rounded-[6px] shadow-sm hover:bg-bg-100 transition-colors refined-pull-branch-btn';
      pullBranchBtn.title = `Copy: git fetch && git co ${currentBranchName} && git pull`;

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

        try {
          await navigator.clipboard.writeText(gitCommand);
          showCopyFeedback('Command copied to clipboard');
        } catch (err) {
          console.error(LOG_PREFIX, 'Failed to copy:', err);
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
            showCopyFeedback('Command copied to clipboard');
          } catch (fallbackErr) {
            console.error(LOG_PREFIX, 'Fallback copy failed:', fallbackErr);
          }
        }
      });

      // Find the flex container - structure varies between Create PR and View PR
      // View PR: prButton > animate-wrapper > flex-container
      // Create PR: prButton > flex-h-8 > animate-wrapper > flex-container
      const flexContainer = prButton.closest('.flex.items-center.gap-2');

      if (!flexContainer) {
        return;
      }

      // Find the Open in CLI button wrapper to insert before it
      const openInCLIBtn = Array.from(flexContainer.querySelectorAll('button')).find(
        btn => btn.textContent.includes('Open in CLI')
      );
      const insertBeforeEl = openInCLIBtn?.closest('.animate-\\[fade_300ms_ease-out\\]') ||
                             flexContainer.lastElementChild;

      // Create our own wrapper div to match the existing structure
      const wrapper = document.createElement('div');
      wrapper.className = 'animate-[fade_300ms_ease-out]';
      wrapper.appendChild(pullBranchBtn);

      // Insert before Open in CLI
      flexContainer.insertBefore(wrapper, insertBeforeEl);
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
      if (!document.querySelector('#refined-claude-animations')) {
        const style = document.createElement('style');
        style.id = 'refined-claude-animations';
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

    // Watch for DOM changes to detect when PR button appears
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

    return observer;
  }

  // ============================================
  // Merge Branch Feature
  // ============================================

  // Add "Merge [main]" button next to View PR button
  function watchForMergeBranchButton() {
    // SVG path prefix for the left-pointing arrow between base branch and feature branch
    const BRANCH_ARROW_PATH_START = 'M8.14648 4.64648';

    // Function to get current project name from GitHub link
    function getCurrentProjectFromGitHubLink() {
      // Find spans containing GitHub URLs from git push output
      // e.g., <span>remote:      https://github.com/pisrcio/refined-claude-code-on-the-web/pull/new/...</span>
      const allSpans = document.querySelectorAll('span');

      for (const span of allSpans) {
        const text = span.textContent || '';

        // Only look for git remote output (starts with "remote:")
        if (!text.includes('remote:')) continue;
        if (!text.includes('github.com/')) continue;

        // Extract GitHub URL from git remote output
        const match = text.match(/github\.com\/([^/]+)\/([^/\s]+)/);
        if (match && match[2]) {
          return match[2];
        }
      }

      return null;
    }

    // Read the base branch name directly from the branch indicator UI.
    // The Claude web UI renders: [base branch] ← [feature branch]
    // The base branch is on the left side of a left-pointing arrow.
    function getBaseBranchFromDOM() {
      // Strategy 1: Find the left-pointing arrow SVG by its path, then
      // navigate to the previous sibling which contains the base branch.
      const allSvgs = document.querySelectorAll('svg');
      for (const svg of allSvgs) {
        const path = svg.querySelector('path');
        const d = path?.getAttribute('d') || '';
        if (d.startsWith(BRANCH_ARROW_PATH_START)) {
          const arrowContainer = svg.closest('div');
          if (!arrowContainer) continue;

          const baseBranchWrapper = arrowContainer.previousElementSibling;
          if (!baseBranchWrapper) continue;

          const truncateSpan = baseBranchWrapper.querySelector('span.truncate');
          if (truncateSpan) {
            const branchName = truncateSpan.textContent.trim();
            if (branchName) return branchName;
          }
        }
      }

      // Strategy 2: Find the container with --dropdown-max-height CSS variable,
      // then get the first data-state span's truncated text.
      const dropdownContainers = document.querySelectorAll('div[style*="--dropdown-max-height"]');
      for (const div of dropdownContainers) {
        const firstSpanDataState = div.querySelector('span[data-state]');
        if (firstSpanDataState) {
          const truncateSpan = firstSpanDataState.querySelector('span.truncate');
          if (truncateSpan) {
            const branchName = truncateSpan.textContent.trim();
            if (branchName) return branchName;
          }
        }
      }

      return null;
    }

    // Resolve the base branch name using a tiered strategy:
    //   1. Read directly from the branch indicator in the Claude web UI
    //   2. Look up in user-configured projectMainBranch settings
    //   3. Fall back to "main"
    function getMainBranchFromSettings() {
      // Tier 1: Try to read base branch directly from the DOM
      const domBranch = getBaseBranchFromDOM();
      if (domBranch) return domBranch;

      // Tier 2: Fall back to settings-based lookup
      const projectMainBranch = currentSettings.projectMainBranch || {};
      const currentProject = getCurrentProjectFromGitHubLink();

      if (currentProject && projectMainBranch[currentProject]) {
        return projectMainBranch[currentProject];
      }

      // Tier 3: Final fallback
      return 'main';
    }

    // Function to add the Merge Branch button
    function addMergeBranchButton() {
      // Check if button already exists
      if (document.querySelector('.refined-merge-branch-btn')) {
        return;
      }

      // Find the Create PR or View PR button (same as Pull Branch uses)
      const allButtons = document.querySelectorAll('button');
      let prButton = null;

      for (const btn of allButtons) {
        const text = btn.textContent.trim();
        if (text.includes('Create PR') || text.includes('Create pull request') ||
            text.includes('View PR') || text.includes('View pull request')) {
          prButton = btn;
          break;
        }
      }

      if (!prButton) {
        return;
      }

      // Create the Merge Branch button with similar styling
      const mergeBranchBtn = document.createElement('button');
      mergeBranchBtn.type = 'button';
      mergeBranchBtn.className = 'group flex items-center gap-[6px] px-[10px] py-2 bg-bg-000 border-0.5 border-border-300 rounded-[6px] shadow-sm hover:bg-bg-100 transition-colors refined-merge-branch-btn';
      mergeBranchBtn.title = `Insert merge request into text field`;

      // Function to update button label with current branch
      function updateButtonLabel() {
        const mainBranch = getMainBranchFromSettings();
        mergeBranchBtn.innerHTML = `
          <span class="text-xs font-medium text-text-100 group-disabled:text-text-500">Merge <em style="font-style: italic;">${mainBranch}</em></span>
          <div class="group-disabled:text-text-500" style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: #8b5cf6;">
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="group-disabled:text-text-500" aria-hidden="true" style="flex-shrink: 0; color: #8b5cf6;">
              <path d="M108,64A36,36,0,1,0,60,97.94v60.12a36,36,0,1,0,24,0V97.94A36.07,36.07,0,0,0,108,64ZM72,52A12,12,0,1,1,60,64,12,12,0,0,1,72,52Zm0,152a12,12,0,1,1,12-12A12,12,0,0,1,72,204Zm140-45.94V110.63a27.81,27.81,0,0,0-8.2-19.8L173,60h19a12,12,0,0,0,0-24H144a12,12,0,0,0-12,12V96a12,12,0,0,0,24,0V77l30.83,30.83a4,4,0,0,1,1.17,2.83v47.43a36,36,0,1,0,24,0ZM200,204a12,12,0,1,1,12-12A12,12,0,0,1,200,204Z"></path>
            </svg>
          </div>
        `;
      }

      // Set initial label
      updateButtonLabel();

      // Update label after delays to catch when GitHub link appears
      setTimeout(updateButtonLabel, 500);
      setTimeout(updateButtonLabel, 1000);
      setTimeout(updateButtonLabel, 2000);

      mergeBranchBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Get main branch from settings
        const branch = getMainBranchFromSettings();
        const mergeMessage = `Merge the "${branch}" branch in and fix merge conflicts.`;

        // Find the turn-form's TipTap/ProseMirror editor
        const textField = document.querySelector('#turn-form div[contenteditable="true"]') ||
                          document.querySelector('section[aria-labelledby="turn-form"] div[contenteditable="true"]') ||
                          document.querySelector('#turn-form textarea') ||
                          document.querySelector('form textarea');

        if (textField) {
          if (textField.tagName === 'TEXTAREA' || textField.tagName === 'INPUT') {
            textField.value = mergeMessage;
            textField.focus();
            textField.setSelectionRange(textField.value.length, textField.value.length);
            textField.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            textField.focus();
            textField.innerText = mergeMessage;
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(textField);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            textField.dispatchEvent(new Event('input', { bubbles: true }));
          }

        } else {
          console.error(LOG_PREFIX, 'Text field not found');
        }
      });

      // Find the flex container - structure varies between Create PR and View PR
      const flexContainer = prButton.closest('.flex.items-center.gap-2');

      if (!flexContainer) {
        return;
      }

      // Create our own wrapper div to match the existing structure
      const wrapper = document.createElement('div');
      wrapper.className = 'animate-[fade_300ms_ease-out]';
      wrapper.appendChild(mergeBranchBtn);

      // Find Pull Branch wrapper if it exists to insert after it
      const pullBranchBtn = document.querySelector('.refined-pull-branch-btn');
      const pullBranchWrapper = pullBranchBtn?.closest('.animate-\\[fade_300ms_ease-out\\]');

      if (pullBranchWrapper && pullBranchWrapper.parentNode === flexContainer) {
        // Insert after Pull Branch (before the next sibling)
        flexContainer.insertBefore(wrapper, pullBranchWrapper.nextSibling);
      } else {
        // Find Open in CLI to insert before it
        const openInCLIBtn = Array.from(flexContainer.querySelectorAll('button')).find(
          btn => btn.textContent.includes('Open in CLI')
        );
        const insertBeforeEl = openInCLIBtn?.closest('.animate-\\[fade_300ms_ease-out\\]') ||
                               flexContainer.lastElementChild;
        flexContainer.insertBefore(wrapper, insertBeforeEl);
      }
    }

    // Watch for DOM changes to detect when View PR button appears
    const observer = new MutationObserver((mutations) => {
      // Check periodically for the View PR button
      addMergeBranchButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also try immediately and after delays
    addMergeBranchButton();
    setTimeout(addMergeBranchButton, 500);
    setTimeout(addMergeBranchButton, 1000);
    setTimeout(addMergeBranchButton, 2000);

    return observer;
  }

  // ============================================
  // Scroll to Top Button Feature
  // ============================================

  let scrollToTopBtn = null;

  /**
   * Create the floating scroll-to-top button
   */
  function createScrollToTopButton() {
    // Don't create if already exists
    if (scrollToTopBtn && document.body.contains(scrollToTopBtn)) {
      return scrollToTopBtn;
    }

    scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.className = 'bcc-scroll-to-top-btn';
    scrollToTopBtn.type = 'button';
    scrollToTopBtn.title = 'Scroll to previous user message';
    scrollToTopBtn.setAttribute('aria-label', 'Scroll to previous user message');

    // Arrow up icon (Phosphor ArrowUp style)
    scrollToTopBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
        <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z"></path>
      </svg>
    `;

    // Apply styles for floating button at bottom right
    scrollToTopBtn.style.cssText = `
      position: fixed !important;
      bottom: 170px !important;
      right: 24px !important;
      width: 44px !important;
      height: 44px !important;
      border-radius: 50% !important;
      background-color: #3b82f6 !important;
      color: white !important;
      border: none !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      z-index: 99998 !important;
      transition: all 0.2s ease !important;
      opacity: 0.9 !important;
    `;

    // Add hover effect
    scrollToTopBtn.addEventListener('mouseenter', () => {
      scrollToTopBtn.style.opacity = '1';
      scrollToTopBtn.style.transform = 'scale(1.1)';
      scrollToTopBtn.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    });

    scrollToTopBtn.addEventListener('mouseleave', () => {
      scrollToTopBtn.style.opacity = '0.9';
      scrollToTopBtn.style.transform = 'scale(1)';
      scrollToTopBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    // Click handler - scroll to previous user message
    scrollToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollToLastUserMessage();
    });

    document.body.appendChild(scrollToTopBtn);
    return scrollToTopBtn;
  }

  /**
   * Scroll to the previous user message above the current viewport position.
   * Each click moves one user message higher. If already at or above the first
   * user message, scrolls to the very top of the page.
   */
  function scrollToLastUserMessage() {
    // Find all user message divs
    const userMessages = document.querySelectorAll('div.bg-bg-200');

    if (userMessages.length === 0) {
      return;
    }

    // Find the topmost user message whose top edge is above the current viewport top
    // (with a small threshold to avoid getting "stuck" on the current one)
    const threshold = 10; // px
    let targetMessage = null;

    for (let i = userMessages.length - 1; i >= 0; i--) {
      const rect = userMessages[i].getBoundingClientRect();
      if (rect.top < -threshold) {
        targetMessage = userMessages[i];
        break;
      }
    }

    if (targetMessage) {
      targetMessage.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Already at or above the first user message — scroll to the very top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Initialize scroll-to-top button feature
   */
  function initScrollToTopButton() {
    if (!isFeatureEnabled('scrollToTopButton')) {
      // Remove button if it exists but feature is disabled
      if (scrollToTopBtn && document.body.contains(scrollToTopBtn)) {
        scrollToTopBtn.remove();
        scrollToTopBtn = null;
      }
      return;
    }

    createScrollToTopButton();
  }

  // ============================================
  // Session Detection Feature
  // ============================================

  /**
   * Session detection utilities for reliably finding sessions and their action buttons.
   *
   * Structure of a session item in the sidebar:
   * - Wrapper: div[data-index="N"] (N = 0, 1, 2, ...)
   * - Inside: div.group > div.cursor-pointer > ...
   * - Title: span.font-base.text-text-100.leading-relaxed
   * - Buttons container: div.group-hover:opacity-100 (appears on hover)
   * - Delete button: contains trash icon SVG (viewBox="0 0 256 256")
   * - Archive button: contains archive/box icon SVG (viewBox="0 0 20 20")
   */

  // SVG path fragments for identifying button types
  const DELETE_ICON_PATH_START = 'M216,48H176V40a24';  // Trash icon path
  const ARCHIVE_ICON_PATH_FRAGMENT = 'M11.5 9.5C11.7761';  // Archive/box icon path

  /**
   * Get all session elements from the sidebar
   * @returns {NodeListOf<Element>} All session wrapper elements
   */
  function getAllSessions() {
    // Sessions are in elements with data-index attribute
    // They're inside the scrollable session list container
    const sessions = document.querySelectorAll('[data-index]');
    return sessions;
  }

  /**
   * Get session data from a session element
   * @param {Element} sessionEl - The session element (with data-index)
   * @returns {Object|null} Session data or null if not parseable
   */
  function getSessionData(sessionEl) {
    if (!sessionEl || !sessionEl.hasAttribute('data-index')) {
      return null;
    }

    const index = parseInt(sessionEl.getAttribute('data-index'), 10);

    // Find the title span
    const titleSpan = sessionEl.querySelector('span.font-base.text-text-100.leading-relaxed');
    const title = titleSpan ? titleSpan.textContent.trim() : null;

    // Find metadata (repo name, date, diff stats)
    const metaSpan = sessionEl.querySelector('span.text-xs.text-text-500');
    const metadata = metaSpan ? metaSpan.textContent.trim() : null;

    // Check if this session is currently selected (has bg-bg-300 class on the row)
    const row = sessionEl.querySelector('.cursor-pointer');
    const isSelected = row ? row.classList.contains('bg-bg-300') : false;

    // Check if session is currently running (has the spinner animation)
    const spinner = sessionEl.querySelector('.code-spinner-animate');
    const isRunning = !!spinner;

    return {
      element: sessionEl,
      index,
      title,
      metadata,
      isSelected,
      isRunning
    };
  }

  /**
   * Get all sessions with their data
   * @returns {Array<Object>} Array of session data objects
   */
  function getAllSessionsWithData() {
    const sessions = getAllSessions();
    const sessionData = [];

    sessions.forEach(sessionEl => {
      const data = getSessionData(sessionEl);
      if (data) {
        sessionData.push(data);
      }
    });

    return sessionData;
  }

  /**
   * Find a session by its title
   * @param {string} title - The session title to search for
   * @returns {Object|null} Session data or null if not found
   */
  function findSessionByTitle(title) {
    const sessions = getAllSessions();

    for (const sessionEl of sessions) {
      const data = getSessionData(sessionEl);
      if (data && data.title === title) {
        return data;
      }
    }

    return null;
  }

  /**
   * Find the delete button for a session element
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The delete button or null
   */
  function findDeleteButton(sessionEl) {
    if (!sessionEl) return null;

    // Find all buttons in the session
    const buttons = sessionEl.querySelectorAll('button');

    for (const button of buttons) {
      // Look for the trash icon SVG
      const svg = button.querySelector('svg');
      if (!svg) continue;

      // Check viewBox for the trash icon (256x256)
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox !== '0 0 256 256') continue;

      // Check path for trash icon pattern
      const path = svg.querySelector('path');
      if (path) {
        const d = path.getAttribute('d') || '';
        if (d.startsWith(DELETE_ICON_PATH_START)) {
          return button;
        }
      }
    }

    return null;
  }

  /**
   * Find the archive button for a session element
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The archive button or null
   */
  function findArchiveButton(sessionEl) {
    if (!sessionEl) return null;

    // Find all buttons in the session
    const buttons = sessionEl.querySelectorAll('button');

    for (const button of buttons) {
      // Look for the archive icon SVG
      const svg = button.querySelector('svg');
      if (!svg) continue;

      // Check viewBox for the archive icon (20x20)
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox !== '0 0 20 20') continue;

      // Check paths for archive icon pattern
      const paths = svg.querySelectorAll('path');
      for (const path of paths) {
        const d = path.getAttribute('d') || '';
        if (d.includes(ARCHIVE_ICON_PATH_FRAGMENT)) {
          return button;
        }
      }
    }

    return null;
  }

  /**
   * Find the buttons container in a session element using multiple fallback methods
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The buttons container or null
   */
  function findButtonsContainer(sessionEl) {
    if (!sessionEl) return null;

    // Method 1: Try the known structure - group-hover container (new structure uses this)
    const hoverContainer = sessionEl.querySelector('.group-hover\\:opacity-100');
    if (hoverContainer) {
      return hoverContainer;
    }

    // Method 2: Find the container with absolute positioning that shows on hover
    // New structure: div.absolute.-right-1...opacity-0.group-hover:opacity-100
    const absoluteHoverContainer = sessionEl.querySelector('.flex-shrink-0 .absolute');
    if (absoluteHoverContainer) {
      return absoluteHoverContainer;
    }

    // Method 3: Try to find via the relative container in flex-shrink-0
    const relativeContainer = sessionEl.querySelector('.flex-shrink-0 .relative');
    if (relativeContainer) {
      // Look for the first div child that might be the buttons container
      const firstDiv = relativeContainer.querySelector('div');
      if (firstDiv) {
        return firstDiv;
      }
      // Or return the relative container itself
      return relativeContainer;
    }

    // Method 4: Find any button in the session and get its parent container
    const anyButton = sessionEl.querySelector('button');
    if (anyButton) {
      // The button's immediate parent is likely the buttons container
      return anyButton.parentElement;
    }

    return null;
  }

  /**
   * Find the container for the blocked indicator (should be visible even without hover)
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The container for the indicator or null
   */
  function findIndicatorContainer(sessionEl) {
    if (!sessionEl) return null;

    // Method 1: New structure - div.relative.flex.items-center inside flex-shrink-0
    // The indicator should be a sibling of the hover container, not inside it
    const relativeFlexContainer = sessionEl.querySelector('.flex-shrink-0 > .relative.flex');
    if (relativeFlexContainer) {
      return relativeFlexContainer;
    }

    // Method 2: The documented structure - .flex-shrink-0 .relative
    const relativeContainer = sessionEl.querySelector('.flex-shrink-0 .relative');
    if (relativeContainer) {
      return relativeContainer;
    }

    // Method 3: Find the parent of the buttons container (should be always visible)
    const buttonsContainer = findButtonsContainer(sessionEl);
    if (buttonsContainer?.parentElement) {
      // Make sure we're getting a container that's not hidden on hover
      const parent = buttonsContainer.parentElement;
      if (!parent.classList.contains('opacity-0')) {
        return parent;
      }
      // Go one level up
      if (parent.parentElement) {
        return parent.parentElement;
      }
    }

    // Method 4: Find flex-shrink-0 directly
    const flexShrink = sessionEl.querySelector('.flex-shrink-0');
    if (flexShrink) {
      return flexShrink;
    }

    return null;
  }

  /**
   * Get action buttons for a session
   * @param {Element} sessionEl - The session element
   * @returns {Object} Object with deleteButton and archiveButton properties
   */
  function getSessionButtons(sessionEl) {
    return {
      deleteButton: findDeleteButton(sessionEl),
      archiveButton: findArchiveButton(sessionEl)
    };
  }

  /**
   * Trigger hover state on a session to reveal buttons
   * The buttons are hidden by default and only appear on hover
   * @param {Element} sessionEl - The session element
   * @returns {Promise<void>} Resolves when hover events are dispatched
   */
  function triggerSessionHover(sessionEl) {
    return new Promise((resolve) => {
      if (!sessionEl) {
        resolve();
        return;
      }

      // Find the group container that has hover effects
      const groupEl = sessionEl.querySelector('.group');
      if (groupEl) {
        // Dispatch mouseenter to trigger hover state
        groupEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }

      // Give time for CSS transitions
      setTimeout(resolve, 100);
    });
  }

  /**
   * Clear hover state on a session
   * @param {Element} sessionEl - The session element
   */
  function clearSessionHover(sessionEl) {
    if (!sessionEl) return;

    const groupEl = sessionEl.querySelector('.group');
    if (groupEl) {
      groupEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }
  }

  /**
   * Find the currently selected/active session
   * @returns {Object|null} Session data for the active session or null
   */
  function getActiveSession() {
    const sessions = getAllSessions();

    for (const sessionEl of sessions) {
      const row = sessionEl.querySelector('.cursor-pointer');
      if (row && row.classList.contains('bg-bg-300')) {
        return getSessionData(sessionEl);
      }
    }

    return null;
  }

  /**
   * Find sessions that are currently running (have the spinner)
   * @returns {Array<Object>} Array of running session data objects
   */
  function getRunningSessions() {
    const sessions = getAllSessionsWithData();
    return sessions.filter(session => session.isRunning);
  }

  // ============================================
  // Blocked Button Feature
  // ============================================

  // Exclamation/warning icon SVG (Phosphor WarningCircle style, 256x256 viewBox to match other icons)
  const BLOCKED_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"></path></svg>`;

  // Path fragment to identify blocked button
  const BLOCKED_ICON_PATH_FRAGMENT = 'M128,24A104,104,0,1,0,232,128';

  /**
   * Find the blocked button for a session element (if already added)
   * @param {Element} sessionEl - The session element
   * @returns {Element|null} The blocked button or null
   */
  function findBlockedButton(sessionEl) {
    if (!sessionEl) return null;
    return sessionEl.querySelector('.bcc-blocked-btn');
  }

  /**
   * Create a blocked button element
   * @returns {HTMLButtonElement} The blocked button element
   */
  function createBlockedButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bcc-blocked-btn inline-flex items-center justify-center relative shrink-0 can-focus select-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none border-transparent transition font-base duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] h-6 w-6 rounded-md active:scale-95 bg-bg-300 text-text-500 hover:text-warning-100';
    button.title = 'Mark as blocked';
    button.innerHTML = BLOCKED_ICON_SVG;

    // Ensure button is visible with explicit inline styles
    button.style.cssText = `
      display: inline-flex !important;
      width: 24px !important;
      height: 24px !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      margin: 0 !important;
      background-color: rgba(0, 0, 0, 0.05) !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
      color: #6b7280 !important;
      transition: all 0.2s !important;
    `;

    return button;
  }

  /**
   * Add blocked button to a session element
   * @param {Element} sessionEl - The session element
   * @returns {HTMLButtonElement|null} The added button or null if already exists
   */
  function addBlockedButtonToSession(sessionEl) {
    if (!sessionEl) {
      return null;
    }

    // Check if already added
    const existingBtn = findBlockedButton(sessionEl);
    if (existingBtn) {
      return null;
    }

    // Try to find where to insert the blocked button
    let buttonsContainer = null;
    let archiveButton = null;

    // Method 1: Find the archive button - we'll insert next to it
    archiveButton = findArchiveButton(sessionEl);
    if (archiveButton) {
      buttonsContainer = archiveButton.parentElement;
    }

    // Method 2: Find the buttons container directly
    if (!buttonsContainer) {
      buttonsContainer = findButtonsContainer(sessionEl);
    }

    // If we couldn't find anywhere to insert, still try to add the indicator
    // for previously blocked sessions
    if (!buttonsContainer) {
      // Try to restore blocked indicator even without the button
      const sessionData = getSessionData(sessionEl);
      getBlockedReason(sessionData).then((reason) => {
        if (reason !== null) {
          addBlockedIndicator(sessionEl);
        }
      });
      return null;
    }

    // Create the blocked button (no wrapper needed - insert directly like archive button)
    const blockedButton = createBlockedButton();

    // Ensure the container has horizontal flex layout for side-by-side buttons
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'row';
    buttonsContainer.style.alignItems = 'center';
    buttonsContainer.style.gap = '4px';

    // Insert the button next to archive button (or append to container)
    if (archiveButton) {
      // Insert after the archive button (as a sibling inside the same container)
      archiveButton.parentNode.insertBefore(blockedButton, archiveButton.nextSibling);
    } else {
      // Append to the container
      buttonsContainer.appendChild(blockedButton);
    }

    // Check if this session was previously blocked (restore state from storage)
    const sessionData = getSessionData(sessionEl);
    getBlockedReason(sessionData).then((reason) => {
      if (reason !== null) {
        // Mark as blocked without showing modal
        blockedButton.classList.add('bcc-blocked-active');
        blockedButton.style.color = '#ef4444';
        blockedButton.title = 'Marked as blocked - click to unblock';
        addBlockedIndicator(sessionEl);
      }
    });

    // Add click handler
    blockedButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleBlockedClick(sessionEl, blockedButton);
    });

    // Add hover handler to show tooltip
    let tooltipElement = null;
    blockedButton.addEventListener('mouseenter', () => {
      getBlockedReason(sessionData).then((message) => {
        // Only show tooltip if there's an actual message (not just the marker)
        if (message && message !== BLOCKED_NO_REASON_MARKER) {
          // Create tooltip if it doesn't exist
          if (!tooltipElement) {
            tooltipElement = document.createElement('div');
            tooltipElement.className = 'bcc-blocked-tooltip';
            tooltipElement.style.cssText = `
              position: fixed;
              background: #1f2937;
              color: white;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 13px;
              white-space: normal;
              max-width: 250px;
              word-wrap: break-word;
              z-index: 100001;
              line-height: 1.4;
              cursor: pointer;
              pointer-events: auto;
            `;
            tooltipElement.textContent = message;

            // Edit on click
            tooltipElement.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              if (tooltipElement && document.body.contains(tooltipElement)) {
                tooltipElement.remove();
                tooltipElement = null;
              }
              showBlockedReasonEditor(blockedButton, sessionData, (newMessage) => {
                // Clear tooltip so it gets recreated with new message
                if (tooltipElement) {
                  tooltipElement.remove();
                  tooltipElement = null;
                }
              });
            });

            document.body.appendChild(tooltipElement);
          }

          // Position the tooltip above the button
          const buttonRect = blockedButton.getBoundingClientRect();
          const tooltipWidth = tooltipElement.offsetWidth;
          const tooltipHeight = tooltipElement.offsetHeight;

          let left = buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2;
          let top = buttonRect.top - tooltipHeight - 8;

          // Clamp to viewport bounds
          const minMargin = 8;
          if (left < minMargin) {
            left = minMargin;
          }
          if (left + tooltipWidth > window.innerWidth - minMargin) {
            left = window.innerWidth - tooltipWidth - minMargin;
          }
          if (top < minMargin) {
            top = buttonRect.bottom + 8;
          }

          tooltipElement.style.left = left + 'px';
          tooltipElement.style.top = top + 'px';
        }
      });
    });

    blockedButton.addEventListener('mouseleave', () => {
      if (tooltipElement && document.body.contains(tooltipElement)) {
        tooltipElement.remove();
        tooltipElement = null;
      }
    });

    return blockedButton;
  }

  /**
   * Get session ID for storage (based on title)
   * @param {Object} sessionData - The session data object
   * @returns {string} Session identifier
   */
  function getSessionStorageId(sessionData) {
    // Use title as the session identifier
    return `bcc-blocked-reason-${sessionData?.title?.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
  }

  // Marker used when session is blocked but no reason is provided
  const BLOCKED_NO_REASON_MARKER = '__BLOCKED__';

  /**
   * Save blocked reason message to storage
   * @param {Object} sessionData - The session data object
   * @param {string} message - The blocked reason message
   */
  function saveBlockedReason(sessionData, message) {
    const storageKey = getSessionStorageId(sessionData);
    // Use marker when message is empty so we can still detect blocked state
    const valueToStore = message || BLOCKED_NO_REASON_MARKER;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const data = {};
      data[storageKey] = valueToStore;
      chrome.storage.sync.set(data);
    } else {
      // Fallback to localStorage
      localStorage.setItem(storageKey, valueToStore);
    }
  }

  /**
   * Get blocked reason message from storage
   * @param {Object} sessionData - The session data object
   * @returns {Promise<string|null>} The blocked reason message or null
   */
  function getBlockedReason(sessionData) {
    return new Promise((resolve) => {
      const storageKey = getSessionStorageId(sessionData);

      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get([storageKey], (result) => {
          if (chrome.runtime.lastError) {
            // Fallback to localStorage
            const localValue = localStorage.getItem(storageKey);
            resolve(localValue);
          } else {
            resolve(result[storageKey] || null);
          }
        });
      } else {
        // Use localStorage
        const localValue = localStorage.getItem(storageKey);
        resolve(localValue);
      }
    });
  }

  /**
   * Create and show tooltip-style inline editor for blocked reason
   * @param {HTMLButtonElement} blockedButton - The blocked button element
   * @param {Object} sessionData - The session data object
   */
  function showBlockedReasonEditor(blockedButton, sessionData) {

    // Remove any existing editor
    const existingEditor = blockedButton.querySelector('.bcc-reason-editor');
    if (existingEditor) {
      existingEditor.remove();
    }

    // Get existing message
    getBlockedReason(sessionData).then((existingMessage) => {
      // Create editor container (positioned above the button)
      const editor = document.createElement('div');
      editor.className = 'bcc-reason-editor';
      editor.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px;
        z-index: 100001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 280px;
      `;

      // Create input field
      const inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.placeholder = '(optional) block reason';
      // Don't show the marker in the input field
      inputEl.value = (existingMessage && existingMessage !== BLOCKED_NO_REASON_MARKER) ? existingMessage : '';
      inputEl.style.cssText = `
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 13px;
        font-family: inherit;
        box-sizing: border-box;
        outline: none;
        color: #1f2937 !important;
        background-color: white !important;
      `;

      // Save function (only on Enter)
      const saveMessage = () => {
        const message = inputEl.value.trim();
        saveBlockedReason(sessionData, message);
        editor.remove();
      };

      // Handle Enter key only for saving
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveMessage();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          editor.remove();
        }
      });

      // Handle focus loss (clicking outside) - just dismiss, don't save
      inputEl.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.body.contains(editor)) {
            editor.remove();
          }
        }, 100);
      });

      editor.appendChild(inputEl);
      document.body.appendChild(editor);

      // Position the editor above the button
      setTimeout(() => {
        const buttonRect = blockedButton.getBoundingClientRect();
        const editorWidth = 280; // Match min-width
        const editorHeight = editor.offsetHeight;

        let left = buttonRect.left + buttonRect.width / 2 - editorWidth / 2;
        let top = buttonRect.top - editorHeight - 12;

        // Clamp to viewport bounds
        const minMargin = 8;
        if (left < minMargin) {
          left = minMargin;
        }
        if (left + editorWidth > window.innerWidth - minMargin) {
          left = window.innerWidth - editorWidth - minMargin;
        }
        if (top < minMargin) {
          top = buttonRect.bottom + 8;
        }

        editor.style.left = left + 'px';
        editor.style.top = top + 'px';
        inputEl.focus();
        inputEl.select();
      }, 0);
    });
  }

  /**
   * Handle click on blocked button
   * @param {Element} sessionEl - The session element
   * @param {HTMLButtonElement} button - The blocked button
   */
  function handleBlockedClick(sessionEl, button) {
    const sessionData = getSessionData(sessionEl);

    // Toggle blocked state visually
    const isBlocked = button.classList.toggle('bcc-blocked-active');

    if (isBlocked) {
      button.style.color = '#ef4444';
      button.title = 'Marked as blocked - click to unblock';
      // Add always-visible blocked indicator next to title
      addBlockedIndicator(sessionEl);
      // Save blocked state immediately (with marker if no reason yet)
      saveBlockedReason(sessionData, '');
      showBlockedFeedback(`Session "${sessionData?.title}" marked as blocked`, true);
      // Show inline editor for optionally entering reason
      showBlockedReasonEditor(button, sessionData);
    } else {
      button.style.color = '';
      button.title = 'Mark as blocked';
      // Remove the blocked indicator
      removeBlockedIndicator(sessionEl);
      // Remove any existing tooltip from the button
      const existingTooltip = button.querySelector('.bcc-blocked-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      // Clear the stored reason
      const storageKey = getSessionStorageId(sessionData);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.remove([storageKey]);
      } else {
        localStorage.removeItem(storageKey);
      }
      showBlockedFeedback(`Session "${sessionData?.title}" unblocked`, false);
    }

    // Emit custom event for external listeners
    window.dispatchEvent(new CustomEvent('bcc:session-blocked', {
      detail: {
        sessionData,
        isBlocked
      }
    }));
  }

  /**
   * Show visual feedback when blocking/unblocking
   * @param {string} message - The message to display
   * @param {boolean} isBlocked - True for blocked (amber), false for unblocked (green)
   */
  function showBlockedFeedback(message, isBlocked = true) {
    const bgColor = isBlocked ? '#ef4444' : '#059669'; // bright amber for blocked, green for unblocked
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 99999;
      animation: fadeInOut 2s ease-in-out;
    `;

    // Add animation keyframes if not already present
    if (!document.querySelector('#refined-claude-animations')) {
      const style = document.createElement('style');
      style.id = 'refined-claude-animations';
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
    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }

  /**
   * Add an always-visible blocked indicator to a session row
   * @param {Element} sessionEl - The session element
   */
  function addBlockedIndicator(sessionEl) {
    if (!sessionEl) return;

    // Check if indicator already exists
    if (sessionEl.querySelector('.bcc-blocked-indicator')) {
      return;
    }

    // Find the container for the indicator using the robust finder
    const indicatorContainer = findIndicatorContainer(sessionEl);
    if (!indicatorContainer) {
      return;
    }

    const sessionData = getSessionData(sessionEl);

    // Create the indicator (same size as button: h-6 w-6 = 24x24, with 14x14 icon inside)
    const indicator = document.createElement('span');
    indicator.className = 'bcc-blocked-indicator inline-flex items-center justify-center h-6 w-6';
    indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"></path></svg>`;
    indicator.title = 'Session is blocked - hover to see reason';

    // Hide indicator on hover (when buttons become visible)
    const groupEl = sessionEl.querySelector('.group');

    // Check if currently hovering (indicator should be hidden if so)
    const isCurrentlyHovering = groupEl && groupEl.matches(':hover');
    indicator.style.cssText = `color: #ef4444; display: ${isCurrentlyHovering ? 'none' : 'inline-flex'}; position: relative;`;

    if (groupEl) {
      groupEl.addEventListener('mouseenter', () => {
        indicator.style.display = 'none';
      });
      groupEl.addEventListener('mouseleave', () => {
        indicator.style.display = 'inline-flex';
      });
    }

    // Append to indicator container
    indicatorContainer.appendChild(indicator);
  }

  /**
   * Remove the blocked indicator from a session row
   * @param {Element} sessionEl - The session element
   */
  function removeBlockedIndicator(sessionEl) {
    if (!sessionEl) return;

    const indicator = sessionEl.querySelector('.bcc-blocked-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Add blocked buttons to all visible sessions
   */
  function addBlockedButtonsToAllSessions() {
    const sessions = getAllSessions();

    sessions.forEach((sessionEl) => {
      addBlockedButtonToSession(sessionEl);
    });
  }

  /**
   * Restore blocked indicators for all sessions that were previously marked as blocked
   * This runs independently of button placement to ensure indicators always appear
   */
  function restoreBlockedIndicators() {
    const sessions = getAllSessions();

    sessions.forEach((sessionEl) => {
      // Skip if indicator already exists
      if (sessionEl.querySelector('.bcc-blocked-indicator')) {
        return;
      }

      const sessionData = getSessionData(sessionEl);
      if (!sessionData) return;

      getBlockedReason(sessionData).then((reason) => {
        if (reason !== null) {
          addBlockedIndicator(sessionEl);

          // Also update the blocked button if it exists
          const blockedBtn = findBlockedButton(sessionEl);
          if (blockedBtn && !blockedBtn.classList.contains('bcc-blocked-active')) {
            blockedBtn.classList.add('bcc-blocked-active');
            blockedBtn.style.color = '#ef4444';
            blockedBtn.title = 'Marked as blocked - click to unblock';
          }
        }
      });
    });
  }

  /**
   * Set up observer to add blocked buttons when new sessions appear
   */
  function setupBlockedButtonObserver() {
    // Find the sessions container - try multiple selectors
    let sessionsContainer = document.querySelector('.flex.flex-col.gap-0\\.5.px-1');

    // Try alternative selectors if the first one fails
    if (!sessionsContainer) {
      sessionsContainer = document.querySelector('[data-index="0"]')?.closest('.flex.flex-col');
    }

    if (!sessionsContainer) {
      // Just find any container with data-index elements
      const firstSession = document.querySelector('[data-index]');
      if (firstSession) {
        sessionsContainer = firstSession.parentElement;
      }
    }

    if (!sessionsContainer) {
      setTimeout(setupBlockedButtonObserver, 1000);
      return;
    }

    // Add buttons and restore indicators for existing sessions
    addBlockedButtonsToAllSessions();
    // Run indicator restoration separately to ensure blocked sessions show indicator
    setTimeout(restoreBlockedIndicators, 500);

    // Watch for new sessions
    const observer = new MutationObserver((mutations) => {
      // Debounce to avoid excessive processing
      clearTimeout(observer._timeout);
      observer._timeout = setTimeout(() => {
        addBlockedButtonsToAllSessions();
        // Also restore indicators for any newly appearing sessions
        restoreBlockedIndicators();
      }, 100);
    });

    observer.observe(sessionsContainer, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // Initialize blocked button feature after a delay to ensure page is loaded
  setTimeout(() => {
    setupBlockedButtonObserver();
  }, 2000);

  // Expose session utilities for debugging and external use
  window.RefinedClaudeCode = window.RefinedClaudeCode || {};
  window.RefinedClaudeCode.sessions = {
    getAll: getAllSessions,
    getAllWithData: getAllSessionsWithData,
    findByTitle: findSessionByTitle,
    getData: getSessionData,
    getActive: getActiveSession,
    getRunning: getRunningSessions,
    findDeleteButton,
    findArchiveButton,
    findBlockedButton,
    findButtonsContainer,
    findIndicatorContainer,
    getButtons: getSessionButtons,
    triggerHover: triggerSessionHover,
    clearHover: clearSessionHover,
    addBlockedButton: addBlockedButtonToSession,
    addBlockedButtonsToAll: addBlockedButtonsToAllSessions,
    restoreBlockedIndicators
  };

  // ============================================
  // Project Colors Feature
  // ============================================

  function applyProjectColors() {
    if (!isFeatureEnabled('projectColors')) {
      // Remove any applied colors
      document.querySelectorAll('[data-bcc-colored]').forEach(el => {
        el.style.removeProperty('color');
        el.style.removeProperty('font-weight');
        el.removeAttribute('data-bcc-colored');
      });
      return;
    }

    const projectColorMap = currentSettings.projectColorMap || {};
    if (Object.keys(projectColorMap).length === 0) return;

    // Find project name elements in the sidebar
    // Look for span.truncate elements that contain project names
    const truncateSpans = document.querySelectorAll('span.truncate');

    truncateSpans.forEach(span => {
      const projectName = span.textContent.trim();

      // Check if this project has a configured color
      // Support both exact match and partial match
      let matchedColor = null;

      // First try exact match
      if (projectColorMap[projectName]) {
        matchedColor = projectColorMap[projectName];
      } else {
        // Try partial match (project name contains or is contained by config)
        for (const [configName, color] of Object.entries(projectColorMap)) {
          if (projectName.includes(configName) || configName.includes(projectName)) {
            matchedColor = color;
            break;
          }
        }
      }

      if (matchedColor) {
        span.style.color = matchedColor;
        span.style.fontWeight = '600';
        span.setAttribute('data-bcc-colored', 'true');
      } else if (span.hasAttribute('data-bcc-colored')) {
        // Remove color if previously applied but no longer matches
        span.style.removeProperty('color');
        span.style.removeProperty('font-weight');
        span.removeAttribute('data-bcc-colored');
      }
    });
  }

  // Debounced version to avoid excessive calls
  let projectColorDebounceTimer = null;
  function debouncedApplyProjectColors() {
    if (projectColorDebounceTimer) clearTimeout(projectColorDebounceTimer);
    projectColorDebounceTimer = setTimeout(() => {
      applyProjectColors();
    }, 100);
  }

  // ============================================
  // Fullscreen Plan Panel Feature
  // ============================================

  function applyFullscreenPlanPanel() {
    const enabled = isFeatureEnabled('fullscreenPlanPanel');
    // Target the plan panel container by its unique animation class
    const panels = document.querySelectorAll('[class*="animate-[planRestore"]');
    panels.forEach(panel => {
      if (enabled) {
        panel.classList.remove('max-w-3xl');
      } else {
        if (!panel.classList.contains('max-w-3xl')) {
          panel.classList.add('max-w-3xl');
        }
      }
    });
  }

  let planPanelDebounceTimer = null;
  function debouncedApplyFullscreenPlanPanel() {
    if (planPanelDebounceTimer) clearTimeout(planPanelDebounceTimer);
    planPanelDebounceTimer = setTimeout(() => {
      applyFullscreenPlanPanel();
    }, 100);
  }

  // ============================================
  // ToC Sidebar Feature
  // ============================================

  let tocSidebarEl = null;

  /**
   * Get all user message elements from the conversation
   * @returns {NodeListOf<Element>} User message elements
   */
  function getUserMessageElements() {
    const all = document.querySelectorAll('div.bg-bg-200');
    // Filter out non-conversation elements (e.g. the top bar containing "Refined" label)
    return Array.from(all).filter(el => {
      // Exclude elements that directly contain the refined label or nav link
      if (el.querySelector('.refined-label')) return false;
      if (el.querySelector('a[href="/code"]')) return false;
      // Exclude elements that are inside a fixed/sticky positioned container (nav bars)
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const pos = getComputedStyle(parent).position;
        if (pos === 'fixed' || pos === 'sticky') return false;
        parent = parent.parentElement;
      }
      // Exclude small elements near the very top of the page (likely nav bar)
      const rect = el.getBoundingClientRect();
      if (rect.top < 50 && rect.height < 60) return false;
      return true;
    });
  }

  /**
   * Extract the full text from a user message element
   * @param {Element} msgEl - The user message element
   * @returns {string} Message text
   */
  function extractUserMessageText(msgEl) {
    const textEl = msgEl.querySelector('p') || msgEl.querySelector('span') || msgEl;
    let text = (textEl.textContent || '').trim();
    return text || '(empty message)';
  }

  /**
   * Create the ToC sidebar element
   */
  function createTocSidebar() {
    if (tocSidebarEl && document.body.contains(tocSidebarEl)) {
      return tocSidebarEl;
    }

    tocSidebarEl = document.createElement('div');
    tocSidebarEl.className = 'bcc-toc-sidebar';
    // If fullscreen conversation is active, start collapsed
    if (isFeatureEnabled('fullscreenConversation')) {
      tocSidebarEl.classList.add('bcc-toc-collapsed');
    }
    tocSidebarEl.innerHTML = '<div class="bcc-toc-list"></div>';

    document.body.appendChild(tocSidebarEl);
    return tocSidebarEl;
  }

  /**
   * Update the ToC sidebar with current user messages
   */
  // Track previous ToC entries to avoid unnecessary rebuilds
  let _tocPrevTexts = [];

  function updateTocSidebar() {
    if (!tocSidebarEl) return;

    const listEl = tocSidebarEl.querySelector('.bcc-toc-list');
    if (!listEl) return;

    const userMessages = getUserMessageElements();
    if (userMessages.length === 0) {
      if (_tocPrevTexts.length > 0) {
        listEl.innerHTML = '';
        _tocPrevTexts = [];
      }
      tocSidebarEl.style.display = 'none';
      return;
    }
    tocSidebarEl.style.display = '';

    // Extract texts and check if anything changed
    const currentTexts = userMessages.map(msgEl => extractUserMessageText(msgEl));
    if (
      currentTexts.length === _tocPrevTexts.length &&
      currentTexts.every((t, i) => t === _tocPrevTexts[i])
    ) {
      // Nothing changed — skip rebuild to preserve hover/animation state
      return;
    }
    _tocPrevTexts = currentTexts;

    // Build new list
    listEl.innerHTML = '';
    userMessages.forEach((msgEl, idx) => {
      const text = currentTexts[idx];
      const item = document.createElement('div');
      item.className = 'bcc-toc-item';

      // Inner text span that slides on hover (same pattern as Claude's sidebar)
      const textSpan = document.createElement('span');
      textSpan.className = 'bcc-toc-item-text';
      textSpan.textContent = text;
      item.appendChild(textSpan);

      item.addEventListener('mouseenter', () => {
        const overflow = textSpan.scrollWidth - item.clientWidth;
        if (overflow > 0) {
          const speed = 30; // px per second
          const duration = overflow / speed;
          textSpan.style.transition = `transform ${duration}s linear`;
          // Force reflow before setting transform so transition triggers
          void textSpan.offsetWidth;
          textSpan.style.transform = `translateX(-${overflow}px)`;
        }
      });

      item.addEventListener('mouseleave', () => {
        textSpan.style.transition = 'transform 0.2s ease-out';
        textSpan.style.transform = 'translateX(0)';
      });

      // On click: scroll to the message
      item.addEventListener('click', () => {
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      listEl.appendChild(item);
    });
  }

  /**
   * Initialize ToC sidebar feature
   */
  function initTocSidebar() {
    const enabled = isFeatureEnabled('tocSidebar');
    console.log(LOG_PREFIX, '[ToC] initTocSidebar called, enabled:', enabled);
    if (!enabled) {
      if (tocSidebarEl && document.body.contains(tocSidebarEl)) {
        tocSidebarEl.remove();
        tocSidebarEl = null;
      }
      return;
    }

    createTocSidebar();
    console.log(LOG_PREFIX, '[ToC] sidebar element created:', tocSidebarEl);
    console.log(LOG_PREFIX, '[ToC] sidebar in DOM:', document.body.contains(tocSidebarEl));
    console.log(LOG_PREFIX, '[ToC] sidebar classes:', tocSidebarEl.className);
    console.log(LOG_PREFIX, '[ToC] sidebar computed display:', getComputedStyle(tocSidebarEl).display);
    console.log(LOG_PREFIX, '[ToC] sidebar computed width:', getComputedStyle(tocSidebarEl).width);
    console.log(LOG_PREFIX, '[ToC] sidebar computed right:', getComputedStyle(tocSidebarEl).right);
    console.log(LOG_PREFIX, '[ToC] sidebar computed zIndex:', getComputedStyle(tocSidebarEl).zIndex);
    updateTocSidebar();
    console.log(LOG_PREFIX, '[ToC] after updateTocSidebar, display:', tocSidebarEl.style.display);
    const msgs = getUserMessageElements();
    console.log(LOG_PREFIX, '[ToC] user messages found:', msgs.length);
    console.log(LOG_PREFIX, '[ToC] all div.bg-bg-200 count:', document.querySelectorAll('div.bg-bg-200').length);
  }

  // Debounced version for mutation observer
  let tocDebounceTimer = null;
  // Counter to limit debounce debug logs
  let _tocDebugCount = 0;
  function debouncedUpdateTocSidebar() {
    if (tocDebounceTimer) clearTimeout(tocDebounceTimer);
    tocDebounceTimer = setTimeout(() => {
      if (isFeatureEnabled('tocSidebar') && tocSidebarEl) {
        _tocDebugCount++;
        if (_tocDebugCount <= 20 || _tocDebugCount % 50 === 0) {
          const bgCount = document.querySelectorAll('div.bg-bg-200').length;
          const msgs = getUserMessageElements();
          console.log(LOG_PREFIX, `[ToC] debounce #${_tocDebugCount}: bg-bg-200=${bgCount}, userMsgs=${msgs.length}`);
          // Log first few elements with bg- classes to discover actual class names
          if (bgCount === 0 && _tocDebugCount <= 5) {
            const allDivs = document.querySelectorAll('div[class*="bg-"]');
            const sample = Array.from(allDivs).slice(0, 10).map(el => el.className.split(' ').filter(c => c.startsWith('bg-')).join(', '));
            console.log(LOG_PREFIX, '[ToC] sample bg- classes:', sample);
            // Also look for common message container patterns
            const humanMsgs = document.querySelectorAll('[data-message-author-role="human"], [data-testid*="human"], [data-testid*="user"]');
            console.log(LOG_PREFIX, '[ToC] human msg elements (data-attr):', humanMsgs.length);
            // Check for role-based containers
            const turnContainers = document.querySelectorAll('[data-turn], [data-message-id]');
            console.log(LOG_PREFIX, '[ToC] turn/message-id elements:', turnContainers.length);
          }
        }
        updateTocSidebar();
      }
    }, 500);
  }

  // ============================================
  // Fullscreen Conversation Mode Feature
  // ============================================

  function applyFullscreenConversation() {
    const enabled = isFeatureEnabled('fullscreenConversation');

    // Target the conversation message containers with max-w-3xl
    const containers = document.querySelectorAll('div.max-w-3xl.w-full');
    containers.forEach(container => {
      if (enabled) {
        container.classList.remove('max-w-3xl');
        if (!container.dataset.bccFullscreen) {
          container.dataset.bccFullscreen = 'true';
        }
      } else {
        if (container.dataset.bccFullscreen) {
          container.classList.add('max-w-3xl');
          delete container.dataset.bccFullscreen;
        }
      }
    });

    // Also handle containers that were already processed (re-check on DOM changes)
    const processed = document.querySelectorAll('[data-bcc-fullscreen="true"]');
    processed.forEach(container => {
      if (!enabled) {
        container.classList.add('max-w-3xl');
        delete container.dataset.bccFullscreen;
      } else {
        container.classList.remove('max-w-3xl');
      }
    });

    // Collapse/expand ToC sidebar based on fullscreen mode
    if (tocSidebarEl) {
      if (enabled) {
        tocSidebarEl.classList.add('bcc-toc-collapsed');
      } else {
        tocSidebarEl.classList.remove('bcc-toc-collapsed');
      }
    }
  }

  let fullscreenConversationDebounceTimer = null;
  function debouncedApplyFullscreenConversation() {
    if (fullscreenConversationDebounceTimer) clearTimeout(fullscreenConversationDebounceTimer);
    fullscreenConversationDebounceTimer = setTimeout(() => {
      applyFullscreenConversation();
    }, 200);
  }

  // ============================================
  // Model Commands (Slash Command Integration)
  // ============================================

  const MODEL_LOG = '[BCC] [Model]';

  const BCC_MODEL_KEYS = ['opus', 'sonnet', 'haiku'];

  // Find the chat input element
  function findChatInput() {
    const selectors = [
      '#turn-form div[contenteditable="true"]',
      '#turn-form textarea',
      'section[aria-labelledby="turn-form"] div[contenteditable="true"]',
      'section[aria-labelledby="turn-form"] textarea',
      'div[contenteditable="true"].ProseMirror',
      'div[contenteditable="true"]',
      'textarea',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // Get the current text from the chat input
  function getChatInputText(eventTarget) {
    // First try the event target itself (most reliable - it's the focused element)
    if (eventTarget) {
      const text = (eventTarget.textContent || eventTarget.value || '').trim();
      if (text) {
        console.log(MODEL_LOG, 'getChatInputText: from eventTarget:', JSON.stringify(text), 'tag:', eventTarget.tagName, 'editable:', eventTarget.contentEditable);
        return text;
      }
      // Check parent (input might be nested inside a contenteditable)
      const parent = eventTarget.closest('[contenteditable="true"]');
      if (parent) {
        const parentText = (parent.textContent || '').trim();
        if (parentText) {
          console.log(MODEL_LOG, 'getChatInputText: from parent contenteditable:', JSON.stringify(parentText));
          return parentText;
        }
      }
    }

    // Fallback: find the input element
    const input = findChatInput();
    if (!input) {
      console.log(MODEL_LOG, 'getChatInputText: no input found at all');
      return '';
    }
    const text = (input.textContent || input.value || '').trim();
    console.log(MODEL_LOG, 'getChatInputText: from findChatInput:', JSON.stringify(text), 'tag:', input.tagName, 'id:', input.id, 'classes:', input.className?.substring?.(0, 60));
    return text;
  }

  // Debug: log all contenteditable and textarea/input elements on the page
  function debugInputElements() {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    console.log(MODEL_LOG, 'debugInputElements: contenteditable count:', editables.length);
    editables.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      console.log(MODEL_LOG, `  [${i}] tag:${el.tagName} text:${JSON.stringify((el.textContent || '').substring(0, 60))} classes:${el.className?.substring?.(0, 80)} visible:${rect.width > 0} y:${Math.round(rect.top)}`);
    });

    const textareas = document.querySelectorAll('textarea');
    console.log(MODEL_LOG, 'debugInputElements: textarea count:', textareas.length);
    textareas.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      console.log(MODEL_LOG, `  textarea[${i}] value:${JSON.stringify((el.value || '').substring(0, 60))} classes:${el.className?.substring?.(0, 80)} visible:${rect.width > 0} y:${Math.round(rect.top)}`);
    });
  }

  // Clear the chat input field
  function clearChatInput() {
    const input = findChatInput();
    if (!input) {
      console.log(MODEL_LOG, 'clearChatInput: no input found');
      return;
    }
    console.log(MODEL_LOG, 'clearChatInput: clearing', input.tagName, 'text:', JSON.stringify((input.textContent || input.value || '').substring(0, 40)));

    if (input.tagName === 'TEXTAREA') {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // For contenteditable, dispatch proper input event
      input.textContent = '';
      input.innerHTML = '';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
    }
  }

  // ---- Slash Command Popup Detection & Injection ----

  // Find the slash command popup in the DOM
  function findSlashCommandPopup() {
    const knownCommands = ['debug', 'compact', 'context', 'cost', 'init', 'simplify', 'batch'];

    // Strategy 1: role-based and radix elements
    const candidates = document.querySelectorAll(
      '[role="listbox"], [role="menu"], [data-radix-popper-content-wrapper]'
    );
    console.log(MODEL_LOG, 'findPopup: strategy1 candidates:', candidates.length);

    for (const el of candidates) {
      if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
      const text = el.textContent || '';
      const matches = knownCommands.filter(cmd => text.includes(cmd));
      console.log(MODEL_LOG, 'findPopup: strategy1 candidate matches:', matches.length, 'tag:', el.tagName, 'role:', el.getAttribute('role'), 'classes:', el.className?.substring?.(0, 80));
      if (matches.length >= 3) return el;
    }

    // Strategy 2: positioned elements anywhere in the DOM
    const allEls = document.querySelectorAll('div');
    let strategy2Count = 0;
    for (const el of allEls) {
      if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
      const style = getComputedStyle(el);
      if (style.position !== 'fixed' && style.position !== 'absolute') continue;
      if (parseInt(style.zIndex || '0') < 1) continue;

      const text = el.textContent || '';
      const matches = knownCommands.filter(cmd => text.includes(cmd));
      if (matches.length >= 2) {
        strategy2Count++;
        console.log(MODEL_LOG, 'findPopup: strategy2 candidate matches:', matches.length, 'zIndex:', style.zIndex, 'tag:', el.tagName, 'classes:', el.className?.substring?.(0, 80), 'children:', el.children.length);
      }
      if (matches.length >= 3) return el;
    }

    // Strategy 3: look for any visible element tree containing many known commands
    // Check all elements that might be popup containers
    const possiblePopups = document.querySelectorAll('[class*="popover"], [class*="popup"], [class*="dropdown"], [class*="menu"], [class*="command"], [class*="slash"]');
    console.log(MODEL_LOG, 'findPopup: strategy3 candidates:', possiblePopups.length);
    for (const el of possiblePopups) {
      if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
      const text = el.textContent || '';
      const matches = knownCommands.filter(cmd => text.includes(cmd));
      if (matches.length >= 3) {
        console.log(MODEL_LOG, 'findPopup: strategy3 found!', el.tagName, el.className?.substring?.(0, 80));
        return el;
      }
    }

    console.log(MODEL_LOG, 'findPopup: no popup found (strategy2 near-misses:', strategy2Count, ')');
    return null;
  }

  // Find the item container and a template item inside the popup
  function findCommandItemContainer(popup) {
    // Try role="option" items
    const options = popup.querySelectorAll('[role="option"]');
    console.log(MODEL_LOG, 'findContainer: role=option count:', options.length);
    if (options.length >= 3) return { container: options[0].parentElement, template: options[0] };

    // Look for a container with many similar children
    const knownCommands = ['debug', 'compact', 'context', 'cost', 'init', 'simplify'];
    const allDivs = popup.querySelectorAll('div');

    for (const div of allDivs) {
      if (div.children.length < 3) continue;
      let cmdCount = 0;
      for (const child of div.children) {
        const text = (child.textContent || '').trim().toLowerCase();
        for (const cmd of knownCommands) {
          if (text === cmd || text.startsWith(cmd)) {
            cmdCount++;
            break;
          }
        }
      }
      if (cmdCount >= 2) {
        console.log(MODEL_LOG, 'findContainer: found container with', div.children.length, 'children,', cmdCount, 'command matches');
        return { container: div, template: div.children[0] };
      }
    }

    // Fallback: try any list-like container (ul, ol)
    const lists = popup.querySelectorAll('ul, ol');
    for (const list of lists) {
      if (list.children.length >= 3) {
        console.log(MODEL_LOG, 'findContainer: fallback list with', list.children.length, 'items');
        return { container: list, template: list.children[0] };
      }
    }

    // Log the popup structure for debugging
    console.log(MODEL_LOG, 'findContainer: FAILED. Popup innerHTML (first 500):', popup.innerHTML.substring(0, 500));
    return null;
  }

  // Inject a single "model" item into the slash command popup
  function injectModelCommandsIntoPopup() {
    if (!isFeatureEnabled('modelCommands')) return;

    const popup = findSlashCommandPopup();
    if (!popup) return;

    // Don't re-inject if already present and popup hasn't changed
    const existing = popup.querySelector('[data-bcc-model-cmd]');
    if (existing) return;

    const result = findCommandItemContainer(popup);
    if (!result) return;

    const { container, template } = result;
    console.log(MODEL_LOG, 'inject: template tag:', template.tagName, 'template classes:', template.className?.substring?.(0, 80), 'template text:', template.textContent?.substring?.(0, 40));

    // Clone the template and modify it
    const newItem = template.cloneNode(true);
    newItem.setAttribute('data-bcc-model-cmd', 'model');

    // Update text - find the deepest leaf text node
    const walker = document.createTreeWalker(newItem, NodeFilter.SHOW_TEXT, null, false);
    let firstTextNode = null;
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim().length > 0) {
        firstTextNode = walker.currentNode;
        break;
      }
    }
    if (firstTextNode) {
      console.log(MODEL_LOG, 'inject: replacing text node:', JSON.stringify(firstTextNode.textContent), '-> "model"');
      firstTextNode.textContent = 'model';
    } else {
      console.log(MODEL_LOG, 'inject: no text node found, setting textContent');
      newItem.textContent = 'model';
    }

    // Strip cloned event listeners
    const cleanItem = newItem.cloneNode(true);
    cleanItem.setAttribute('data-bcc-model-cmd', 'model');

    cleanItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(MODEL_LOG, 'popup item clicked: model');
      // Set the input to "/model " so user can type the model name
      const input = findChatInput();
      if (input) {
        if (input.tagName === 'TEXTAREA') {
          const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
          nativeSetter.call(input, '/model ');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          input.textContent = '/model ';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(input);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        input.focus();
      }
    });

    container.appendChild(cleanItem);
    console.log(MODEL_LOG, 'inject: successfully added "model" item to popup');
  }

  // ---- Enter Key Interception ----

  let modelInputListenerAttached = false;

  function attachModelInputListener() {
    if (modelInputListenerAttached) return;
    // Use capture phase to intercept before Claude's handler
    document.addEventListener('keydown', handleModelKeydown, true);
    modelInputListenerAttached = true;
    console.log(MODEL_LOG, 'keydown listener attached (capture phase)');
  }

  function handleModelKeydown(e) {
    if (!isFeatureEnabled('modelCommands')) return;
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

    const target = e.target;
    console.log(MODEL_LOG, 'Enter pressed, target tag:', target.tagName, 'target editable:', target.contentEditable, 'target classes:', target.className?.substring?.(0, 80));

    const text = getChatInputText(target);
    console.log(MODEL_LOG, 'Enter pressed, final input text:', JSON.stringify(text));

    // Debug: if text is empty, dump all input elements to console
    if (!text) {
      debugInputElements();
      // Also check activeElement
      const active = document.activeElement;
      if (active) {
        console.log(MODEL_LOG, 'activeElement tag:', active.tagName, 'text:', JSON.stringify((active.textContent || active.value || '').substring(0, 60)), 'classes:', active.className?.substring?.(0, 80));
      }
    }

    // Match /model <name>
    const match = text.match(/^\/model\s+(opus|sonnet|haiku)\s*$/i);
    if (!match) {
      // Also try without leading slash (in case the / was consumed by the popup)
      const match2 = text.match(/^model\s+(opus|sonnet|haiku)\s*$/i);
      if (match2) {
        console.log(MODEL_LOG, 'Matched without leading slash');
      } else {
        console.log(MODEL_LOG, 'No /model match in:', JSON.stringify(text));
        return;
      }
    }

    const modelKey = (match ? match[1] : text.match(/\b(opus|sonnet|haiku)\b/i)[1]).toLowerCase();
    console.log(MODEL_LOG, 'Intercepted /model command for:', modelKey);

    // Prevent the default submit
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Switch the model
    switchToModel(modelKey);
  }

  // ---- Model Selector & Switching ----

  function findModelSelector() {
    const modelRegex = /\b(sonnet|opus|haiku)\b/i;
    const allButtons = document.querySelectorAll('button');
    const viewportHeight = window.innerHeight;

    console.log(MODEL_LOG, 'findModelSelector: scanning', allButtons.length, 'buttons');

    let bestCandidate = null;
    let bestY = 0;

    for (const btn of allButtons) {
      const text = (btn.textContent || '').trim();
      if (!modelRegex.test(text)) continue;
      if (text.length > 80) continue;

      const rect = btn.getBoundingClientRect();
      console.log(MODEL_LOG, 'findModelSelector: candidate button text:', JSON.stringify(text.substring(0, 40)), 'y:', Math.round(rect.top), 'visible:', rect.width > 0);

      // Prefer buttons in the lower part of the viewport (model selector area)
      if (rect.top > viewportHeight * 0.5 && rect.top > bestY && rect.width > 0) {
        bestCandidate = btn;
        bestY = rect.top;
      }
    }

    if (bestCandidate) {
      console.log(MODEL_LOG, 'findModelSelector: best candidate text:', JSON.stringify(bestCandidate.textContent?.trim().substring(0, 40)), 'y:', Math.round(bestY));
    } else {
      console.log(MODEL_LOG, 'findModelSelector: no candidate found');
      // Debug: log all buttons with their positions
      for (const btn of allButtons) {
        const rect = btn.getBoundingClientRect();
        if (rect.top > viewportHeight * 0.5 && rect.width > 0) {
          console.log(MODEL_LOG, 'findModelSelector: bottom-half button:', JSON.stringify((btn.textContent || '').trim().substring(0, 60)), 'y:', Math.round(rect.top));
        }
      }
    }

    return bestCandidate;
  }

  function selectModelFromDropdown(modelKey) {
    const regex = new RegExp('\\b' + modelKey + '\\b', 'i');

    // Try role-based options
    const roleSelectors = '[role="option"], [role="menuitem"], [role="menuitemradio"], [role="radio"]';
    const options = document.querySelectorAll(roleSelectors);
    console.log(MODEL_LOG, 'selectFromDropdown: role-based options:', options.length);
    for (const option of options) {
      const text = (option.textContent || '').trim();
      console.log(MODEL_LOG, 'selectFromDropdown: option text:', JSON.stringify(text.substring(0, 40)));
      if (regex.test(text)) {
        option.click();
        showModelToast(`Switched to ${modelKey.charAt(0).toUpperCase() + modelKey.slice(1)}`);
        return true;
      }
    }

    // Fallback: look in floating/popup containers
    const dropdownSelectors = '[data-radix-popper-content-wrapper], [role="listbox"], [role="menu"]';
    const dropdowns = document.querySelectorAll(dropdownSelectors);
    console.log(MODEL_LOG, 'selectFromDropdown: dropdown containers:', dropdowns.length);
    for (const dropdown of dropdowns) {
      const items = dropdown.querySelectorAll('div, button, li, label, span');
      for (const item of items) {
        const text = (item.textContent || '').trim();
        if (regex.test(text) && text.length < 100) {
          console.log(MODEL_LOG, 'selectFromDropdown: clicking item:', JSON.stringify(text.substring(0, 40)));
          item.click();
          showModelToast(`Switched to ${modelKey.charAt(0).toUpperCase() + modelKey.slice(1)}`);
          return true;
        }
      }
    }

    // Strategy 3: any visible element anywhere that contains the model name and looks clickable
    const allClickable = document.querySelectorAll('button, [role="option"], [role="menuitem"], a, label');
    for (const el of allClickable) {
      const text = (el.textContent || '').trim();
      if (regex.test(text) && text.length < 60 && el.offsetWidth > 0) {
        const rect = el.getBoundingClientRect();
        // Must be in a popup-like position (not the main model selector button itself)
        if (rect.width > 0 && rect.height > 0) {
          console.log(MODEL_LOG, 'selectFromDropdown: strategy3 candidate:', JSON.stringify(text.substring(0, 40)), 'y:', Math.round(rect.top));
        }
      }
    }

    console.log(MODEL_LOG, 'selectFromDropdown: FAILED for', modelKey);
    return false;
  }

  function switchToModel(modelKey) {
    console.log(MODEL_LOG, '=== switchToModel:', modelKey, '===');

    // Clear the input field first
    clearChatInput();

    // Find the model selector button
    const modelSelector = findModelSelector();
    if (!modelSelector) {
      showModelToast('Could not find model selector', true);
      return;
    }

    // Click to open the model dropdown
    console.log(MODEL_LOG, 'clicking model selector');
    modelSelector.click();

    // Wait for dropdown to appear, then select the model
    let attempts = 0;
    const maxAttempts = 8;

    function trySelect() {
      attempts++;
      console.log(MODEL_LOG, 'trySelect attempt', attempts);
      const success = selectModelFromDropdown(modelKey);
      if (!success && attempts < maxAttempts) {
        setTimeout(trySelect, 200);
      } else if (!success) {
        showModelToast(`Could not find ${modelKey} option`, true);
        // Close the dropdown
        document.body.click();
      }
    }

    setTimeout(trySelect, 300);
  }

  // ---- Toast ----

  function showModelToast(message, isError) {
    const existing = document.getElementById('bcc-model-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'bcc-model-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: ${isError ? '#ef4444' : '#059669'};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // ---- Debounced Popup Injection ----

  let modelCommandDebounceTimer = null;
  function debouncedInjectModelCommands() {
    if (modelCommandDebounceTimer) clearTimeout(modelCommandDebounceTimer);
    modelCommandDebounceTimer = setTimeout(() => {
      injectModelCommandsIntoPopup();
    }, 50);
  }

  // ============================================
  // Initialization
  // ============================================

  let debounceTimer = null;
  function debouncedAddRefinedLabel() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      addRefinedLabel();
    }, 100);
  }

  async function init() {
    try {
      // Load settings first
      await loadSettings();
    } catch (e) {
      // Use defaults
    }

    // Function to inject UI elements
    function injectUI() {
      try {
        addRefinedLabel(); // Always add the label (it's the toggle)
        // Apply project colors
        applyProjectColors();
        // Initialize scroll-to-top button
        initScrollToTopButton();
        // Apply fullscreen plan panel
        applyFullscreenPlanPanel();
        // Initialize ToC sidebar
        initTocSidebar();
        // Apply fullscreen conversation mode
        applyFullscreenConversation();
      } catch (e) {
        console.error(LOG_PREFIX, 'Error injecting UI:', e);
      }
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        injectUI();
      });
    } else {
      injectUI();
    }

    // Watch for copy branch button clicks (only if enabled)
    if (isFeatureEnabled('pullBranch')) {
      watchForCopyBranchButton();
    }

    // Watch for merge branch button (only if enabled)
    if (isFeatureEnabled('mergeBranch')) {
      watchForMergeBranchButton();
    }

    // Attach model command Enter key listener (if enabled)
    if (isFeatureEnabled('modelCommands')) {
      attachModelInputListener();
      console.log(MODEL_LOG, 'Model commands feature initialized');
    }

    // Watch for DOM changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      // Re-add refined label if missing (always, since it's the toggle control)
      debouncedAddRefinedLabel();

      // Re-apply project colors on DOM changes
      debouncedApplyProjectColors();

      // Re-apply fullscreen plan panel on DOM changes
      debouncedApplyFullscreenPlanPanel();

      // Update ToC sidebar when messages change
      debouncedUpdateTocSidebar();
      // Re-apply fullscreen conversation mode on DOM changes
      debouncedApplyFullscreenConversation();

      // Inject model commands into slash command popup
      debouncedInjectModelCommands();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

  }

  init().catch(e => {
    console.error(LOG_PREFIX, 'Init failed:', e);
    // Fallback: try to add the refined label anyway
    setTimeout(() => addRefinedLabel(), 1000);
  });
})();
