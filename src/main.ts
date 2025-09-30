import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { IpcChannels } from "./ipc/channels";
//import { T1Client, T2Client, T3Client, registerPushTarget, unregisterPushTarget } from "./workers/workerClients";
//import type { T1RequestParams, T2RequestParams, T3RequestParams, CommandRequest } from "./ipc/protocol";
import { SystemConfig } from "./common/system-config";
import { UserConfig } from "./common/user-config";
import { WindowFactory } from "./windows/window-factory";
import log from "electron-log";
import { isRendererLogLevel } from "./common/logging";
import { environmentInfo } from "./workers/environmentInfo";
import { catalogScanner } from "./workers/catalogScanner";
import { objectScanner } from "./workers/objectScanner";

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

app.setName("cf8")

Object.assign(console, log.functions);

log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath('logs'), 'app.log');

ipcMain.handle(IpcChannels.LOGS_READ, async () => {
  try {
    const entries = log.transports.file.readAllLogs();
    return { success: true, entries };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("Failed to read logs", message);
    return { success: false, error: message };
  }
});

ipcMain.handle(
  IpcChannels.LOGS_WRITE,
  async (
    _event,
    payload: { level?: string; message?: string; args?: unknown[] } = {}
  ) => {
    const level = isRendererLogLevel(payload.level) ? payload.level : "info";
    const message = typeof payload.message === "string" ? payload.message : "";
    const args = Array.isArray(payload.args) ? payload.args : [];

    try {
      const logFn = log[level] ?? log.info;
      logFn(`[renderer] ${message}`, ...args);
      return { success: true };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      log.error("Failed to write renderer log", errMessage, { payload });
      return { success: false, error: errMessage };
    }
  }
);

ipcMain.handle(
  IpcChannels.DATA_READ_JSON,
  async (_event, payload: { filePath: string }) => {
    const relativePath = payload?.filePath ?? "";
    try {
      if (!relativePath) {
        throw new Error("File path is required");
      }
      if (path.isAbsolute(relativePath)) {
        throw new Error("Path must be relative to the assets directory");
      }

      const assetsDir = path.join(app.getAppPath(), "assets");
      const resolvedPath = path.resolve(assetsDir, relativePath);
      const relativeToAssets = path.relative(assetsDir, resolvedPath);
      if (relativeToAssets.startsWith("..") || path.isAbsolute(relativeToAssets)) {
        throw new Error("Invalid file path");
      }

      const fileContent = await readFile(resolvedPath, "utf8");
      return JSON.parse(fileContent) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to read JSON data", message, { filePath: relativePath });
      throw error;
    }
  }
);

ipcMain.handle(
  IpcChannels.OBJECTS_LIST,
  async (_event, payload: { rootPath?: string }) => {
    try {
      const items = await objectScanner.listObjects(payload?.rootPath);
      return { success: true, items };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to list object catalog", message, { rootPath: payload?.rootPath });
      return { success: false, error: message };
    }
  }
);

ipcMain.handle(
  IpcChannels.OBJECTS_WRITE,
  async (_event, payload: { fullPath: string; data: unknown }) => {
    const fullPath = payload?.fullPath;
    try {
      if (!fullPath) {
        throw new Error("File path is required");
      }
      const resolvedPath = path.resolve(fullPath);
      const json = JSON.stringify(payload?.data ?? null, null, 2);
      await writeFile(resolvedPath, `${json}\n`, "utf8");
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to write object catalog file", message, { fullPath });
      return { success: false, error: message };
    }
  }
);

