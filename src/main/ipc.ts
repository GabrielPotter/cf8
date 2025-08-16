import { app, ipcMain } from "electron";
import { Worker } from "node:worker_threads";
import * as path from "node:path";
import * as fs from "node:fs";
import type { CatalogNode } from "../shared/types";

function resolveCatalogWorkerPath() {
    // __dirname itt: "<repo>/dist/main"
    const candidates = [
        path.join(__dirname, "..", "workers", "catalogWorker.js"), // helyes build kimenet
        path.join(__dirname, "workers", "catalogWorker.js"), // fallback, ha valahol így keletkezne
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }

    // ha egyik sem létezik, dobjunk érthető hibát
    const tried = candidates.map((p) => `- ${p}`).join("\n");
    throw new Error(
        `catalogWorker.js not found. Tried:\n${tried}\n` +
            `Tippek: \n` +
            `  • futtasd: npm run dev (tsc watch lefordítja a workers fájlokat a dist-be)\n` +
            `  • vagy buildeld: npm run build:main`
    );
}

function resolveDataFile(fileName: string) {
    // csak fájlnév, nincs path traversal
    const safe = path.basename(fileName);
    const candidates = [
        path.join(app.getAppPath(), "data", safe),
        path.join(process.cwd(), "data", safe),
        path.join(__dirname, "..", "..", "data", safe),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error(`Data file not found: ${safe}`);
}

export function registerIpcHandlers() {
    ipcMain.handle("app:getVersion", () => {
        return "0.1.0";
    });

    ipcMain.handle("catalog:scan", async (_evt, rootPath: string): Promise<CatalogNode> => {
        const workerPath = resolveCatalogWorkerPath();

        const worker = new Worker(workerPath, { workerData: { rootPath } });

        const result: CatalogNode = await new Promise((resolve, reject) => {
            worker.once("message", (msg) => resolve(msg as CatalogNode));
            worker.once("error", reject);
            worker.once("exit", (code) => {
                if (code !== 0) reject(new Error(`catalogWorker exited with code ${code}`));
            });
        });

        return result;
    });
    
    ipcMain.handle("data:readJson", async (_evt, fileName: string) => {
        const full = resolveDataFile(fileName);
        const raw = await fs.promises.readFile(full, "utf8");
        return JSON.parse(raw);
    });
}
