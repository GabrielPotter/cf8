// src/workers/workerClients.ts
import { Worker } from "node:worker_threads";
import { join } from "node:path";
import { app, BrowserWindow, webContents } from "electron"; // NOTE: runtime 'webContents'
import type { WebContents } from "electron";                 // NOTE: type-only import
import { IpcChannels } from "../ipc/channels";
import type {
  ToastMessage,
  MetricsInbound, MetricsOutbound, MetricsSnapshot,
  SearchInbound, SearchOutbound, SearchDoc,
  ImageInbound, ImageOutbound, ImageItem, Thumbnail
} from "../ipc/protocol";

type Pending = { resolve: (v:any)=>void; reject:(e:any)=>void; };

function jsPath(rel: string) {
  const base = app.isPackaged ? process.resourcesPath : __dirname;
  return join(base, rel);
}

// -----------------------------
// Push registry (channel -> scope -> webContentsId set)
// -----------------------------
const pushRegistry = new Map<IpcChannels, Map<string, Set<number>>>();

export function registerPushTarget(channel: IpcChannels, scope: string, wc: WebContents) {
  if (!pushRegistry.has(channel)) pushRegistry.set(channel, new Map());
  const byScope = pushRegistry.get(channel)!;
  if (!byScope.has(scope)) byScope.set(scope, new Set());
  byScope.get(scope)!.add(wc.id);
}

export function unregisterPushTarget(channel: IpcChannels, scope: string, wc: WebContents) {
  const byScope = pushRegistry.get(channel);
  if (!byScope) return;
  const set = byScope.get(scope);
  if (!set) return;
  set.delete(wc.id);
  if (set.size === 0) byScope.delete(scope);
  if (byScope.size === 0) pushRegistry.delete(channel);
}

function sendScoped(channel: IpcChannels, payload: any, scope?: string) {
  const byScope = pushRegistry.get(channel);
  if (!byScope) return;

  const ids = scope
    ? [...(byScope.get(scope) ?? new Set<number>())]
    : // ha nincs scope megadva, minden feliratkozottnak küldjük
      [...new Set<number>([...byScope.values()].flatMap(s => [...s]))];

  for (const id of ids) {
    const wc = webContents.fromId(id); // <-- HELYES: runtime API
    if (!wc || wc.isDestroyed()) continue;
    wc.send(channel, payload);
  }
}

// -----------------------------
// Közös alap a kérés–válasz mintához
// -----------------------------
abstract class BaseClient<Out> {
  protected worker: Worker | null = null;
  protected pending = new Map<number, Pending>();
  protected idSeq = 1;

  constructor(
    protected scriptRelPath: string,
    protected getWindow: () => BrowserWindow | null
  ) {}

  protected abstract onMessage(msg: Out): void;

  protected crash(prefix: string, err: unknown | number) {
    const win = this.getWindow();
    const message = typeof err === "number" ? `${prefix} code=${err}` : `${prefix}: ${String(err)}`;
    win?.webContents.send(IpcChannels.UI_TOAST, { severity: "error", message } as ToastMessage);
    this.worker = null;
  }

  start() {
    if (this.worker) return;
    const w = new Worker(jsPath(this.scriptRelPath));
    this.worker = w;
    w.on("message", (msg: Out) => this.onMessage(msg));
    w.on("error", (err) => this.crash("Worker error", err));
    w.on("exit", (code) => this.crash("Worker exit", code));
  }

  stop(): Promise<void> {
    const w = this.worker;
    if (!w) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => { this.worker = null; resolve(); };
      w.once("exit", () => done());
      (w as any).postMessage({ type: "shutdown" });
      setTimeout(done, 1000);
    });
  }

  protected call<T = any>(payload: any): Promise<T> {
    const w = this.worker;
    if (!w) return Promise.reject(new Error("Worker not running"));
    const id = this.idSeq++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      w.postMessage({ ...payload, id });
    });
  }

  protected resolve(id: number, result: any) {
    const p = this.pending.get(id);
    if (p) { p.resolve(result); this.pending.delete(id); }
  }

  protected reject(id: number, error: string) {
    const p = this.pending.get(id);
    if (p) { p.reject(new Error(error)); this.pending.delete(id); }
  }
}

// -----------------------------
// MetricsClient
// -----------------------------
export class MetricsClient extends BaseClient<MetricsOutbound> {
  private lastScope: string | undefined;

  constructor(getWindow: () => BrowserWindow | null) {
    super("workers/services/MetricsWorker.js", getWindow);
  }

