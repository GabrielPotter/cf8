import fs from "node:fs";
import path from "node:path";
import { getSystemConfigDir } from "./configPaths";
import { ConfigBase } from "../shared/ConfigBase";

/**
 * RENDSZER KONFIG — csak olvasás, singleton.
 * A tiszta segédek (readJsonSync, deepMerge, getByPath, deepFreeze) a ConfigBase-ben vannak.
 */
export class SystemConfig extends ConfigBase {
  private static _instance: SystemConfig | null = null;
  private readonly cfg: any;
  private readonly sourceDir: string;

  private constructor(cfg: any, sourceDir: string) {
    super();
    this.cfg = cfg;
    this.sourceDir = sourceDir;
  }

  static _new(): SystemConfig {
    if (this._instance) return this._instance;
    const dir = getSystemConfigDir();
    const defaultsPath = path.join(dir, "cf8.json");
    if (!fs.existsSync(defaultsPath)) {
      throw new Error(`SystemConfig, missing config file: (${defaultsPath})`);
    }

    const defaults = this.readJsonSync(defaultsPath) ?? {};
    this._instance = new SystemConfig(defaults, dir);
    return this._instance;
  }

  /** Singleton példány (ha még nincs, most betölti). */
  static instance(): SystemConfig {
    return this._instance ?? this._new();
  }

  /** Teljes konfiguráció (read-only használatra). */
  dump(): any {
    return this.cfg;
  }

  /** Dotted vagy "/" path lekérdezés; opcionális alapértelmezett érték. */
  get<T = unknown>(pathStr: string, fallback?: T): T | undefined {
    const v = SystemConfig.getByPath(this.cfg, pathStr);
    return (v === undefined ? fallback : v) as T | undefined;
  }

  /** Debug: honnan lett betöltve. */
  getSourceDir(): string {
    return this.sourceDir;
  }
}
