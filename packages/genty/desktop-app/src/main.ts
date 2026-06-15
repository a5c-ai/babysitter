import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !app.isPackaged;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

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

// ---------------------------------------------------------------------------
// System tray — stub (uncomment and supply a real icon path to activate)
// ---------------------------------------------------------------------------
// let tray: Tray | null = null;
//
// function createTray(): void {
//   const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-icon.png'));
//   tray = new Tray(icon.resize({ width: 16, height: 16 }));
//   tray.setToolTip('genty');
//   tray.setContextMenu(
//     Menu.buildFromTemplate([
//       { label: 'Open genty', click: () => { BrowserWindow.getAllWindows()[0]?.show(); } },
//       { type: 'separator' },
//       { label: 'Quit', role: 'quit' },
//     ]),
//   );
// }

// ---------------------------------------------------------------------------
// Auto-updater — stub (wire electron-updater here when release channel is ready)
// ---------------------------------------------------------------------------
// import { autoUpdater } from 'electron-updater';
//
// function initAutoUpdater(): void {
//   autoUpdater.checkForUpdatesAndNotify();
//   autoUpdater.on('update-available', () => { /* notify renderer */ });
//   autoUpdater.on('update-downloaded', () => { autoUpdater.quitAndInstall(); });
// }
