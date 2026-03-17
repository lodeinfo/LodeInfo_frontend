const { app, BrowserWindow, globalShortcut, Tray, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

app.commandLine.appendSwitch("disable-features", "Autofill");
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

let mainWindow = null;
let floatingWindow = null;
let tray = null;

const iconPath = path.resolve(__dirname, "public", "LodeInfo (3).ico");

/* ---------------- MAIN WINDOW ---------------- */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    icon: iconPath,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadURL("https://lodeinfofrontend.vercel.app/");
  }

  mainWindow.maximize();

  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    }
  });

  mainWindow.on("show", () => {
    mainWindow.setSkipTaskbar(false);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/* ---------------- FLOATING WINDOW ---------------- */

function sendContextToWindow(intent) {
  if (!floatingWindow) return;

  const contextPayload = {
    intent,
    windowTitle: BrowserWindow.getFocusedWindow()?.getTitle() || null,
    timestamp: Date.now(),
  };

  floatingWindow.webContents.send("context-data", contextPayload);
}

function createFloatingWindow(intent = "manual") {
  const isDev = !app.isPackaged;

  const targetURL = isDev
    ? `http://localhost:5173/quick-input?intent=${intent}`
    : `https://lodeinfofrontend.vercel.app/quick-input?intent=${intent}`;

  /* ✅ NEW → Contextual sizing logic */
  const isContextual = intent === "contextual";

  const windowWidth = isContextual ? 1000 : 780;
  const windowHeight = isContextual ? 520 : 380;

  if (floatingWindow) {
    if (isDev) {
      floatingWindow.loadURL(targetURL);
    }

    /* ✅ Resize dynamically when reused */
    floatingWindow.setResizable(true); // Temporarily allow resize
    floatingWindow.setSize(windowWidth, windowHeight);
    floatingWindow.setResizable(false); // Lock it back
    floatingWindow.center(); // Center on current monitor

    floatingWindow.show();
    floatingWindow.focus();

    sendContextToWindow(intent);
    return;
  }

  floatingWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    icon: iconPath,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    floatingWindow.loadURL(targetURL);
  } else {
    floatingWindow.loadFile(path.join(__dirname, "dist", "index.html"), {
      hash: `/quick-input?intent=${intent}`,
    });
  }

  floatingWindow.once("ready-to-show", () => {
    floatingWindow.show();
    floatingWindow.focus();

    sendContextToWindow(intent);
  });

  floatingWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      floatingWindow.hide();
    }
  });

  floatingWindow.on("closed", () => {
    floatingWindow = null;
  });
}

/* ---------------- APP READY ---------------- */

app.whenReady().then(() => {
  createWindow();

  try {
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);

      const trayMenu = Menu.buildFromTemplate([
        {
          label: "Open App",
          click: () => {
            if (mainWindow) mainWindow.show();
          },
        },
        {
          label: "Quit",
          click: () => {
            app.isQuiting = true;
            app.quit();
          },
        },
      ]);

      tray.setToolTip("LodeInfo");
      tray.setContextMenu(trayMenu);

      tray.on("click", () => {
        if (mainWindow) mainWindow.show();
      });
    }
  } catch (error) {
    console.error("Tray failed:", error.message);
  }

  globalShortcut.register("Control+L", () => {
    console.log("✅ Ctrl + L pressed");
    createFloatingWindow("manual");
  });

  /* 
     REMOVED: Ctrl+Shift+L global registration.
     Handling via unified local server trigger for Chrome Extension.
  */
});

/* ---------------- LOCAL COMMAND SERVER ---------------- */
// Allows the Chrome extension to trigger the Electron app
const http = require("http");
http
  .createServer((req, res) => {
    if (req.url === "/show") {
      console.log(
        "📡 Remote trigger received from extension: Showing interface",
      );
      createFloatingWindow("contextual");
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
    } else {
      console.log(`⚠️ Received unknown request on local server: ${req.url}`);
      res.writeHead(404);
      res.end();
    }
  })
  .listen(8001, "127.0.0.1", () => {
    console.log("🏁 LodeInfo local trigger server listening on 127.0.0.1:8001");
  });

/* ---------------- CLEANUP ---------------- */

app.on("before-quit", () => {
  app.isQuiting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
