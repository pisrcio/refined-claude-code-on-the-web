// Better Claude Code on the Web - Content Script
// Adds a "Better" label next to the "Claude Code" label

console.log('[BetterClaudeCode] Content script loaded');

function addBetterLabel() {
  console.log('[BetterClaudeCode] addBetterLabel() called');

  // Only search within the body, not the head (to avoid matching <title>)
  const bodyElements = document.body.querySelectorAll('*');
  console.log('[BetterClaudeCode] Total body elements:', bodyElements.length);

  let foundClaudeCode = false;
  let potentialMatches = [];

  for (const element of bodyElements) {
    const textContent = element.textContent?.trim();

    // First pass: find ALL elements that contain "Claude Code" somewhere
    if (textContent && textContent.includes('Claude Code')) {
      // Only log elements that are relatively small (likely the actual label, not a huge container)
      if (textContent.length < 100) {
        potentialMatches.push({
          element,
          tagName: element.tagName,
          className: element.className,
          textContent: textContent.substring(0, 50),
          childNodesLength: element.childNodes.length,
          innerHTML: element.innerHTML?.substring(0, 100)
        });
      }
    }

    // Check if this element's direct text content (not children) contains "Claude Code"
    // This handles cases where the text might be in a span or other wrapper
    let directText = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        directText += node.textContent;
      }
    }
    directText = directText.trim();

    // Match elements where direct text is "Claude Code" OR the element only contains "Claude Code"
    const isExactMatch = directText === 'Claude Code' ||
                         (textContent === 'Claude Code' && element.tagName !== 'TITLE');

    if (isExactMatch) {
      foundClaudeCode = true;
      console.log('[BetterClaudeCode] MATCH! Found Claude Code element:', {
        tagName: element.tagName,
        className: element.className,
        directText,
        textContent: textContent?.substring(0, 50),
        parentTag: element.parentElement?.tagName,
        parentClass: element.parentElement?.className
      });

      // Check if we already added the Better label (check parent and siblings)
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

  if (!foundClaudeCode) {
    console.log('[BetterClaudeCode] No exact match found');
    console.log('[BetterClaudeCode] Potential matches (elements containing "Claude Code"):', potentialMatches.length);
    potentialMatches.forEach((match, i) => {
      console.log(`[BetterClaudeCode] Potential match ${i}:`, match);
    });
  }
}

// Run on page load
console.log('[BetterClaudeCode] Running initial addBetterLabel()');
addBetterLabel();

// Use MutationObserver to handle dynamic content changes
const observer = new MutationObserver((mutations) => {
  console.log('[BetterClaudeCode] MutationObserver triggered, mutations:', mutations.length);
  addBetterLabel();
});

console.log('[BetterClaudeCode] Setting up MutationObserver on document.body');
observer.observe(document.body, {
  childList: true,
  subtree: true
});
console.log('[BetterClaudeCode] MutationObserver started');
