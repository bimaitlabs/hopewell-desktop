const { contextBridge, ipcRenderer } = require('electron');

// Set Electron detection flag
window.__HOPEWELL_ELECTRON__ = true;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),

  // Navigation controls
  navigateBack: () => ipcRenderer.send('navigate-back'),
  navigateForward: () => ipcRenderer.send('navigate-forward'),
  reloadPage: () => ipcRenderer.send('reload-page'),
  navigateHome: () => ipcRenderer.send('navigate-home'),

  // Hopewell-specific APIs
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  sendHandshakeResponse: (challenge) => ipcRenderer.invoke('handshake-response', challenge),
  onOAuthCallback: (callback) => {
    ipcRenderer.on('oauth-callback', (event, tokens) => callback(tokens));
  },

  // Account management APIs
  selectAccount: (account) => ipcRenderer.send('select-account', account),
  addNewAccount: () => ipcRenderer.send('add-new-account'),
  saveAccount: (account) => ipcRenderer.send('save-account', account),
  showAccountSelector: () => ipcRenderer.send('show-account-selector'),

  // Event listeners
  onLoadingStatus: (callback) => {
    ipcRenderer.on('loading-status', (event, isLoading) => callback(isLoading));
  },
  onUrlChanged: (callback) => {
    ipcRenderer.on('url-changed', (event, url) => callback(url));
  },
  onLoadError: (callback) => {
    ipcRenderer.on('load-error', (event, error) => callback(error));
  },
  onWindowMaximized: (callback) => {
    ipcRenderer.on('window-maximized', (event, isMaximized) => callback(isMaximized));
  }
});
