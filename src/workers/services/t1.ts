import { parentPort } from "node:worker_threads";
import type { TWorkerInbound, TWorkerOutbound, T1RequestParams } from "../../ipc/protocol";

let timer: NodeJS.Timeout | null = null;

function send(msg: TWorkerOutbound) { parentPort?.postMessage(msg); }

parentPort?.on("message", (msg: TWorkerInbound & { id?: number }) => {
  try {
    switch (msg.type) {
      case "init": {
        // csak az init után jelezzük, hogy elindultunk
        send({ type: "lifecycle", event: { service: "t1", status: "started" } });
        if (timer) clearTimeout(timer);
        if (msg.delayMs && msg.delayMs > 0) {
          timer = setTimeout(() => {
            send({ type: "timed", payload: { service: "t1", info: "t1 timed push" } });
          }, msg.delayMs);
        }
        break;
      }
      case "request": {
        const p = msg.payload as T1RequestParams;
        const echo = `t1: vettem a kérést, a=${p?.a}`;
        send({ type: "rpcResult", id: msg.id!, result: echo });
        break;
      }
      case "command": {
        const echo = `t1: ok, vettem a parancsot (${msg.command})`;
        send({ type: "rpcResult", id: msg.id!, result: echo });
        break;
      }
      case "shutdown":
        if (timer) clearTimeout(timer);
        send({ type: "lifecycle", event: { service: "t1", status: "stopped" } });
        process.exit(0);
        break;
    }
  } catch (e:any) {
    send({ type: "lifecycle", event: { service: "t1", status: "error", message: String(e?.message ?? e) } });
    if ("id" in msg && msg.id) send({ type: "rpcError", id: msg.id!, error: String(e?.message ?? e) });
  }
});
