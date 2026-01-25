// Better Claude Code on the Web - Content Script
// Adds a "Better" label next to the "Claude Code" label

console.log('[BetterClaudeCode] Content script loaded');

// Helper function to traverse all elements including Shadow DOMs
function* walkAllElements(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode;

  while (node) {
    yield node;

    // If this element has a shadow root, traverse it too
    if (node.shadowRoot) {
      console.log('[BetterClaudeCode] Found shadowRoot on:', node.tagName, node.className);
      yield* walkAllElements(node.shadowRoot);
    }

    node = walker.nextNode();
  }
}

// Helper to check if element is in the header area (top of page, not in main content)
function isLikelyHeaderElement(element) {
  const rect = element.getBoundingClientRect();
  // Header elements are typically in the top 100px of the viewport
  return rect.top < 100 && rect.top >= 0;
}

// Helper to check if element is inside a code block or message content
function isInsideCodeOrMessage(element) {
  let parent = element;
  while (parent) {
    const tag = parent.tagName?.toLowerCase();
    const className = parent.className || '';

    // Skip if inside code blocks or message content areas
    if (tag === 'code' || tag === 'pre') return true;
    if (className.includes('message') || className.includes('prose') || className.includes('markdown')) return true;
    if (className.includes('token-')) return true; // syntax highlighting

    parent = parent.parentElement;
  }
  return false;
}

function addBetterLabel() {
  console.log('[BetterClaudeCode] addBetterLabel() called');

  let foundClaudeCode = false;
  let potentialMatches = [];
  let headerMatches = [];

  // Walk all elements including shadow DOMs
  for (const element of walkAllElements(document.body)) {
    const textContent = element.textContent?.trim();

    // Skip elements that are clearly in code/message areas
    if (!textContent || !textContent.includes('Claude Code')) continue;

    // Get direct text content only
    let directText = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        directText += node.textContent;
      }
    }
    directText = directText.trim();

    // Log small potential matches for debugging
    if (textContent.length < 100) {
      const isHeader = isLikelyHeaderElement(element);
      const isInCode = isInsideCodeOrMessage(element);

      potentialMatches.push({
        tagName: element.tagName,
        className: element.className,
        textContent: textContent.substring(0, 50),
        directText: directText.substring(0, 50),
        isHeader,
        isInCode,
        top: element.getBoundingClientRect().top
      });

      if (isHeader && !isInCode) {
        headerMatches.push({ element, directText, textContent });
      }
    }

    // Match elements where direct text is "Claude Code" OR the element only contains "Claude Code"
    const isExactMatch = directText === 'Claude Code' ||
                         (textContent === 'Claude Code' && element.tagName !== 'TITLE');

    // Only match if it's in the header area and not inside code
    if (isExactMatch && isLikelyHeaderElement(element) && !isInsideCodeOrMessage(element)) {
      foundClaudeCode = true;
      console.log('[BetterClaudeCode] HEADER MATCH! Found Claude Code element:', {
        tagName: element.tagName,
        className: element.className,
        directText,
        top: element.getBoundingClientRect().top,
        parentTag: element.parentElement?.tagName,
        parentClass: element.parentElement?.className
      });

      // Check if we already added the Better label
      const parent = element.parentElement;
      if (parent?.querySelector('.better-label')) {
        console.log('[BetterClaudeCode] Better label already exists in parent, skipping');
        continue;
      }
      if (element.nextElementSibling?.classList?.contains('better-label')) {
        console.log('[BetterClaudeCode] Better label already exists as sibling, skipping');
        continue;
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

      // Insert after the Claude Code element
      console.log('[BetterClaudeCode] Inserting Better label');
      element.parentNode.insertBefore(betterLabel, element.nextSibling);
      console.log('[BetterClaudeCode] Better label inserted successfully');
    }
  }

  // If no exact header match, try to find header matches and log them
  if (!foundClaudeCode) {
    console.log('[BetterClaudeCode] No exact header match found');
    console.log('[BetterClaudeCode] All potential matches:', potentialMatches.length);
    console.log('[BetterClaudeCode] Header area matches:', headerMatches.length);

    // Log header matches specifically
    headerMatches.forEach((match, i) => {
      console.log(`[BetterClaudeCode] Header match ${i}:`, {
        tagName: match.element.tagName,
        className: match.element.className,
        directText: match.directText,
        textContent: match.textContent?.substring(0, 50)
      });
    });

    // If we have header matches but no exact match, try a looser match
    if (headerMatches.length > 0) {
      for (const match of headerMatches) {
        if (match.textContent.includes('Claude Code') && match.textContent.length < 50) {
          console.log('[BetterClaudeCode] Trying looser match on header element');

          const parent = match.element.parentElement;
          if (parent?.querySelector('.better-label')) {
            console.log('[BetterClaudeCode] Better label already exists, skipping');
            continue;
          }

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

          console.log('[BetterClaudeCode] Inserting Better label (looser match)');
          match.element.parentNode.insertBefore(betterLabel, match.element.nextSibling);
          console.log('[BetterClaudeCode] Better label inserted successfully');
          foundClaudeCode = true;
          break;
        }
      }
    }
  }

  return foundClaudeCode;
}

// Run on page load
console.log('[BetterClaudeCode] Running initial addBetterLabel()');
addBetterLabel();

// Debounce to avoid too many calls
let debounceTimer = null;
function debouncedAddBetterLabel() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    addBetterLabel();
  }, 100);
}

// Use MutationObserver to handle dynamic content changes
const observer = new MutationObserver((mutations) => {
  // Only log occasionally to avoid spam
  if (Math.random() < 0.1) {
    console.log('[BetterClaudeCode] MutationObserver triggered, mutations:', mutations.length);
  }
  debouncedAddBetterLabel();
});

console.log('[BetterClaudeCode] Setting up MutationObserver on document.body');
observer.observe(document.body, {
  childList: true,
  subtree: true
});
console.log('[BetterClaudeCode] MutationObserver started');

// Also try after a delay in case content loads late
setTimeout(() => {
  console.log('[BetterClaudeCode] Delayed check (1s)');
  addBetterLabel();
}, 1000);

setTimeout(() => {
  console.log('[BetterClaudeCode] Delayed check (3s)');
  addBetterLabel();
}, 3000);
