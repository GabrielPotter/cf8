import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import { IpcChannels } from "./ipc/channels";
import type { ToastMessage, ImageItem, SearchDoc } from "./ipc/protocol";
import { MetricsClient, SearchClient, ImageClient, registerPushTarget, unregisterPushTarget } from "./workers/workerClients";

let mainWindow: BrowserWindow | null = null;
let metricsWindow: BrowserWindow | null = null;
let searchWindow: BrowserWindow | null = null;

const getWindow = () => mainWindow;
const metrics = new MetricsClient(getWindow);
const search = new SearchClient(getWindow);
const image = new ImageClient(getWindow);

function createRendererWindow(opts: { title: string; view: "main"|"metrics"|"search"; width?: number; height?: number; }): BrowserWindow {
  const win = new BrowserWindow({
    width: opts.width ?? 1280,
    height: opts.height ?? 860,
    title: opts.title,
    webPreferences: { preload: join(__dirname, "preload.js"), sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  if (app.isPackaged) win.loadFile(join(__dirname, "renderer/index.html"), { query: { view: opts.view } });
  else win.loadURL(`http://localhost:5173/?view=${opts.view}`);
  win.on("closed", () => {
    if (win === mainWindow) mainWindow = null;
    if (win === metricsWindow) metricsWindow = null;
    if (win === searchWindow) searchWindow = null;
  });
  return win;
}

function createMainWindow() { mainWindow = createRendererWindow({ title: "cf8 – Main", view: "main" }); }
function focusOrCreate(view: "metrics" | "search") {
  if (view === "metrics") { if (metricsWindow && !metricsWindow.isDestroyed()) { metricsWindow.show(); metricsWindow.focus(); return true; }
    metricsWindow = createRendererWindow({ title: "Metrics Monitor", view: "metrics", width: 900, height: 700 }); return true; }
  if (view === "search") { if (searchWindow && !searchWindow.isDestroyed()) { searchWindow.show(); searchWindow.focus(); return true; }
    searchWindow = createRendererWindow({ title: "Search Console", view: "search", width: 1000, height: 720 }); return true; }
  return false;
}

app.whenReady().then(() => {
  createMainWindow();
  metrics.start(); search.start(); image.start();
  mainWindow?.webContents.send(IpcChannels.UI_TOAST, { severity: "info", message: "Starting workers..." } as ToastMessage);
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
});

app.on("window-all-closed", async () => {
  await Promise.all([metrics.stop(), search.stop(), image.stop()]);
  if (process.platform !== "darwin") app.quit();
});

// Global
ipcMain.handle(IpcChannels.WORKERS_START_ALL, async () => { metrics.start(); search.start(); image.start(); return true; });
ipcMain.handle(IpcChannels.WORKERS_STOP_ALL, async () => { await Promise.all([metrics.stop(), search.stop(), image.stop()]); return true; });

// Metrics (scope opcionális – csak a routinghoz)
ipcMain.handle(IpcChannels.METRICS_START, (_e, { intervalMs, scope }: { intervalMs?: number; scope?: string }) => { metrics.startMonitoring(intervalMs, scope); return true; });
ipcMain.handle(IpcChannels.METRICS_STOP, (_e, { scope }: { scope?: string }) => { metrics.stopMonitoring(scope); return true; });
ipcMain.handle(IpcChannels.METRICS_GET_SNAPSHOT, async () => metrics.getSnapshot());

// Search
ipcMain.handle(IpcChannels.SEARCH_INDEX_DOCS, async (_e, { docs, scope }: { docs: SearchDoc[]; scope?: string }) => search.indexDocs(docs, scope));
ipcMain.handle(IpcChannels.SEARCH_QUERY, async (_e, { query, scope }: { query: string; scope?: string }) => search.search(query, scope));
ipcMain.handle(IpcChannels.SEARCH_CLEAR, async (_e, { scope }: { scope?: string }) => search.clear(scope));

// Image
ipcMain.handle(IpcChannels.IMAGE_GENERATE, async (_e, { item, scope }: { item: ImageItem; scope?: string }) => image.generate(item, scope));
ipcMain.handle(IpcChannels.IMAGE_LIST, async (_e, { scope }: { scope?: string }) => image.list(scope));
ipcMain.handle(IpcChannels.IMAGE_CLEAR, async (_e, { scope }: { scope?: string }) => image.clear(scope));

// Windows
ipcMain.handle(IpcChannels.WINDOW_OPEN, (_e, { view }: { view: "metrics" | "search" }) => focusOrCreate(view));
ipcMain.handle(IpcChannels.WINDOW_FOCUS_OR_CREATE, (_e, { view }: { view: "metrics" | "search" }) => focusOrCreate(view));

// Push routing registry
ipcMain.handle(IpcChannels.PUSH_REGISTER, (event, { channel, scope }: { channel: IpcChannels; scope: string }) => {
  registerPushTarget(channel, scope, event.sender);
  return true;
});
ipcMain.handle(IpcChannels.PUSH_UNREGISTER, (event, { channel, scope }: { channel: IpcChannels; scope: string }) => {
  unregisterPushTarget(channel, scope, event.sender);
  return true;
});
