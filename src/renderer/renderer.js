// Window control buttons
const minimizeBtn = document.getElementById('minimize-btn');
const maximizeBtn = document.getElementById('maximize-btn');
const closeBtn = document.getElementById('close-btn');

// Navigation buttons
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const homeBtn = document.getElementById('home-btn');

// URL display and loading indicator
const urlDisplay = document.getElementById('url-display');
const loadingIndicator = document.getElementById('loading-indicator');

// Load icon - handle both dev and production paths
const iconImg = document.querySelector('.app-icon img');
if (iconImg) {
  // Try to load the icon, fallback to a placeholder if it fails
  iconImg.onerror = function() {
    // If image fails to load, hide it
    this.style.display = 'none';
  };
}

// Window controls
minimizeBtn.addEventListener('click', () => {
  window.electronAPI.minimizeWindow();
});

maximizeBtn.addEventListener('click', () => {
  window.electronAPI.maximizeWindow();
});

closeBtn.addEventListener('click', () => {
  window.electronAPI.closeWindow();
});

// Navigation controls
backBtn.addEventListener('click', () => {
  window.electronAPI.navigateBack();
});

forwardBtn.addEventListener('click', () => {
  window.electronAPI.navigateForward();
});

reloadBtn.addEventListener('click', () => {
  window.electronAPI.reloadPage();
});

homeBtn.addEventListener('click', () => {
  window.electronAPI.navigateHome();
});

// Listen for loading status
window.electronAPI.onLoadingStatus((isLoading) => {
  if (isLoading) {
    loadingIndicator.classList.add('active');
  } else {
    loadingIndicator.classList.remove('active');
  }
});

// Listen for URL changes
window.electronAPI.onUrlChanged((url) => {
  urlDisplay.textContent = url;
});

// Listen for load errors
window.electronAPI.onLoadError((error) => {
  console.error('Load error:', error);
  // You could show a notification or error message here
});

// Listen for window maximize/unmaximize events
window.electronAPI.onWindowMaximized((isMaximized) => {
  if (isMaximized) {
    maximizeBtn.classList.add('maximized');
    maximizeBtn.title = 'Restore';
  } else {
    maximizeBtn.classList.remove('maximized');
    maximizeBtn.title = 'Maximize';
  }
});

// Check initial maximize state
window.electronAPI.isMaximized().then((isMaximized) => {
  if (isMaximized) {
    maximizeBtn.classList.add('maximized');
    maximizeBtn.title = 'Restore';
  }
});

// Double-click titlebar to maximize/restore
const titlebarDragRegion = document.querySelector('.titlebar-drag-region');
titlebarDragRegion.addEventListener('dblclick', (e) => {
  // Only trigger if clicking on the drag region itself, not buttons
  if (e.target === titlebarDragRegion || 
      e.target.classList.contains('titlebar-left') ||
      e.target.classList.contains('app-title') ||
      e.target.classList.contains('app-icon')) {
    window.electronAPI.maximizeWindow();
  }
});

// Add keyboard shortcut to show account selector (Ctrl+Shift+A)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    if (window.electronAPI && window.electronAPI.showAccountSelector) {
      window.electronAPI.showAccountSelector();
    }
  }
});
