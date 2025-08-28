import { jest, describe, it, expect, beforeAll } from "@jest/globals";
import { vol } from "memfs";
import path from "path";

// Build a BrowserWindow mock that records constructor options and calls
type WebListener = (...args: any[]) => void;
const createdWindows: any[] = [];

class BWMock {
  static nextId = 1;
  public id: number;
  public opts: any;
  public events: Record<string, WebListener> = {};
  public webEvents: Record<string, WebListener> = {};
  public webContents = {
    on: (evt: string, fn: WebListener) => {
      this.webEvents[evt] = fn;
    },
  };
  public shown = false;
  public focused = false;
  public restored = false;
  public _isMaximized = false;
  public loadedFile: string | undefined;

  constructor(opts: any) {
    this.id = BWMock.nextId++;
    this.opts = opts;
    createdWindows.push(this);
  }

  on(evt: string, fn: WebListener) {
    this.events[evt] = fn;
  }
  show() { this.shown = true; }
  focus() { this.focused = true; }
  isMaximized() { return this._isMaximized; }
  restore() { this.restored = true; this._isMaximized = false; }
  loadFile(p: string) { this.loadedFile = p; }

  // helper to trigger window-level events
  trigger(evt: string, ...args: any[]) {
    const fn = this.events[evt];
    if (fn) fn(...(args as any));
  }
}

// Mock electron with our BrowserWindow and a minimal app
jest.mock(
  "electron",
  () => ({
    app: { isPackaged: false },
    BrowserWindow: BWMock as unknown as typeof import("electron").BrowserWindow,
  }),
  { virtual: true }
);

// Use in-memory fs for config
jest.mock("fs", () => require("memfs").fs);

import { ConfigBase } from "../../src/common/config-base";

// Important: import after mocks
import { WindowFactory } from "../../src/windows/window-factory";

describe("WindowManager", () => {
  beforeAll(() => {
    vol.reset();
    const cfgPath: string = (ConfigBase as any).getSystemConfigPath();
    vol.fromJSON({
      [cfgPath]: JSON.stringify({ system: { windows: { main: {}, config: {} } } }),
    });
  });

  it("creates and registers a window with preload and listeners", () => {
    const wm = WindowFactory._new();
    const win = wm.createWindow("main");
    expect(win).toBe(createdWindows[0]);

    // Check BrowserWindow options
    const bw = createdWindows[0];
    expect(bw.opts.webPreferences.sandbox).toBe(false);
    expect(path.basename(bw.opts.webPreferences.preload)).toBe("preload.js");

    // loadFile called with main.html
    expect(path.basename(bw.loadedFile!)).toBe("main.html");

    // webContents listeners attached
    expect(Object.keys(bw.webEvents)).toEqual(
      expect.arrayContaining(["preload-error", "console-message"]) 
    );

    // registered in manager
    expect(WindowFactory.instance().getWindow("main")).toBe(win);
  });

  it("ensureWindow restores if maximized and focuses", () => {
    const wm = WindowFactory.instance();
    const win = wm.getWindow("main") as any as BWMock;
    win._isMaximized = true;
    wm.ensureWindow("main");
    expect(win.restored).toBe(true);
    expect(win.focused).toBe(true);
  });

  it("removes window mapping on 'closed'", () => {
    const wm = WindowFactory.instance();
    const win = wm.getWindow("main") as any as BWMock;
    // trigger the registered 'closed' handler
    (win as any).trigger("closed");
    expect(wm.getWindow("main")).toBeUndefined();
  });
});
