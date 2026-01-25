// Better Claude Code on the Web - Content Script
// Adds a "Better" label next to the "Research preview" label

function addBetterLabel() {
  // Find the "Research preview" label by searching for elements containing that text
  const allElements = document.querySelectorAll('*');

  for (const element of allElements) {
    // Check if this element directly contains "Research preview" text
    if (element.childNodes.length === 1 &&
        element.childNodes[0].nodeType === Node.TEXT_NODE &&
        element.textContent.trim() === 'Research preview') {

      // Check if we already added the Better label
      if (element.nextElementSibling?.classList.contains('better-label')) {
        continue;
      }

      // Create the Better label element
      const betterLabel = document.createElement('span');
      betterLabel.textContent = 'Better';
      betterLabel.className = 'better-label';

      // Copy styles from the Research preview label to match appearance
      const computedStyle = window.getComputedStyle(element);
      betterLabel.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: ${computedStyle.padding};
        margin-left: 8px;
        font-size: ${computedStyle.fontSize};
        font-family: ${computedStyle.fontFamily};
        font-weight: ${computedStyle.fontWeight};
        line-height: ${computedStyle.lineHeight};
        color: #059669;
        background-color: #d1fae5;
        border-radius: ${computedStyle.borderRadius || '9999px'};
      `;

      // Insert after the Research preview label
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
