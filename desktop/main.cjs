/**
 * Sella desktop shell.
 *
 * The shop UI, auth, and entitlements stay in the Vite app.
 * This process only provides a native window for macOS and Windows.
 * Android and iOS stay on the existing Capacitor projects.
 *
 * Run against the dev server:
 *   ELECTRON_START_URL=http://127.0.0.1:8080 npx electron desktop/main.cjs
 *
 * A packaged build loads dist/ through the sella:// app protocol so
 * client-side routes survive a refresh. No auto-update server is wired;
 * installers are published only when a signed binary exists.
 */
const { app, BrowserWindow, Menu, dialog, shell, protocol, net, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const DIST = path.resolve(__dirname, "../dist");
const ICON = path.resolve(__dirname, "../public/brand/sella-icon.png");
const DEV_URL = process.env.ELECTRON_START_URL || "";

// The unpacked `electron` binary otherwise stores IndexedDB under the shared
// "Electron" profile. A second window then fails with
// "Internal error opening backing store for indexedDB.open" because LevelDB
// keeps an exclusive LOCK. Sella gets its own profile and only one process.
app.setName("Sella");
app.setPath("userData", path.join(app.getPath("appData"), "Sella"));

const gotSingleInstance = app.requestSingleInstanceLock();
if (!gotSingleInstance) {
  app.quit();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "sella",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function fileInsideDist(pathname) {
  let decoded = "/";
  try {
    decoded = decodeURIComponent(pathname || "/");
  } catch {
    return null;
  }
  const relative = decoded.replace(/^\/+/, "");
  const candidate = path.resolve(DIST, relative);
  const root = DIST.endsWith(path.sep) ? DIST : DIST + path.sep;
  if (candidate !== DIST && !candidate.startsWith(root)) return null;
  return candidate;
}

function serveDist(request) {
  const url = new URL(request.url);
  const candidate = fileInsideDist(url.pathname);
  const file = candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(DIST, "index.html");
  return net.fetch(pathToFileURL(file).toString());
}

function isAllowedNavigation(url) {
  if (DEV_URL && url.startsWith(DEV_URL)) return true;
  return url.startsWith("sella://");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: "Sella",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: process.platform === "darwin" ? { x: 16, y: 16 } : undefined,
    backgroundColor: "#F7F8FB",
    icon: fs.existsSync(ICON) ? ICON : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      return { action: "allow" };
    }
    if (/^https?:\/\//i.test(url) || url.startsWith("mailto:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (isAllowedNavigation(url)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url) || url.startsWith("mailto:")) {
      shell.openExternal(url);
    }
  });

  if (DEV_URL) {
    win.loadURL(DEV_URL);
  } else if (!fs.existsSync(path.join(DIST, "index.html"))) {
    dialog.showErrorBox(
      "Sella",
      "The web build is missing. Run npm run build, or set ELECTRON_START_URL to the Vite server."
    );
    return;
  } else {
    win.loadURL("sella://app/");
  }

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });
}

if (gotSingleInstance) {
app.on("second-instance", () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
});

app.whenReady().then(() => {
  protocol.handle("sella", serveDist);
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(process.platform === "darwin"
        ? [{ role: "appMenu", label: "Sella" }]
        : []),
      { role: "fileMenu" },
      { role: "editMenu" },
      { role: "viewMenu" },
      { role: "windowMenu" },
      {
        label: "Help",
        submenu: [
          {
            label: "About Sella",
            click: () => {
              dialog.showMessageBox({
                type: "info",
                title: "Sella",
                message: "Sella",
                detail: "Shop software by KUBANA Friend TECHNOLOGIES.\nUpdates are installed from the website when a signed build is published.",
              });
            },
          },
        ],
      },
    ])
  );
  ipcMain.handle("sella:print", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.webContents.print({ silent: false, printBackground: true });
    }
  });

  if (app.dock) app.dock.show();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
}
