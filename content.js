// Better Claude Code on the Web - Content Script
// Adds a "Better" label next to the "Claude Code" link in the header

console.log('[BetterClaudeCode] Content script loaded');

function addBetterLabel() {
  console.log('[BetterClaudeCode] addBetterLabel() called');

  // Find the anchor element that links to /code (the Claude Code header link)
  // The "Claude Code" text is actually an SVG with aria-label, not text content
  const claudeCodeLink = document.querySelector('a[href="/code"]');

  if (!claudeCodeLink) {
    console.log('[BetterClaudeCode] No a[href="/code"] found yet');
    return false;
  }

  console.log('[BetterClaudeCode] Found Claude Code link:', {
    tagName: claudeCodeLink.tagName,
    className: claudeCodeLink.className,
    href: claudeCodeLink.href
  });

  // Check if we already added the Better label
  const parent = claudeCodeLink.parentElement;
  if (parent?.querySelector('.better-label')) {
    console.log('[BetterClaudeCode] Better label already exists in parent, skipping');
    return true;
  }
  if (claudeCodeLink.nextElementSibling?.classList?.contains('better-label')) {
    console.log('[BetterClaudeCode] Better label already exists as sibling, skipping');
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
  console.log('[BetterClaudeCode] Inserting Better label');
  claudeCodeLink.parentNode.insertBefore(betterLabel, claudeCodeLink.nextSibling);
  console.log('[BetterClaudeCode] Better label inserted successfully');

  return true;
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
