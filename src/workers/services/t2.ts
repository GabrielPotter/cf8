import { parentPort } from "node:worker_threads";
import type { TWorkerInbound, TWorkerOutbound, T2RequestParams } from "../../ipc/protocol";

let timer: NodeJS.Timeout | null = null;

function send(msg: TWorkerOutbound) { parentPort?.postMessage(msg); }

parentPort?.on("message", (msg: TWorkerInbound & { id?: number }) => {
  try {
    switch (msg.type) {
      case "init": {
        send({ type: "lifecycle", event: { service: "t2", status: "started" } });
        if (timer) clearTimeout(timer);
        if (msg.delayMs && msg.delayMs > 0) {
          timer = setTimeout(() => {
            send({ type: "timed", payload: { service: "t2", info: "t2 timed push" } });
          }, msg.delayMs);
        }
        break;
      }
      case "request": {
        const p = msg.payload as T2RequestParams;
        const echo = `t2: vettem a kérést, q=${p?.q}, n=${p?.n}`;
        send({ type: "rpcResult", id: msg.id!, result: echo });
        break;
      }
      case "command": {
        const echo = `t2: ok, vettem a parancsot (${msg.command})`;
        send({ type: "rpcResult", id: msg.id!, result: echo });
        break;
      }
      case "shutdown":
        if (timer) clearTimeout(timer);
        send({ type: "lifecycle", event: { service: "t2", status: "stopped" } });
        process.exit(0);
        break;
    }
  } catch (e:any) {
    send({ type: "lifecycle", event: { service: "t2", status: "error", message: String(e?.message ?? e) } });
    if ("id" in msg && msg.id) send({ type: "rpcError", id: msg.id!, error: String(e?.message ?? e) });
  }
});
