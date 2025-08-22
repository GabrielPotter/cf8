import fs from "fs";

export abstract class ConfigBase {
    protected static readJsonSync(fileName: string): any {
        try {
            const raw = fs.readFileSync(fileName, "utf-8");
            return JSON.parse(raw);
        } catch (error) {
            return undefined;
        }
    }
    protected static getByPath(obj: any, path: string): any {
        if (path === "/" || path === ".") return obj;
        const dotted = path.replace("/", ".");
        const parts = dotted.split(".").filter(Boolean);
        let current: any = obj;
        for (const segment of parts) {
            if (current === null) return undefined;
            const key = /^\d+$/.test(segment) ? Number(segment) : segment;
            if (typeof current !== "object") return undefined;
            current = (current as any)[key];
        }
        return current;
    }
}
