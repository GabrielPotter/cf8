// src/preload.ts
import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "./ipc/channels";
import type {
  T1RequestParams, T2RequestParams, T3RequestParams, CommandRequest,
  LifecycleEvent, TimedPush
} from "./ipc/protocol";

const api = {
  // Toast a fő ablakban (notistack bridge)
  onToast: (cb: (msg: { message: string; variant?: "default"|"error"|"success"|"warning"|"info" }) => void) => {
    const h = (_: any, t: any) => cb(t);
    ipcRenderer.on(IpcChannels.UI_TOAST, h);
    return () => ipcRenderer.removeListener(IpcChannels.UI_TOAST, h);
  },

  // Közvetlen toast küldése a rendererben
  toast: (msg: { message: string; variant?: "default"|"error"|"success"|"warning"|"info" }) => {
    ipcRenderer.emit(IpcChannels.UI_TOAST, undefined, msg);
  },

  // Lifecycle pushok – csak ha külön is hallgatnád
  onLifecycle: (service: "t1"|"t2"|"t3", cb: (ev: LifecycleEvent) => void) => {
    const ch = service === "t1" ? IpcChannels.T1_LIFECYCLE : service === "t2" ? IpcChannels.T2_LIFECYCLE : IpcChannels.T3_LIFECYCLE;
    const h = (_: any, ev: LifecycleEvent) => cb(ev);
    ipcRenderer.on(ch, h);
    return () => ipcRenderer.removeListener(ch, h);
  },

  // Timed push (feliratkozóknak)
  onTimed: (service: "t1"|"t2"|"t3", cb: (p: TimedPush) => void) => {
    const ch = service === "t1" ? IpcChannels.T1_TIMED : service === "t2" ? IpcChannels.T2_TIMED : IpcChannels.T3_TIMED;
    const h = (_: any, p: TimedPush) => cb(p);
    ipcRenderer.on(ch, h);
    return () => ipcRenderer.removeListener(ch, h);
  },

  // Fel-/leiratkozás push routingra
  registerPush: (channel: IpcChannels, scope: string) =>
    ipcRenderer.invoke(IpcChannels.PUSH_REGISTER, { channel, scope }) as Promise<boolean>,
  unregisterPush: (channel: IpcChannels, scope: string) =>
    ipcRenderer.invoke(IpcChannels.PUSH_UNREGISTER, { channel, scope }) as Promise<boolean>,

  // Ablakok
  openWin1: () => ipcRenderer.invoke(IpcChannels.WINDOW_OPEN, { view: "win1" as const }) as Promise<boolean>,
  openWin2: () => ipcRenderer.invoke(IpcChannels.WINDOW_OPEN, { view: "win2" as const }) as Promise<boolean>,

  // Workers start/stop – ha használod a fő ablakból
  startAllWorkers: () => ipcRenderer.invoke(IpcChannels.WORKERS_START_ALL) as Promise<boolean>,
  stopAllWorkers: () => ipcRenderer.invoke(IpcChannels.WORKERS_STOP_ALL) as Promise<boolean>,

  // RPC skeletonok
  t1Request: (params: T1RequestParams, scope?: string) =>
    ipcRenderer.invoke(IpcChannels.T1_REQUEST, { params, scope }) as Promise<string>,
  t2Request: (params: T2RequestParams, scope?: string) =>
    ipcRenderer.invoke(IpcChannels.T2_REQUEST, { params, scope }) as Promise<string>,
  t3Request: (params: T3RequestParams, scope?: string) =>
    ipcRenderer.invoke(IpcChannels.T3_REQUEST, { params, scope }) as Promise<string>,

  // Command skeletonok
  t1Command: (command: string, scope?: string) =>
    ipcRenderer.invoke(IpcChannels.T1_COMMAND, { command, scope }) as Promise<string>,
  t2Command: (command: string, scope?: string) =>
    ipcRenderer.invoke(IpcChannels.T2_COMMAND, { command, scope }) as Promise<string>,
  t3Command: (command: string, scope?: string) =>
    ipcRenderer.invoke(IpcChannels.T3_COMMAND, { command, scope }) as Promise<string>,
};

contextBridge.exposeInMainWorld("api", api);
