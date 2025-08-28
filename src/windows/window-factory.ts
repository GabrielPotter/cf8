import { BrowserWindow } from "electron";
import path from "path";
import * as url from "url";
import { SystemConfig } from "../common/system-config";

export class WindowFactory {
    private static _instance: WindowFactory | null = null;
    private windowsByName = new Map<string, BrowserWindow>();
    private windowsById = new Map<number, string>();
    private constructor() {}
    static _new(): WindowFactory {
        if (this._instance) return this._instance;
        this._instance = new WindowFactory();
        return this._instance;
    }
    static instance(): WindowFactory {
        return this._instance ?? this._new();
    }

    public getWindow(key: string): BrowserWindow | undefined {
        return this.windowsByName.get(key);
    }

    public removeWindow(key: number): void {
        const name = this.windowsById.get(key);
        if (name) {
            this.windowsById.delete(key);
            this.windowsByName.delete(name);
        }
    }

    public ensureWindow(key: string) {
        const win = this.windowsByName.get(key);
        if (win) {
            if (win.isMaximized()) win.restore();
            win.focus();
        }
    }
    public listWindows(){
        const windowsInfo :any[] = []
        this.windowsById.forEach((value,key) => {
            const elemen2 = this.windowsByName.get(value);
            windowsInfo.push({id:key,name:value});
        });
        return windowsInfo;
    }

    private register(win: BrowserWindow, key: string): void {
        const id = win.id;
        this.windowsByName.set(key, win);
        this.windowsById.set(id, key);
        win.on("ready-to-show", () => win.show());
        win.on("closed", () => this.removeWindow(id));
    }

    public createWindow(key: string): BrowserWindow {
        const preloadPath = path.join(__dirname, "../preload.js");
        const syscfg = SystemConfig._new();
        const winparams = syscfg.get(`system.windows.${key}`);
        const win = new BrowserWindow({
            width: 1280,
            height: 800,
            minWidth: 1000,
            minHeight: 640,
            title: `cf8 - ${key}`,
            backgroundColor: "#1e1e1e",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: false,
                preload: preloadPath,
            },
            show: false,
        });
        try {
            win.loadFile(path.join(__dirname, "../renderer", `${key}.html`));
        } catch (err) {}
        this.register(win, key);
        // win.webContents.on("preload-error", (_e, preloadPath, error) => {
        //     console.error("PRELOAD-ERROR:", preloadPath, error);
        // });

        // win.webContents.on("console-message", (_e, level, message, line, sourceId) => {
        //     console.log("RENDERER CONSOLE:", { level, message, line, sourceId });
        // });

        return win;
    }
}
