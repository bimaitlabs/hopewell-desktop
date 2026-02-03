# Hopewell Desktop

A professional Electron desktop application for Hopewell Community Clinic that renders the web application without using iframes, featuring a custom titlebar with navigation controls.

## Features

- ✨ **Custom Titlebar** - Beautiful gradient titlebar with Hopewell healthcare theme colors
- 🌐 **BrowserView Integration** - Renders the web app using Electron's BrowserView (no iframes)
- 🧭 **Navigation Controls** - Back, forward, reload, and home buttons
- 📍 **URL Display** - Shows current page URL with loading indicator
- 🎨 **Modern UI** - Sleek design with smooth animations matching the web app theme
- 🖥️ **Window Controls** - Minimize, maximize/restore, and close buttons
- 📱 **Responsive** - Adapts to different window sizes
- 🔐 **Password Saving** - Persistent session with credential management for saved passwords
- 💾 **Session Persistence** - Maintains login state across app restarts
- 🔒 **Secret Handshake** - HMAC-SHA256 authentication to verify authentic Electron shell
- 🔗 **Deep Link OAuth** - Custom protocol handler for OAuth callbacks (`hopewell-clinic://`)
- 🌍 **Smart URL Routing** - Public routes automatically open in external browser
- 🔑 **Supabase Integration** - Full support for Supabase authentication and session management

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)

## Installation

1. Clone or download this repository
2. Open a terminal in the project directory
3. Install dependencies:

```bash
npm install
```

## Running the Application

### Development Mode

```bash
npm start
```

or

```bash
npm run dev
```

### Building for Production

To create a distributable package:

```bash
npm run build
```

Platform-specific builds:

```bash
# Windows only
npm run build:win

# macOS only
npm run build:mac

# Linux only
npm run build:linux
```

The built application will be available in the `dist` folder.

### Publishing Updates to GitHub

The app is configured to automatically download updates from GitHub releases.

**Setup:**

1. Create a GitHub repository for the project
2. Update `package.json` with your GitHub username:
   - Replace `YOUR_USERNAME` in the `repository.url` field
   - Replace `YOUR_USERNAME` in the `build.publish.owner` field

3. Generate a GitHub Personal Access Token:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Create a token with `repo` scope
   - Set it as an environment variable: `GH_TOKEN=your_token_here`

4. Build and publish a new release:

```bash
# Set your GitHub token (Windows)
set GH_TOKEN=your_github_token_here

# Build and publish to GitHub releases
npm run publish
```

**How Auto-Updates Work:**

1. When you run `npm run publish`, it builds the app and creates a GitHub release
2. Users' installed apps check for updates on startup (after 3 seconds)
3. If a new version is found, it downloads automatically in the background
4. After download completes, the app prompts to restart and install the update
5. Updates install on app quit/restart

**Version Management:**

To release a new version:
1. Update the `version` field in `package.json` (e.g., `1.0.0` → `1.0.1`)
2. Run `npm run publish`
3. The new version will be available to all users automatically

## Project Structure

```
hopewell-desktop/
├── src/
│   ├── main/
│   │   └── main.js          # Main process (Electron entry point)
│   ├── preload/
│   │   └── preload.js       # Preload script (IPC bridge)
│   └── renderer/
│       ├── index.html       # Titlebar HTML
│       ├── styles.css       # Titlebar styles
│       └── renderer.js      # Titlebar logic
├── assets/
│   └── icon.png            # Application icon (optional)
├── .gitignore
├── package.json
└── README.md
```

## How It Works

### Architecture

1. **Main Process** (`src/main/main.js`):
   - Creates the main window with a frameless design
   - Implements BrowserView to load the remote URL
   - Handles IPC communication for window controls and navigation
   - Manages window state (maximize, minimize, close)

2. **Preload Script** (`src/preload/preload.js`):
   - Provides a secure bridge between renderer and main process
   - Exposes safe APIs via `contextBridge`
   - Ensures context isolation for security

3. **Renderer Process** (`src/renderer/`):
   - Custom titlebar with navigation controls
   - Window control buttons (minimize, maximize, close)
   - URL display with loading indicator
   - Event listeners for user interactions

