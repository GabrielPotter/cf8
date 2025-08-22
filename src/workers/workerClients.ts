import { Worker } from "node:worker_threads";
import { join } from "node:path";
import { app, BrowserWindow, webContents } from "electron";
import type { WebContents } from "electron";
import { IpcChannels } from "../ipc/channels";
import type {
  LifecycleEvent, TimedPush, RpcEchoResponse,
  T1RequestParams, T2RequestParams, T3RequestParams,
  CommandRequest
} from "../ipc/protocol";

type Pending = { resolve: (v:any)=>void; reject:(e:any)=>void; };

function jsPath(rel: string) {
  const base = app.isPackaged ? process.resourcesPath : __dirname;
  return join(base, rel);
}

// ---- push registry
const pushRegistry = new Map<IpcChannels, Map<string, Set<number>>>();
function registerPushTarget(channel: IpcChannels, scope: string, wc: WebContents) {
  if (!pushRegistry.has(channel)) pushRegistry.set(channel, new Map());
  const byScope = pushRegistry.get(channel)!;
  if (!byScope.has(scope)) byScope.set(scope, new Set());
  byScope.get(scope)!.add(wc.id);
}
function unregisterPushTarget(channel: IpcChannels, scope: string, wc: WebContents) {
  const byScope = pushRegistry.get(channel); if (!byScope) return;
  const set = byScope.get(scope); if (!set) return;
  set.delete(wc.id);
  if (set.size === 0) byScope.delete(scope);
  if (byScope.size === 0) pushRegistry.delete(channel);
}
function sendScoped(channel: IpcChannels, payload: any, scope?: string) {
  const byScope = pushRegistry.get(channel);
  if (!byScope) return;
  const targets = scope ? byScope.get(scope) : undefined;
  const ids = scope ? (targets ? [...targets] : []) : [...new Set([...byScope.values()].flatMap(s => [...s]))];
  for (const id of ids) {
    const wc = webContents.fromId(id);
    if (!wc || wc.isDestroyed()) continue;
    wc.send(channel, payload);
  }
}

// ---- helpers
function broadcastLifecycleToAllWindows(ev: LifecycleEvent) {
  const ch = ev.service === "t1" ? IpcChannels.T1_LIFECYCLE
           : ev.service === "t2" ? IpcChannels.T2_LIFECYCLE
           : IpcChannels.T3_LIFECYCLE;
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(ch, ev);
  }
}

// ---- base client
abstract class BaseClient<Out> {
  protected worker: Worker | null = null;
  protected pending = new Map<number, Pending>();
  protected idSeq = 1;
  constructor(
    protected scriptRelPath: string,
    protected getMain: () => BrowserWindow | null
  ) {}
  protected abstract onMessage(msg: Out): void;

  protected lifecycle(ev: LifecycleEvent) {
    // 1) minden ablak megkapja a lifecycle csatornát
    broadcastLifecycleToAllWindows(ev);
    // 2) notistack toast CSAK a fő ablakban
    const main = this.getMain();
    const variant = ev.status === "error" ? "error" : ev.status === "started" ? "success" : "info";
    const text = `[${ev.service}] ${ev.status}${ev.message ? `: ${ev.message}` : ""}`;
    main?.webContents.send(IpcChannels.UI_TOAST, { message: text, variant });
  }

  start(delayMs?: number) {
    if (this.worker) return;
    const w = new Worker(jsPath(this.scriptRelPath));
    this.worker = w;
    w.on("message", (msg: Out) => this.onMessage(msg));
    w.on("error", () => this.lifecycle({ service: this.serviceName(), status: "error", message: "crash" }));
    w.on("exit", () => this.lifecycle({ service: this.serviceName(), status: "stopped" }));
    // init után fog a worker 'started'-et küldeni — így nincs versenyhelyzet
    (w as any).postMessage({ type: "init", delayMs });
  }

  stop(): Promise<void> {
    const w = this.worker; if (!w) return Promise.resolve();
    return new Promise<void>((resolve) => {
      w.once("exit", () => { this.worker = null; resolve(); });
      (w as any).postMessage({ type: "shutdown" });
      setTimeout(() => { this.worker = null; resolve(); }, 500);
    });
  }

