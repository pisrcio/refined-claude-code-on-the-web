// Better Claude Code on the Web - Content Script
// Adds a "Better" label next to the "Claude Code" label

console.log('[BetterClaudeCode] Content script loaded');

function addBetterLabel() {
  console.log('[BetterClaudeCode] addBetterLabel() called');

  // Find the "Claude Code" label by searching for elements containing that text
  const allElements = document.querySelectorAll('*');
  console.log('[BetterClaudeCode] Total elements on page:', allElements.length);

  let foundClaudeCode = false;
  let matchingElements = [];

  for (const element of allElements) {
    // Check if this element directly contains "Claude Code" text
    const hasOneChild = element.childNodes.length === 1;
    const isTextNode = element.childNodes[0]?.nodeType === Node.TEXT_NODE;
    const textContent = element.textContent?.trim();

    if (textContent === 'Claude Code') {
      console.log('[BetterClaudeCode] Found element with "Claude Code" text:', {
        tagName: element.tagName,
        className: element.className,
        hasOneChild,
        isTextNode,
        childNodesLength: element.childNodes.length,
        firstChildNodeType: element.childNodes[0]?.nodeType,
        parentElement: element.parentElement?.tagName,
        parentClassName: element.parentElement?.className
      });
      matchingElements.push(element);
    }

    if (hasOneChild && isTextNode && textContent === 'Claude Code') {
      foundClaudeCode = true;
      console.log('[BetterClaudeCode] MATCH! Element passes all conditions');

      // Check if we already added the Better label
      const parent = element.parentElement;
      const existingLabel = parent?.querySelector('.better-label');
      console.log('[BetterClaudeCode] Parent element:', parent?.tagName, parent?.className);
      console.log('[BetterClaudeCode] Existing better-label:', existingLabel);

      if (existingLabel) {
        console.log('[BetterClaudeCode] Better label already exists, skipping');
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

      // Insert after the Claude Code element's parent container
      console.log('[BetterClaudeCode] Inserting Better label after element');
      element.parentNode.insertBefore(betterLabel, element.nextSibling);
      console.log('[BetterClaudeCode] Better label inserted successfully');
    }
  }

  if (!foundClaudeCode) {
    console.log('[BetterClaudeCode] No matching element found with exact conditions');
    console.log('[BetterClaudeCode] Elements containing "Claude Code" text:', matchingElements.length);
    matchingElements.forEach((el, i) => {
      console.log(`[BetterClaudeCode] Element ${i}:`, el.outerHTML.substring(0, 200));
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
