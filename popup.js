// Better Claude Code - Popup Control Panel

const DEFAULT_SETTINGS = {
  allEnabled: true,
  modeButton: true,
  showModel: true,
  betterLabel: true,
  pullBranch: true
};

// Load settings from storage
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
      resolve(result);
    });
  });
}

// Save settings to storage
async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

// Reload all Claude tabs
async function reloadClaudeTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://claude.ai/*' });
    for (const tab of tabs) {
      chrome.tabs.reload(tab.id);
    }
  } catch (e) {
    console.error('Failed to reload tabs:', e);
  }
}

// Update UI based on settings
function updateUI(settings) {
  const allToggle = document.getElementById('allFeaturesToggle');
  const featureToggles = document.querySelectorAll('.feature-toggle');
  const featuresList = document.querySelector('.features-list');

  allToggle.checked = settings.allEnabled;

  featureToggles.forEach((toggle) => {
    const feature = toggle.dataset.feature;
    toggle.checked = settings[feature];
    toggle.disabled = !settings.allEnabled;
  });

  // Update visual state
  if (settings.allEnabled) {
    featuresList.classList.remove('all-disabled');
  } else {
    featuresList.classList.add('all-disabled');
  }
}

// Initialize popup
async function init() {
  const settings = await loadSettings();
  updateUI(settings);

  // Master toggle handler
  const allToggle = document.getElementById('allFeaturesToggle');
  allToggle.addEventListener('change', async (e) => {
    const newSettings = await loadSettings();
    newSettings.allEnabled = e.target.checked;
    await saveSettings(newSettings);
    updateUI(newSettings);
    reloadClaudeTabs();
  });

  // Individual feature toggle handlers
  const featureToggles = document.querySelectorAll('.feature-toggle');
  featureToggles.forEach((toggle) => {
    toggle.addEventListener('change', async (e) => {
      const feature = e.target.dataset.feature;
      const newSettings = await loadSettings();
      newSettings[feature] = e.target.checked;
      await saveSettings(newSettings);
      reloadClaudeTabs();
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
