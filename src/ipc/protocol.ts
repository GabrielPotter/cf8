// ---- UI toast ----
export type ToastSeverity = "success" | "info" | "warning" | "error";
export interface ToastMessage {
  severity: ToastSeverity;
  message: string;
  timeoutMs?: number;
}

// ---- Metrics worker ----
export interface MetricsSnapshot {
  ts: number;
  cpuLoad: number;      // 0..1 (demo)
  ramUsedMB: number;    // demo
}

export type MetricsOutbound =
  | { type: "ready" }
  | { type: "tick"; snapshot: MetricsSnapshot }
  | { type: "rpcResult"; id: number; result: any }
  | { type: "rpcError"; id: number; error: string }
  | { type: "error"; error: string };

export type MetricsInbound =
  | { type: "startMonitoring"; intervalMs?: number }
  | { type: "stopMonitoring" }
  | { type: "getSnapshot"; id: number }
  | { type: "shutdown" };

// ---- Search worker ----
export interface SearchDoc { id: string; text: string; }

export type SearchOutbound =
  | { type: "ready" }
  | { type: "indexed"; count: number }
  | { type: "progress"; current: number; total: number }
  | { type: "rpcResult"; id: number; result: any }
  | { type: "rpcError"; id: number; error: string }
  | { type: "error"; error: string };

export type SearchInbound =
  | { type: "indexDocs"; id: number; docs: SearchDoc[] }
  | { type: "search"; id: number; query: string }
  | { type: "clear"; id: number }
  | { type: "shutdown" };

// ---- Image worker ----
export interface ImageItem { id: string; data: string /* e.g. base64 or path (demo) */; }
export interface Thumbnail { id: string; size: [number, number]; hash: string; }

export type ImageOutbound =
  | { type: "ready" }
  | { type: "completed"; id: string; thumb: Thumbnail }
  | { type: "rpcResult"; id: number; result: any }
  | { type: "rpcError"; id: number; error: string }
  | { type: "error"; error: string };

export type ImageInbound =
  | { type: "generate"; id: number; item: ImageItem }
  | { type: "list"; id: number }
  | { type: "clear"; id: number }
  | { type: "shutdown" };
