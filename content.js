// Better Claude Code on the Web - Content Script
// Adds a "Better" label next to the "Claude Code" label

function addBetterLabel() {
  // Find the "Claude Code" label by searching for elements containing that text
  const allElements = document.querySelectorAll('*');

  for (const element of allElements) {
    // Check if this element directly contains "Claude Code" text
    if (element.childNodes.length === 1 &&
        element.childNodes[0].nodeType === Node.TEXT_NODE &&
        element.textContent.trim() === 'Claude Code') {

      // Check if we already added the Better label
      const parent = element.parentElement;
      if (parent?.querySelector('.better-label')) {
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
      element.parentNode.insertBefore(betterLabel, element.nextSibling);
    }
  }
}

// Run on page load
addBetterLabel();

// Use MutationObserver to handle dynamic content changes
const observer = new MutationObserver((mutations) => {
  addBetterLabel();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
