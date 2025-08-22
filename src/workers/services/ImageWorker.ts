import { parentPort } from "node:worker_threads";
import crypto from "node:crypto";
import type { ImageInbound, ImageOutbound, ImageItem, Thumbnail } from "../../ipc/protocol";

const thumbs = new Map<string, Thumbnail>();

function send(msg: ImageOutbound) {
  parentPort?.postMessage(msg);
}

function fakeThumb(item: ImageItem): Thumbnail {
  // DEMO: pszeudo "thumbnail" meta
  const hash = crypto.createHash("md5").update(item.data).digest("hex");
  const w = 160, h = 120;
  return { id: item.id, size: [w, h], hash };
}

send({ type: "ready" });

parentPort?.on("message", async (msg: ImageInbound & { id: number }) => {
  try {
    switch (msg.type) {
      case "generate": {
        const item = msg.item;
        if (!item?.id || !item?.data) {
          send({ type: "rpcError", id: msg.id, error: "Invalid item" });
          send({ type: "error", error: "Invalid item for image generation" });
          return;
        }
        // DEMO: „feldolgozás”
        await new Promise(r=>setTimeout(r, 50));
        const th = fakeThumb(item);
        thumbs.set(item.id, th);
        send({ type: "completed", id: item.id, thumb: th }); // push
        send({ type: "rpcResult", id: msg.id, result: th });
        break;
      }
      case "list": {
        send({ type: "rpcResult", id: msg.id, result: [...thumbs.values()] });
        break;
      }
      case "clear": {
        thumbs.clear();
        send({ type: "rpcResult", id: msg.id, result: true });
        break;
      }
      case "shutdown": process.exit(0); break;
    }
  } catch (e:any) {
    send({ type: "rpcError", id: msg.id, error: String(e?.message ?? e) });
  }
});
