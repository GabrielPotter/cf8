
import { ConfigBase } from "./config-base";

export class UserConfig extends ConfigBase {
    private static _instance: UserConfig | null = null;
    private readonly cfg: any;
    private readonly sourcePath: string;

    private constructor(cfg: any, sourcePath: string) {
        super();
        this.cfg = cfg;
        this.sourcePath = sourcePath;
    }

    static _new(): UserConfig {
        if (this._instance) return this._instance;
        const configPath = this.getUserConfigPath();
        const cfg = this.readJsonSync(configPath) ?? {};
        this._instance = new UserConfig(cfg, configPath);
        return this._instance;
    }

    static instance(): UserConfig {
        return this._instance ?? this._new();
    }

    dump(): any {
        return this.cfg;
    }

    get<T = unknown>(pathStr: string, fallback?: T): T | undefined {
        const v = UserConfig.getByPath(this.cfg, pathStr);
        return (v === undefined ? fallback : v) as T | undefined;
    }

    /** Debug: honnan lett betöltve. */
    getSourceDir(): string {
        return this.sourcePath;
    }
}
