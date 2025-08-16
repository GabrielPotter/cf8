import { BrowserWindow } from "electron";
import * as path from "node:path";
import * as url from "node:url";
import { setWindow, removeWindow } from "./windows";

const isDev = !!process.env.VITE_DEV_SERVER_URL;

export async function createMainWindow() {
  // dist/windows/createWindow.js → __dirname = "<repo>/dist/windows"
  // preload a dist/preload/preload.js alatt van
  const preloadPath = path.join(__dirname, "..", "preload", "preload.js");

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 640,
    title: "cf8",
    backgroundColor: "#1e1e1e",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath
    },
    show: false
  });

  setWindow("main", win);

  win.on("ready-to-show", () => win.show());
  win.on("closed", () => removeWindow("main"));

  try {
    if (isDev && process.env.VITE_DEV_SERVER_URL) {
      await win.loadURL(process.env.VITE_DEV_SERVER_URL);
      win.webContents.openDevTools({ mode: "detach" });
    } else {
      // IMPORTANT: ne keresse dist/windows/index.html-t, hanem dist/index.html-t
      const indexFileUrl = url.pathToFileURL(
        path.join(__dirname, "..", "index.html")
      ).toString();
      await win.loadURL(indexFileUrl);
    }
  } catch (err) {
    // Hasznos log, ha valami félremegy
    console.error("Failed to load renderer:", err);
  }

  return win;
}
