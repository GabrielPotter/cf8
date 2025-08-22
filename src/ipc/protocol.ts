// ----- Lifecycle push -----
export type LifecycleStatus = "started" | "stopped" | "error";
export interface LifecycleEvent {
  service: "t1" | "t2" | "t3";
  status: LifecycleStatus;
  message?: string;
}

// ----- Timed push -----
export interface TimedPush {
  service: "t1" | "t2" | "t3";
  info: string; // bármilyen rövid üzenet (demo)
}

// ----- RPC kérés paraméterek (különböző mindhárom) -----
export interface T1RequestParams { a: number; }
export interface T2RequestParams { q: string; n: number; }
export interface T3RequestParams { flag: boolean; tags: string[]; }

// ----- RPC válasz (echo string skeleton) -----
export type RpcEchoResponse = string;

// ----- Command be/kimenet -----
export interface CommandRequest { command: string; }
export type CommandResponse = string;

// ----- Worker inbound/outbound váz -----
export type TWorkerInbound =
  | { type: "init"; delayMs?: number }         // időzített push beállítása
  | { type: "request"; id: number; payload: any } // eltérő paraméterek workerfüggően
  | { type: "command"; id: number; command: string }
  | { type: "shutdown" };

export type TWorkerOutbound =
  | { type: "lifecycle"; event: LifecycleEvent }
  | { type: "timed"; payload: TimedPush }
  | { type: "rpcResult"; id: number; result: RpcEchoResponse }
  | { type: "rpcError"; id: number; error: string };