ipcMain.handle(IpcChannels.ENVIRONMENT_INFO, async () => {
  try {
    return { success: true, data: environmentInfo.getSnapshot({ refresh: true }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("Failed to collect environment info", message);
    return { success: false, error: message };
  }
});

ipcMain.handle(IpcChannels.CONFIG_DUMP, async () => {
  try {
    const system = SystemConfig.instance().dump();
    const user = UserConfig.instance().dump();
    return { success: true, system, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("Failed to collect config dumps", message);
    return { success: false, error: message };
  }
});

ipcMain.handle(
  IpcChannels.CATALOG_SCAN,
  async (_event, payload: { path: string }) => {
    const folderPath = payload?.path;
    try {
      const tree = await catalogScanner.scan(folderPath);
      return { success: true, tree };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to scan catalog", message, { folderPath });
      return { success: false, error: message };
    }
  }
);

ipcMain.handle(
  IpcChannels.CATALOG_CREATE_FILE,
  async (_event, payload: { directoryPath: string; fileName: string }) => {
    try {
      const fullPath = await catalogScanner.createFile(payload?.directoryPath ?? "", payload?.fileName ?? "");
      return { success: true, fullPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to create file", message, { directoryPath: payload?.directoryPath, fileName: payload?.fileName });
      return { success: false, error: message };
    }
  }
);

ipcMain.handle(
  IpcChannels.CATALOG_CREATE_FOLDER,
  async (_event, payload: { directoryPath: string; folderName: string }) => {
    try {
      const fullPath = await catalogScanner.createFolder(payload?.directoryPath ?? "", payload?.folderName ?? "");
      return { success: true, fullPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to create folder", message, { directoryPath: payload?.directoryPath, folderName: payload?.folderName });
      return { success: false, error: message };
    }
  }
);

ipcMain.handle(
  IpcChannels.CATALOG_DELETE_FILE,
  async (_event, payload: { path: string }) => {
    try {
      await catalogScanner.deleteFile(payload?.path ?? "");
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to delete file", message, { path: payload?.path });
      return { success: false, error: message };
    }
  }
);

ipcMain.handle(
  IpcChannels.CATALOG_DELETE_FOLDER,
  async (_event, payload: { path: string }) => {
    try {
      await catalogScanner.deleteFolder(payload?.path ?? "");
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to delete folder", message, { path: payload?.path });
      return { success: false, error: message };
    }
  }
);

ipcMain.handle(
  IpcChannels.CATALOG_RENAME_FILE,
  async (_event, payload: { path: string; newName: string }) => {
    try {
      const fullPath = await catalogScanner.renameFile(payload?.path ?? "", payload?.newName ?? "");
      return { success: true, fullPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to rename file", message, { path: payload?.path, newName: payload?.newName });
      return { success: false, error: message };
    }
  }
);

ipcMain.handle(
  IpcChannels.CATALOG_RENAME_FOLDER,
  async (_event, payload: { path: string; newName: string }) => {
    try {
      const fullPath = await catalogScanner.renameFolder(payload?.path ?? "", payload?.newName ?? "");
      return { success: true, fullPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to rename folder", message, { path: payload?.path, newName: payload?.newName });
      return { success: false, error: message };
    }
  }
);

app.whenReady().then(() => {
    log.info('App started', { version: app.getVersion() });
    const wmanager = WindowFactory._new();
    const mainWin = wmanager.createWindow("main");
    console.log(wmanager.listWindows());
    mainWin.webContents.once("did-finish-load", () => {
        mainWin.webContents.send(IpcChannels.WORKER_MESSAGE, {event:"success",payload:"huhuka"});
        const cfg = UserConfig._new();
        const ver = cfg.get<string>("version");
        if (ver) {
            mainWin.webContents.send(IpcChannels.WORKER_MESSAGE, {event:"info",payload:ver});
        }else {
            mainWin.webContents.send(IpcChannels.WORKER_MESSAGE, {event:"error",payload:"unknown version"});
        }
    });
});

// app.on("window-all-closed", async () => {
//     await Promise.all([t1.stop(), t2.stop(), t3.stop()]);
//     if (process.platform !== "darwin") app.quit();
// });

// // ---- windows
// ipcMain.handle(IpcChannels.WINDOW_OPEN, (_e, { view }: { view: "win1" | "win2" }) => {
//     console.log("got window open message", view);
//     if (view === "win1") {
//         if (!win1 || win1.isDestroyed()) win1 = createWindow("win1");
//         else {
//             win1.show();
//             win1.focus();
//         }
//     }
//     if (view === "win2") {
//         if (!win2 || win2.isDestroyed()) win2 = createWindow("win2");
//         else {
//             win2.show();
//             win2.focus();
//         }
//     }
//     return true;
// });
// ipcMain.handle(IpcChannels.WINDOW_FOCUS_OR_CREATE, (_e, { view }: { view: "win1" | "win2" }) => {
//     return ipcMain.emit(IpcChannels.WINDOW_OPEN, _e, { view });
// });

// // ---- push registry (timed push subscriptions)
// ipcMain.handle(IpcChannels.PUSH_REGISTER, (event, { channel, scope }: { channel: IpcChannels; scope: string }) => {
//     registerPushTarget(channel, scope, event.sender);
//     return true;
// });
// ipcMain.handle(IpcChannels.PUSH_UNREGISTER, (event, { channel, scope }: { channel: IpcChannels; scope: string }) => {
//     unregisterPushTarget(channel, scope, event.sender);
//     return true;
// });

// // ---- workers control
// ipcMain.handle(IpcChannels.WORKERS_START_ALL, async () => {
//     t1.start(1500);
//     t2.start(2500);
//     t3.start(3500);
//     return true;
// });
// ipcMain.handle(IpcChannels.WORKERS_STOP_ALL, async () => {
//     await Promise.all([t1.stop(), t2.stop(), t3.stop()]);
//     return true;
// });

// // ---- RPC request/command skeletons
// ipcMain.handle(IpcChannels.T1_REQUEST, async (_e, { params, scope }: { params: T1RequestParams; scope?: string }) =>
//     t1.request(params, scope)
// );
// ipcMain.handle(IpcChannels.T2_REQUEST, async (_e, { params, scope }: { params: T2RequestParams; scope?: string }) =>
//     t2.request(params, scope)
// );
// ipcMain.handle(IpcChannels.T3_REQUEST, async (_e, { params, scope }: { params: T3RequestParams; scope?: string }) =>
//     t3.request(params, scope)
// );

// ipcMain.handle(IpcChannels.T1_COMMAND, async (_e, { command, scope }: CommandRequest & { scope?: string }) =>
//     t1.command({ command }, scope)
// );
// ipcMain.handle(IpcChannels.T2_COMMAND, async (_e, { command, scope }: CommandRequest & { scope?: string }) =>
//     t2.command({ command }, scope)
// );
// ipcMain.handle(IpcChannels.T3_COMMAND, async (_e, { command, scope }: CommandRequest & { scope?: string }) =>
//     t3.command({ command }, scope)
// );
