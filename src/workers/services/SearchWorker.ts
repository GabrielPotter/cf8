// import { parentPort } from "node:worker_threads";
// import type { SearchInbound, SearchOutbound, SearchDoc } from "../../ipc/protocol";

// let index = new Map<string, Set<string>>(); // token -> docId
// let docs = new Map<string, string>();

// function send(msg: SearchOutbound) {
//   parentPort?.postMessage(msg);
// }

// function tokenize(s: string) {
//   return (s.toLowerCase().match(/[a-z0-9áéíóöőúüű]+/g) ?? []);
// }

// function addDoc(d: SearchDoc) {
//   docs.set(d.id, d.text);
//   const tokens = tokenize(d.text);
//   for (const t of tokens) {
//     if (!index.has(t)) index.set(t, new Set());
//     index.get(t)!.add(d.id);
//   }
// }

// send({ type: "ready" });

// parentPort?.on("message", async (msg: SearchInbound & { id: number }) => {
//   try {
//     switch (msg.type) {
//       case "indexDocs": {
//         const total = msg.docs.length;
//         for (let i=0;i<total;i++) {
//           addDoc(msg.docs[i]);
//           if (i % 50 === 0 || i === total-1) {
//             send({ type: "progress", current: i+1, total });
//           }
//           // kis késleltetés, hogy látszódjon a progress (demo)
//           if (i % 200 === 0) await new Promise(r=>setTimeout(r,1));
//         }
//         send({ type: "indexed", count: total });
//         send({ type: "rpcResult", id: msg.id, result: true });
//         break;
//       }
//       case "search": {
//         const tokens = tokenize(msg.query);
//         const sets = tokens.map(t => index.get(t) ?? new Set<string>());
//         // metszet
//         let res = new Set<string>(sets[0] ?? []);
//         for (const s of sets.slice(1)) {
//           res = new Set([...res].filter(x => s.has(x)));
//         }
//         send({ type: "rpcResult", id: msg.id, result: [...res] });
//         break;
//       }
//       case "clear": {
//         index.clear(); docs.clear();
//         send({ type: "indexed", count: 0 });
//         send({ type: "rpcResult", id: msg.id, result: true });
//         break;
//       }
//       case "shutdown": process.exit(0); break;
//     }
//   } catch (e:any) {
//     send({ type: "rpcError", id: msg.id, error: String(e?.message ?? e) });
//   }
// });
