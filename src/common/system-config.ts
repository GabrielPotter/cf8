
import { ConfigBase } from "./config-base";

export class SystemConfig extends ConfigBase {
    private static _instance: SystemConfig | null = null;
    private readonly cfg: any;
    private readonly sourcePath: string;

    private constructor(cfg: any, sourcePath: string) {
        super();
        this.cfg = cfg;
        this.sourcePath = sourcePath;
    }

    static _new(): SystemConfig {
        if (this._instance) return this._instance;
        const configPath = this.getSystemConfigPath();
        const cfg = this.readJsonSync(configPath) ?? {};
        this._instance = new SystemConfig(cfg, configPath);
        return this._instance;
    }

    static instance(): SystemConfig {
        return this._instance ?? this._new();
    }

    dump(): any {
        return this.cfg;
    }

    get<T = unknown>(pathStr: string, fallback?: T): T | undefined {
        const v = SystemConfig.getByPath(this.cfg, pathStr);
        return (v === undefined ? fallback : v) as T | undefined;
    }

    /** Debug: source path used for loading. */
    getSourceDir(): string {
        return this.sourcePath;
    }
}