  protected call<T = RpcEchoResponse>(payload: any): Promise<T> {
    const w = this.worker; if (!w) return Promise.reject(new Error("Worker not running"));
    const id = this.idSeq++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      w.postMessage({ ...payload, id });
    });
  }
  protected resolve(id: number, result: any) { const p = this.pending.get(id); if (p) { p.resolve(result); this.pending.delete(id); } }
  protected reject(id: number, error: string) { const p = this.pending.get(id); if (p) { p.reject(new Error(error)); this.pending.delete(id); } }

  protected abstract serviceName(): "t1"|"t2"|"t3";
  protected forwardTimed(payload: TimedPush, scope?: string) {
    const channel = payload.service === "t1" ? IpcChannels.T1_TIMED
                  : payload.service === "t2" ? IpcChannels.T2_TIMED
                  : IpcChannels.T3_TIMED;
    sendScoped(channel, payload, scope);
  }
}

// ---- T1/T2/T3 clients (változatlan váz, csak lifecycle hívás)
type OutShape =
  | { type: "lifecycle"; event: LifecycleEvent }
  | { type: "timed"; payload: TimedPush }
  | { type: "rpcResult"; id:number; result: RpcEchoResponse }
  | { type: "rpcError"; id:number; error:string };

export class T1Client extends BaseClient<OutShape> {
  private lastScope: string | undefined;
  constructor(getMain: () => BrowserWindow | null) { super("workers/services/t1.js", getMain); }
  protected serviceName() { return "t1" as const; }
  protected onMessage(msg: OutShape) {
    if (msg.type === "lifecycle") this.lifecycle(msg.event);
    else if (msg.type === "timed") this.forwardTimed(msg.payload, this.lastScope);
    else if (msg.type === "rpcResult") this.resolve(msg.id, msg.result);
    else if (msg.type === "rpcError") this.reject(msg.id, msg.error);
  }
  request(params: T1RequestParams, scope?: string) { if (scope) this.lastScope = scope; return this.call({ type: "request", payload: params }); }
  command(req: CommandRequest, scope?: string) { if (scope) this.lastScope = scope; return this.call({ type: "command", command: req.command }); }
}

export class T2Client extends BaseClient<OutShape> {
  private lastScope: string | undefined;
  constructor(getMain: () => BrowserWindow | null) { super("workers/services/t2.js", getMain); }
  protected serviceName() { return "t2" as const; }
  protected onMessage(msg: OutShape) {
    if (msg.type === "lifecycle") this.lifecycle(msg.event);
    else if (msg.type === "timed") this.forwardTimed(msg.payload, this.lastScope);
    else if (msg.type === "rpcResult") this.resolve(msg.id, msg.result);
    else if (msg.type === "rpcError") this.reject(msg.id, msg.error);
  }
  request(params: T2RequestParams, scope?: string) { if (scope) this.lastScope = scope; return this.call({ type: "request", payload: params }); }
  command(req: CommandRequest, scope?: string) { if (scope) this.lastScope = scope; return this.call({ type: "command", command: req.command }); }
}

export class T3Client extends BaseClient<OutShape> {
  private lastScope: string | undefined;
  constructor(getMain: () => BrowserWindow | null) { super("workers/services/t3.js", getMain); }
  protected serviceName() { return "t3" as const; }
  protected onMessage(msg: OutShape) {
    if (msg.type === "lifecycle") this.lifecycle(msg.event);
    else if (msg.type === "timed") this.forwardTimed(msg.payload, this.lastScope);
    else if (msg.type === "rpcResult") this.resolve(msg.id, msg.result);
    else if (msg.type === "rpcError") this.reject(msg.id, msg.error);
  }
  request(params: T3RequestParams, scope?: string) { if (scope) this.lastScope = scope; return this.call({ type: "request", payload: params }); }
  command(req: CommandRequest, scope?: string) { if (scope) this.lastScope = scope; return this.call({ type: "command", command: req.command }); }
}

export { registerPushTarget, unregisterPushTarget, sendScoped };
