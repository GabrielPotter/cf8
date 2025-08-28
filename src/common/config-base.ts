import fs from "fs";
import { app } from "electron";
import path from "path";

export abstract class ConfigBase {
    protected static readJsonSync(fileName: string): any {
        try {
            const raw = fs.readFileSync(fileName, "utf-8");
            return JSON.parse(raw);
        } catch (error) {
            return undefined;
        }
    }
    protected static tokenize(path: string): string[] {
        // aa.bb[0].c  =>  ["aa","bb","0","c"]
        // Egyszerű tokenizer: pontot szeletel, a [index]-et számmá teszi
        const out: string[] = [];
        const parts = path.split(".");
        for (const p of parts) {
            const re = /([^\[\]]+)|\[(\d+)\]/g;
            let m: RegExpExecArray | null;
            while ((m = re.exec(p))) {
                if (m[1]) out.push(m[1]);
                else if (m[2]) out.push(m[2]);
            }
        }
        return out;
    }

    protected static getByPath<T = unknown>(obj: any, path: string): T | undefined {
        if (path === "/" || path === ".") return obj;
        const dottedPath = path.replace("/", ".");
        // pl. "aa.bb[0].c" -> ["aa","bb","0","c"]
        const tokens = this.tokenize(dottedPath);
        let cur: any = obj;
        for (const t of tokens) {
            if (cur == null) return undefined;
            if (Array.isArray(cur)) {
                const idx = Number(t);
                if (!Number.isInteger(idx)) return undefined;
                cur = cur[idx];
            } else {
                cur = cur[t];
            }
        }
        return cur as T;
    }

    protected static getSystemConfigPath(): string {
        if (app.isPackaged) {
            return path.join(process.resourcesPath, "config/cf8.json");
        }

        return path.resolve(__dirname, "../../assets/config/cf8.json");
    }

    protected static getUserConfigPath(): string {
        const home = process.env.HOME || process.env.USERPROFILE || "";
        return path.join(home, ".cf8/config.json");
    }
}
