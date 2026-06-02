// Electron-Hauptprozess. Lädt dieselbe gebaute Web-App (dist/) – eine
// gemeinsame Codebasis für Web und Desktop. Im Desktop-Kontext funktioniert
// auch der Gemini-Aufruf ohne CORS-Einschränkungen.
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const isDev = !!process.env.ELECTRON_START_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 820,
    minHeight: 600,
    backgroundColor: '#f6f3ec',
    title: 'Schreibzeit',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Externe Links im System-Browser öffnen (z. B. der API-Key-Link).
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      void shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    void win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    void win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
