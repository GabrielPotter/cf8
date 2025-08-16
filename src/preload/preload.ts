import { contextBridge, ipcRenderer } from "electron";
import type { Api, CatalogNode } from "../shared/types";

const api: Api = {
  getVersion() {
    return ipcRenderer.invoke("app:getVersion");
  },
  scanCatalog(rootPath: string): Promise<CatalogNode> {
    return ipcRenderer.invoke("catalog:scan", rootPath);
  },
   readJsonFromData(fileName: string): Promise<any> {
    return ipcRenderer.invoke("data:readJson", fileName);
  }
};

contextBridge.exposeInMainWorld("api", api);