### Key Technologies

- **Electron BrowserView**: Used instead of iframes for better performance and security
- **IPC (Inter-Process Communication)**: Secure communication between processes
- **Context Isolation**: Enhanced security by separating contexts
- **Custom Titlebar**: Frameless window with custom controls

## Customization

### Change the URL

Edit `src/main/main.js` and modify the `APP_URL` constant:

```javascript
const APP_URL = 'https://your-url-here.com/';
```

### Customize Titlebar Colors

Edit `src/renderer/styles.css` and modify the gradient:

```css
.titlebar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Change Window Size

Edit `src/main/main.js` in the `createWindow()` function:

```javascript
mainWindow = new BrowserWindow({
  width: 1280,    // Change width
  height: 800,    // Change height
  minWidth: 800,  // Minimum width
  minHeight: 600, // Minimum height
  // ...
});
```

### Add Application Icon

Place your icon file at `assets/icon.png` (256x256 or larger recommended).

### Configure Shared Secret for Handshake

The app uses a secret handshake to verify it's an authentic Electron shell:

1. Get the shared secret from the web admin panel: **IT System Health > Desktop App Settings**
2. Set it as an environment variable:

**Windows:**
```cmd
set HOPEWELL_SECRET=your-secret-here
npm start
```

**macOS/Linux:**
```bash
export HOPEWELL_SECRET=your-secret-here
npm start
```

**Or** edit `src/main/main.js` and replace the default value:
```javascript
const SHARED_SECRET = 'your-actual-secret-here';
```

## Supabase Integration

### How It Works

1. **Electron Detection**: The web app detects it's running in Electron via `window.__HOPEWELL_ELECTRON__`
2. **Secret Handshake**: The web app sends a challenge string, and the Electron app responds with an HMAC-SHA256 signature
3. **OAuth Flow**: When users authenticate, OAuth callbacks are handled via the `hopewell-clinic://` protocol
4. **Session Persistence**: Supabase sessions are stored in localStorage with the `persist:hopewell` partition

### electronAPI Methods

The web app can access these methods via `window.electronAPI`:

- `openExternal(url)` - Opens URL in system default browser
- `sendHandshakeResponse(challenge)` - Returns HMAC-SHA256 signature for verification
- `onOAuthCallback(callback)` - Listens for OAuth callback with tokens

### Deep Link Protocol

The app registers the `hopewell-clinic://` protocol for OAuth callbacks:

```
hopewell-clinic://auth-callback?access_token=...&refresh_token=...
```

When this URL is opened, the app:
1. Extracts the tokens
2. Sends them to the BrowserView via IPC
3. The web app receives them via `onOAuthCallback`

### Public Route Interception

These routes automatically open in the external browser:
- `/` (homepage)
- `/about`
- `/services`
- `/team`
- `/contact`
- `/resources`
- `/articles` and `/articles/*`
- `/blog` and `/blog/*`
- `/book-appointment`

This keeps the desktop app focused on authenticated portal features while public content opens in the user's default browser.

## Security Features

- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in BrowserView
- **Sandbox**: Enabled for web content
- **Content Security Policy**: Implemented in renderer
- **Preload Script**: Controlled API exposure

## Keyboard Shortcuts

- **F5**: Reload page (standard browser behavior in BrowserView)
- **Ctrl+R**: Reload page (standard browser behavior in BrowserView)
- **Alt+Left**: Navigate back (standard browser behavior in BrowserView)
- **Alt+Right**: Navigate forward (standard browser behavior in BrowserView)

## Troubleshooting

### Application won't start

- Ensure Node.js is installed: `node --version`
- Delete `node_modules` and reinstall: `npm install`
- Check for port conflicts if running a local server

### BrowserView shows blank page

- Check your internet connection
- Verify the URL is accessible in a regular browser
- Check the console for error messages

### Build fails

- Ensure all dependencies are installed
- Check that you have write permissions in the project directory
- Try clearing the cache: `npm cache clean --force`

## License

MIT

## Support

For issues or questions, please contact the development team.
