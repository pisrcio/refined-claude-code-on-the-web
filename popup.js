// Refined Claude Code - Popup Control Panel

const DEFAULT_SETTINGS = {
  allEnabled: true,
  modeButton: true,
  showModel: true,
  refinedLabel: true,
  pullBranch: true,
  projectColors: true,
  projectColorMap: {} // { "project-name": "#hexcolor" }
};

// Predefined color palette for project colors
const COLOR_PALETTE = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' }
];

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
  const projectColorsSection = document.querySelector('.project-colors-section');

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

  // Update project colors section
  if (projectColorsSection) {
    if (!settings.allEnabled || !settings.projectColors) {
      projectColorsSection.classList.add('disabled');
    } else {
      projectColorsSection.classList.remove('disabled');
    }
  }

  // Render project colors
  renderProjectColors(settings.projectColorMap || {});
}

// Render project color entries
function renderProjectColors(projectColorMap) {
  const list = document.getElementById('projectColorsList');
  const noItemsMsg = document.getElementById('noProjectColors');

  if (!list) return;

  list.innerHTML = '';
  const entries = Object.entries(projectColorMap);

  if (entries.length === 0) {
    noItemsMsg.style.display = 'block';
  } else {
    noItemsMsg.style.display = 'none';
    entries.forEach(([projectName, color]) => {
      const entry = createProjectColorEntry(projectName, color);
      list.appendChild(entry);
    });
  }
}

// Create a project color entry element
function createProjectColorEntry(projectName, color) {
  const entry = document.createElement('div');
  entry.className = 'project-color-entry';
  entry.dataset.project = projectName;

  // Project name input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'project-name-input';
  input.value = projectName;
  input.placeholder = 'Project name';
  input.addEventListener('change', async (e) => {
    await renameProjectColor(projectName, e.target.value.trim());
  });

  // Color picker wrapper
  const colorWrapper = document.createElement('div');
  colorWrapper.className = 'color-picker-wrapper';

  // Color swatch button
  const swatch = document.createElement('button');
  swatch.type = 'button';
  swatch.className = 'color-swatch';
  swatch.style.backgroundColor = color;
  swatch.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleColorDropdown(colorWrapper);
  });

  // Color dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'color-dropdown';

  const colorGrid = document.createElement('div');
  colorGrid.className = 'color-grid';

  COLOR_PALETTE.forEach((c) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'color-option';
    if (c.value === color) option.classList.add('selected');
    option.style.backgroundColor = c.value;
    option.title = c.name;
    option.addEventListener('click', async (e) => {
      e.stopPropagation();
      await updateProjectColor(projectName, c.value);
      swatch.style.backgroundColor = c.value;
      dropdown.classList.remove('visible');
    });
    colorGrid.appendChild(option);
  });

  dropdown.appendChild(colorGrid);
  colorWrapper.appendChild(swatch);
  colorWrapper.appendChild(dropdown);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = 'Remove project color';
  deleteBtn.addEventListener('click', async () => {
    await deleteProjectColor(projectName);
  });

  entry.appendChild(input);
  entry.appendChild(colorWrapper);
  entry.appendChild(deleteBtn);

  return entry;
}

// Toggle color dropdown visibility
function toggleColorDropdown(wrapper) {
  // Close all other dropdowns first
  document.querySelectorAll('.color-dropdown.visible').forEach((d) => {
    if (d.parentElement !== wrapper) {
      d.classList.remove('visible');
    }
  });

  const dropdown = wrapper.querySelector('.color-dropdown');
  dropdown.classList.toggle('visible');
}

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.color-dropdown.visible').forEach((d) => {
    d.classList.remove('visible');
  });
});

// Add new project color
async function addProjectColor() {
  const settings = await loadSettings();
  const projectColorMap = settings.projectColorMap || {};

  // Generate a unique placeholder name
  let counter = 1;
  let newName = 'new-project';
  while (projectColorMap[newName]) {
    newName = `new-project-${counter}`;
    counter++;
  }

  // Pick a random color from palette
  const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)].value;

  projectColorMap[newName] = randomColor;
  await saveSettings({ projectColorMap });
  renderProjectColors(projectColorMap);
}

// Update project color
async function updateProjectColor(projectName, newColor) {
  const settings = await loadSettings();
  const projectColorMap = settings.projectColorMap || {};

  if (projectColorMap[projectName]) {
    projectColorMap[projectName] = newColor;
    await saveSettings({ projectColorMap });
  }
}

// Rename project color
async function renameProjectColor(oldName, newName) {
  if (!newName || oldName === newName) return;

  const settings = await loadSettings();
  const projectColorMap = settings.projectColorMap || {};

  if (projectColorMap[oldName]) {
    const color = projectColorMap[oldName];
    delete projectColorMap[oldName];
    projectColorMap[newName] = color;
    await saveSettings({ projectColorMap });
    renderProjectColors(projectColorMap);
  }
}

// Delete project color
async function deleteProjectColor(projectName) {
  const settings = await loadSettings();
  const projectColorMap = settings.projectColorMap || {};

  delete projectColorMap[projectName];
  await saveSettings({ projectColorMap });
  renderProjectColors(projectColorMap);
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
      updateUI(newSettings);
      reloadClaudeTabs();
    });
  });

  // Add project color button handler
  const addProjectBtn = document.getElementById('addProjectColor');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', addProjectColor);
  }
}

document.addEventListener('DOMContentLoaded', init);
