// Model Intercept - runs in MAIN world at document_start
// This script MUST run before Claude's page scripts register their keydown handlers.
// It blocks Enter key when the user types /model <name> to prevent the message from being sent.
// Communicates with content.js via a custom DOM event.

(function() {
  'use strict';

  const LOG = '[BCC] [Model] [Main]';
  let trackedSlashText = '';

  // Read text from ProseMirror/TipTap editor
  function readEditorText(el) {
    if (!el) return '';
    return (el.innerText || el.textContent || el.value || '').trim();
  }

  function isEditorElement(el) {
    if (!el) return false;
    return el.classList?.contains('ProseMirror') ||
           el.contentEditable === 'true' ||
           el.tagName === 'TEXTAREA';
  }

  // Capture-phase keydown: fires BEFORE Claude's handlers (registered later)
  document.addEventListener('keydown', function(e) {
    const target = e.target;
    if (!isEditorElement(target)) return;

    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const match = trackedSlashText.match(/^\/model\s+(opus|sonnet|haiku)\s*$/i);
      if (match) {
        const modelKey = match[1].toLowerCase();
        console.log(LOG, 'BLOCKING Enter for /model', modelKey);

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Tell content.js to switch the model
        document.dispatchEvent(new CustomEvent('bcc-model-switch', {
          detail: { model: modelKey }
        }));

        trackedSlashText = '';
        return;
      }
    } else {
      // Track text after this keystroke is processed
      setTimeout(function() {
        const text = readEditorText(target);
        if (text.startsWith('/')) {
          trackedSlashText = text;
        } else if (!text) {
          trackedSlashText = '';
        }
      }, 0);
    }
  }, true);

  // Also track via input events
  document.addEventListener('input', function(e) {
    const target = e.target;
    if (!isEditorElement(target)) return;

    setTimeout(function() {
      const text = readEditorText(target);
      if (text.startsWith('/')) {
        trackedSlashText = text;
      } else if (!text) {
        trackedSlashText = '';
      }
    }, 0);
  }, true);

  console.log(LOG, 'loaded (capture-phase keydown + input tracking)');
})();
