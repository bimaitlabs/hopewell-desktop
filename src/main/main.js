const { app, BrowserWindow, BrowserView, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow;
let browserView;
let accountSelectorWindow;

const APP_URL = 'https://hopewellcommunityclinic.lovable.app/auth';
const SHARED_SECRET = process.env.HOPEWELL_SECRET || 'your-shared-secret-here'; // Store securely

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info.version);
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('App is up to date');
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`Download progress: ${progressObj.percent}%`);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj.percent);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info.version);
  }
  // Install update on next restart
  setTimeout(() => {
    autoUpdater.quitAndInstall(false, true);
  }, 5000);
});

// Public routes that should open in external browser
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/services',
  '/team',
  '/contact',
  '/resources',
  '/articles',
  '/blog',
  '/book-appointment'
];

function createWindow() {
  // Check if icon exists
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  const windowOptions = {
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove default frame for custom titlebar
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  };

  // Only add icon if file exists
  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }

  // Create the browser window with custom titlebar
  mainWindow = new BrowserWindow(windowOptions);

  // Load the titlebar HTML
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Create BrowserView for the web content with session persistence
  browserView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Disable sandbox to allow session persistence
      partition: 'persist:hopewell' // Enable persistent session for password saving
    }
  });

  mainWindow.setBrowserView(browserView);

  // Set bounds for BrowserView (leave space for titlebar)
  const updateBrowserViewBounds = () => {
    const { width, height } = mainWindow.getContentBounds();
    const titlebarHeight = 40; // Height of custom titlebar
    browserView.setBounds({
      x: 0,
      y: titlebarHeight,
      width: width,
      height: height - titlebarHeight
    });
  };

  updateBrowserViewBounds();

  // Update bounds when window is resized
  mainWindow.on('resize', updateBrowserViewBounds);
  mainWindow.on('maximize', updateBrowserViewBounds);
  mainWindow.on('unmaximize', updateBrowserViewBounds);

  // Intercept navigation to public routes and open in external browser
  browserView.webContents.setWindowOpenHandler(({ url }) => {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Check if it's a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
      if (route.endsWith('/*')) {
        return pathname.startsWith(route.slice(0, -2));
      }
      return pathname === route || pathname.startsWith(route + '/');
    });
    
    if (isPublicRoute) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    
    return { action: 'allow' };
  });

  // Intercept will-navigate events
  browserView.webContents.on('will-navigate', (event, url) => {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Check if it's a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
      if (route.endsWith('/*')) {
        return pathname.startsWith(route.slice(0, -2));
      }
      return pathname === route || pathname.startsWith(route + '/');
    });
    
    if (isPublicRoute) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Load the remote URL in BrowserView
  browserView.webContents.loadURL(APP_URL);

  // Handle navigation events
  browserView.webContents.on('did-start-loading', () => {
    mainWindow.webContents.send('loading-status', true);
  });

  browserView.webContents.on('did-stop-loading', () => {
    mainWindow.webContents.send('loading-status', false);
  });

  browserView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription);
    mainWindow.webContents.send('load-error', errorDescription);
  });

  // Update URL in titlebar
  browserView.webContents.on('did-navigate', (event, url) => {
    mainWindow.webContents.send('url-changed', url);
  });

  browserView.webContents.on('did-navigate-in-page', (event, url) => {
    mainWindow.webContents.send('url-changed', url);
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// IPC handlers for window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('navigate-back', () => {
  if (browserView && browserView.webContents.canGoBack()) {
    browserView.webContents.goBack();
  }
});

ipcMain.on('navigate-forward', () => {
  if (browserView && browserView.webContents.canGoForward()) {
    browserView.webContents.goForward();
  }
});

ipcMain.on('reload-page', () => {
  if (browserView) {
    browserView.webContents.reload();
  }
});

ipcMain.on('navigate-home', () => {
  if (browserView) {
    browserView.webContents.loadURL(APP_URL);
  }
});

// Check if window is maximized
ipcMain.handle('is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Secret handshake - compute HMAC-SHA256 signature
ipcMain.handle('handshake-response', (event, challenge) => {
  try {
    const signature = crypto
      .createHmac('sha256', SHARED_SECRET)
      .update(challenge)
      .digest('hex');
    return signature;
  } catch (error) {
    console.error('Handshake error:', error);
    return null;
  }
});

// Open external URLs
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error('Failed to open external URL:', error);
    return false;
  }
});

// Account management handlers
ipcMain.on('select-account', (event, account) => {
  console.log('Account selected:', account.email);
  if (accountSelectorWindow) {
    accountSelectorWindow.close();
    accountSelectorWindow = null;
  }
  // Main window should already be created, just show it
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('add-new-account', () => {
  console.log('Adding new account');
  if (accountSelectorWindow) {
    accountSelectorWindow.close();
    accountSelectorWindow = null;
  }
  // Main window should already be created, just show it
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('show-account-selector', () => {
  createAccountSelector();
});

function createAccountSelector() {
  if (accountSelectorWindow) {
    accountSelectorWindow.focus();
    return;
  }

  const iconPath = path.join(__dirname, '../../assets/icon.png');
  const windowOptions = {
    width: 600,
    height: 700,
    resizable: false,
    frame: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      partition: 'persist:hopewell'
    }
  };

  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }

  accountSelectorWindow = new BrowserWindow(windowOptions);
  accountSelectorWindow.loadFile(path.join(__dirname, '../renderer/account-selector.html'));

  accountSelectorWindow.on('closed', () => {
    accountSelectorWindow = null;
  });
}

// Handle deep link for OAuth callback
function handleDeepLink(url) {
  if (!url.startsWith('hopewell-clinic://')) return;
  
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname === 'auth-callback') {
      const params = new URLSearchParams(urlObj.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken && refreshToken && browserView) {
        // Send OAuth tokens to the BrowserView
        browserView.webContents.send('oauth-callback', {
          access_token: accessToken,
          refresh_token: refreshToken
        });
      }
    }
  } catch (error) {
    console.error('Deep link handling error:', error);
  }
}

// Protocol registration for deep links
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('hopewell-clinic', process.execPath, [
      path.resolve(process.argv[1])
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('hopewell-clinic');
}

// Handle protocol URL on Windows/Linux (second instance)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    
    // Handle deep link from command line
    const url = commandLine.find(arg => arg.startsWith('hopewell-clinic://'));
    if (url) {
      handleDeepLink(url);
    }
  });
}

// Handle protocol URL on macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  // Check for updates after app is ready (wait 3 seconds for window to load)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle maximize/unmaximize events
app.on('browser-window-created', (_, window) => {
  window.on('maximize', () => {
    window.webContents.send('window-maximized', true);
  });

  window.on('unmaximize', () => {
    window.webContents.send('window-maximized', false);
  });
});
