// Electron-Hauptprozess. Lädt dieselbe gebaute Web-App (dist/) – eine
// gemeinsame Codebasis für Web und Desktop. Im Desktop-Kontext funktioniert
// auch der Gemini-Aufruf ohne CORS-Einschränkungen.
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = !!process.env.ELECTRON_START_URL;

app.setName('Schreibzeit');

// Druck über Electrons eigenen Chromium-Druck (nutzt @media print).
ipcMain.handle('sz-print', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return new Promise((resolve) => {
    win.webContents.print({ printBackground: true }, (success) => resolve(success));
  });
});

ipcMain.handle('sz-print-pdf', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const data = await win.webContents.printToPDF({
    printBackground: true,
    landscape: true,
    pageSize: 'A4',
  });
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: 'schreibzeit.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (!canceled && filePath) {
    fs.writeFileSync(filePath, data);
    return true;
  }
  return false;
});
// Natives Menü ausblenden – die App bringt eine eigene, gestaltete Menüleiste
// (Datei/Hilfe) mit, damit die Kopfzeile zum übrigen UI-Design passt.
Menu.setApplicationMenu(null);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 820,
    minHeight: 600,
    backgroundColor: '#f6f3ec',
    title: 'Schreibzeit',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // CSP-Header für alle Responses setzen.
  win.webContents.session.webRequest.onHeadersReceived((details, cb) => {
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob:; font-src 'self' data:; " +
            "connect-src 'self' https://generativelanguage.googleapis.com https://api.anthropic.com;",
        ],
      },
    });
  });

  // Externe Links im System-Browser öffnen (z. B. der API-Key-Link).
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      void shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Navigation auf fremde Origins unterbinden.
  const erlaubteOrigins = isDev
    ? [process.env.ELECTRON_START_URL]
    : ['file://'];
  win.webContents.on('will-navigate', (e, url) => {
    if (!erlaubteOrigins.some((o) => url.startsWith(o))) {
      e.preventDefault();
      void shell.openExternal(url);
    }
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

// Webview-Einbettung unterbinden.
app.on('web-contents-created', (_event, wc) => {
  wc.on('will-attach-webview', (e) => e.preventDefault());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
