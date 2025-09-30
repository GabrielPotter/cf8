// src/preload.ts
import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "./ipc/channels";
import type {
  IWorkerMessageCallback
} from "./ipc/protocol";
import type { RendererLogLevel } from "./common/logging";

const api = {
  workerMessage: (callback: IWorkerMessageCallback) => {
    ipcRenderer.on(IpcChannels.WORKER_MESSAGE, (_e, data) => {
      console.log(`worker-message ${data}`);
      callback(data.event, data.payload);
    });
  },
  readLogs: () => ipcRenderer.invoke(IpcChannels.LOGS_READ),
  readJsonFromData: (filePath: string) => ipcRenderer.invoke(IpcChannels.DATA_READ_JSON, { filePath }),
  listObjects: (rootPath?: string) => ipcRenderer.invoke(IpcChannels.OBJECTS_LIST, { rootPath }),
  writeObject: (fullPath: string, data: unknown) => ipcRenderer.invoke(IpcChannels.OBJECTS_WRITE, { fullPath, data }),
  log: (level: RendererLogLevel, message: string, ...args: unknown[]) =>
    ipcRenderer.invoke(IpcChannels.LOGS_WRITE, { level, message, args }),
  getEnvironmentInfo: () => ipcRenderer.invoke(IpcChannels.ENVIRONMENT_INFO),
  getConfigDumps: () => ipcRenderer.invoke(IpcChannels.CONFIG_DUMP),
  scanCatalog: (path: string) =>
    ipcRenderer.invoke(IpcChannels.CATALOG_SCAN, { path }),
  createFile: (directoryPath: string, fileName: string) =>
    ipcRenderer.invoke(IpcChannels.CATALOG_CREATE_FILE, { directoryPath, fileName }),
  createFolder: (directoryPath: string, folderName: string) =>
    ipcRenderer.invoke(IpcChannels.CATALOG_CREATE_FOLDER, { directoryPath, folderName }),
  deleteFile: (path: string) =>
    ipcRenderer.invoke(IpcChannels.CATALOG_DELETE_FILE, { path }),
  deleteFolder: (path: string) =>
    ipcRenderer.invoke(IpcChannels.CATALOG_DELETE_FOLDER, { path }),
  renameFile: (path: string, newName: string) =>
    ipcRenderer.invoke(IpcChannels.CATALOG_RENAME_FILE, { path, newName }),
  renameFolder: (path: string, newName: string) =>
    ipcRenderer.invoke(IpcChannels.CATALOG_RENAME_FOLDER, { path, newName }),
};

contextBridge.exposeInMainWorld("api", api);
