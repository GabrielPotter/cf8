import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "./ipc/channels";
import type { ToastMessage, MetricsSnapshot, SearchDoc, ImageItem, Thumbnail } from "./ipc/protocol";

const api = {
  // Global
  startAllWorkers: () => ipcRenderer.invoke(IpcChannels.WORKERS_START_ALL),
  stopAllWorkers: () => ipcRenderer.invoke(IpcChannels.WORKERS_STOP_ALL),

  // Metrics (scope opcionális, csak routinghoz használjuk a mainben)
  metricsStart: (intervalMs?: number, scope?: string) =>
    ipcRenderer.invoke(IpcChannels.METRICS_START, { intervalMs, scope }),
  metricsStop: (scope?: string) =>
    ipcRenderer.invoke(IpcChannels.METRICS_STOP, { scope }),
  metricsGetSnapshot: (): Promise<MetricsSnapshot> =>
    ipcRenderer.invoke(IpcChannels.METRICS_GET_SNAPSHOT),
  onMetricsTick: (cb: (snap: MetricsSnapshot) => void) => {
    const h = (_: any, data: { snapshot: MetricsSnapshot }) => cb(data.snapshot);
    ipcRenderer.on(IpcChannels.METRICS_TICK, h);
    return () => ipcRenderer.removeListener(IpcChannels.METRICS_TICK, h);
    // FONTOS: a push routing csak a mainben szűr; itt közvetlenül nem kell a scope
  },

  // Search
  searchIndexDocs: (docs: SearchDoc[], scope?: string) =>
    ipcRenderer.invoke(IpcChannels.SEARCH_INDEX_DOCS, { docs, scope }) as Promise<boolean>,
  searchQuery: (query: string, scope?: string) =>
    ipcRenderer.invoke(IpcChannels.SEARCH_QUERY, { query, scope }) as Promise<string[]>,
  searchClear: (scope?: string) =>
    ipcRenderer.invoke(IpcChannels.SEARCH_CLEAR, { scope }) as Promise<boolean>,
  onSearchIndexed: (cb: (count: number) => void) => {
    const h = (_:any, data:{count:number}) => cb(data.count);
    ipcRenderer.on(IpcChannels.SEARCH_INDEXED, h);
    return () => ipcRenderer.removeListener(IpcChannels.SEARCH_INDEXED, h);
  },
  onSearchProgress: (cb: (current:number,total:number)=>void) => {
    const h = (_:any, data:{current:number,total:number}) => cb(data.current, data.total);
    ipcRenderer.on(IpcChannels.SEARCH_PROGRESS, h);
    return () => ipcRenderer.removeListener(IpcChannels.SEARCH_PROGRESS, h);
  },

  // Image
  imageGenerate: (item: ImageItem, scope?: string) =>
    ipcRenderer.invoke(IpcChannels.IMAGE_GENERATE, { item, scope }) as Promise<Thumbnail>,
  imageList: (scope?: string) =>
    ipcRenderer.invoke(IpcChannels.IMAGE_LIST, { scope }) as Promise<Thumbnail[]>,
  imageClear: (scope?: string) =>
    ipcRenderer.invoke(IpcChannels.IMAGE_CLEAR, { scope }) as Promise<boolean>,
  onImageCompleted: (cb: (id:string, thumb: Thumbnail) => void) => {
    const h = (_:any, data:{id:string;thumb:Thumbnail}) => cb(data.id, data.thumb);
    ipcRenderer.on(IpcChannels.IMAGE_COMPLETED, h);
    return () => ipcRenderer.removeListener(IpcChannels.IMAGE_COMPLETED, h);
  },
  onImageError: (cb: (error: string) => void) => {
    const h = (_:any, data:{error:string}) => cb(data.error);
    ipcRenderer.on(IpcChannels.IMAGE_ERROR, h);
    return () => ipcRenderer.removeListener(IpcChannels.IMAGE_ERROR, h);
  },

  // UI toast
  onToast: (cb: (t: ToastMessage) => void) => {
    const h = (_:any, t: ToastMessage) => cb(t);
    ipcRenderer.on(IpcChannels.UI_TOAST, h);
    return () => ipcRenderer.removeListener(IpcChannels.UI_TOAST, h);
  },

  // Windows
  openWindow: (view: "metrics" | "search") =>
    ipcRenderer.invoke(IpcChannels.WINDOW_OPEN, { view }),
  focusOrCreateWindow: (view: "metrics" | "search") =>
    ipcRenderer.invoke(IpcChannels.WINDOW_FOCUS_OR_CREATE, { view }),

  // Push routing registry
  registerPush: (channel: IpcChannels, scope: string) =>
    ipcRenderer.invoke(IpcChannels.PUSH_REGISTER, { channel, scope }),
  unregisterPush: (channel: IpcChannels, scope: string) =>
    ipcRenderer.invoke(IpcChannels.PUSH_UNREGISTER, { channel, scope }),
};

contextBridge.exposeInMainWorld("api", api);
