import { parentPort } from "node:worker_threads";
import os from "node:os";
import type { MetricsInbound, MetricsOutbound, MetricsSnapshot } from "../../ipc/protocol";

let timer: NodeJS.Timeout | null = null;
let intervalMs = 1000;

function snapshot(): MetricsSnapshot {
  // DEMO: pseudo CPU load és RAM
  const load = os.loadavg()[0]; // 1 perces átlag
  const cores = os.cpus().length || 1;
  const cpu = Math.max(0, Math.min(1, load / cores));
  const ramUsedMB = Math.round((os.totalmem() - os.freemem()) / 1024 / 1024);
  return { ts: Date.now(), cpuLoad: cpu, ramUsedMB };
}

function send(msg: MetricsOutbound) {
  parentPort?.postMessage(msg);
}

function start(interval?: number) {
  if (interval && interval > 100) intervalMs = interval;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    send({ type: "tick", snapshot: snapshot() });
  }, intervalMs);
}

send({ type: "ready" });

parentPort?.on("message", (msg: MetricsInbound & { id?: number }) => {
  try {
    switch (msg.type) {
      case "startMonitoring": start(msg.intervalMs); break;
      case "stopMonitoring":
        if (timer) { clearInterval(timer); timer = null; }
        break;
      case "getSnapshot":
        send({ type: "rpcResult", id: msg.id!, result: snapshot() });
        break;
      case "shutdown":
        if (timer) clearInterval(timer);
        process.exit(0);
        break;
    }
  } catch (e:any) {
    if ("id" in msg && msg.id) send({ type: "rpcError", id: msg.id, error: String(e?.message ?? e) });
    else send({ type: "error", error: String(e?.message ?? e) });
  }
});