  protected onMessage(msg: MetricsOutbound) {
    const win = this.getWindow();
    switch (msg.type) {
      case "ready":
        win?.webContents.send(IpcChannels.UI_TOAST, { severity: "success", message: "Metrics worker ready" } as ToastMessage);
        break;
      case "tick":
        sendScoped(IpcChannels.METRICS_TICK, { snapshot: msg.snapshot }, this.lastScope);
        break;
      case "rpcResult":
        this.resolve(msg.id, msg.result);
        break;
      case "rpcError":
        this.reject(msg.id, msg.error);
        break;
      case "error":
        win?.webContents.send(IpcChannels.UI_TOAST, { severity: "error", message: `Metrics error: ${msg.error}` } as ToastMessage);
        break;
    }
  }

  startMonitoring(intervalMs?: number, scope?: string) {
    if (scope) this.lastScope = scope;
    this.worker?.postMessage({ type: "startMonitoring", intervalMs } satisfies MetricsInbound);
  }
  stopMonitoring(scope?: string) {
    if (scope) this.lastScope = scope;
    this.worker?.postMessage({ type: "stopMonitoring" } satisfies MetricsInbound);
  }
  getSnapshot(): Promise<MetricsSnapshot> {
    return this.call<MetricsSnapshot>({ type: "getSnapshot" } satisfies Partial<MetricsInbound>);
  }
}

// -----------------------------
// SearchClient
// -----------------------------
export class SearchClient extends BaseClient<SearchOutbound> {
  private lastScope: string | undefined;

  constructor(getWindow: () => BrowserWindow | null) {
    super("workers/services/SearchWorker.js", getWindow);
  }

  protected onMessage(msg: SearchOutbound) {
    const win = this.getWindow();
    switch (msg.type) {
      case "ready":
        win?.webContents.send(IpcChannels.UI_TOAST, { severity: "success", message: "Search worker ready" } as ToastMessage);
        break;
      case "indexed":
        sendScoped(IpcChannels.SEARCH_INDEXED, { count: msg.count }, this.lastScope);
        break;
      case "progress":
        sendScoped(IpcChannels.SEARCH_PROGRESS, { current: msg.current, total: msg.total }, this.lastScope);
        break;
      case "rpcResult":
        this.resolve(msg.id, msg.result);
        break;
      case "rpcError":
        this.reject(msg.id, msg.error);
        break;
      case "error":
        win?.webContents.send(IpcChannels.UI_TOAST, { severity: "error", message: `Search error: ${msg.error}` } as ToastMessage);
        break;
    }
  }

  indexDocs(docs: SearchDoc[], scope?: string) {
    if (scope) this.lastScope = scope;
    return this.call<boolean>({ type: "indexDocs", docs } satisfies Partial<SearchInbound>);
  }
  search(query: string, scope?: string) {
    if (scope) this.lastScope = scope;
    return this.call<string[]>({ type: "search", query } satisfies Partial<SearchInbound>);
  }
  clear(scope?: string) {
    if (scope) this.lastScope = scope;
    return this.call<boolean>({ type: "clear" } satisfies Partial<SearchInbound>);
  }
}

// -----------------------------
// ImageClient
// -----------------------------
export class ImageClient extends BaseClient<ImageOutbound> {
  private lastScope: string | undefined;

  constructor(getWindow: () => BrowserWindow | null) {
    super("workers/services/ImageWorker.js", getWindow);
  }

  protected onMessage(msg: ImageOutbound) {
    const win = this.getWindow();
    switch (msg.type) {
      case "ready":
        win?.webContents.send(IpcChannels.UI_TOAST, { severity: "success", message: "Image worker ready" } as ToastMessage);
        break;
      case "completed":
        sendScoped(IpcChannels.IMAGE_COMPLETED, { id: msg.id, thumb: msg.thumb }, this.lastScope);
        break;
      case "rpcResult":
        this.resolve(msg.id, msg.result);
        break;
      case "rpcError":
        this.reject(msg.id, msg.error);
        break;
      case "error":
        sendScoped(IpcChannels.IMAGE_ERROR, { error: msg.error }, this.lastScope);
        break;
    }
  }

  generate(item: ImageItem, scope?: string) {
    if (scope) this.lastScope = scope;
    return this.call<Thumbnail>({ type: "generate", item } satisfies Partial<ImageInbound>);
  }
  list(scope?: string) {
    if (scope) this.lastScope = scope;
    return this.call<Thumbnail[]>({ type: "list" } satisfies Partial<ImageInbound>);
  }
  clear(scope?: string) {
    if (scope) this.lastScope = scope;
    return this.call<boolean>({ type: "clear" } satisfies Partial<ImageInbound>);
  }
}
