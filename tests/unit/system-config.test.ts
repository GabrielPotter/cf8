import { jest, describe, it, expect, beforeAll } from "@jest/globals";
import { vol } from "memfs";

// Electron mock: ensure non-packaged path resolution
jest.mock(
  "electron",
  () => ({ app: { isPackaged: false } }) as unknown as typeof import("electron"),
  { virtual: true }
);

// Use in-memory fs for deterministic IO
jest.mock("fs", () => require("memfs").fs);

import { SystemConfig } from "../../src/common/system-config";
import { ConfigBase } from "../../src/common/config-base";

describe("SystemConfig", () => {
  beforeAll(() => {
    vol.reset();
    // Use the same path the implementation will read
    const cfgPath: string = (ConfigBase as any).getSystemConfigPath();
    vol.fromJSON({
      [cfgPath]: JSON.stringify({
        system: {
          windows: {
            main: {},
            config: {},
          },
        },
      }),
    });
  });

  it("reads current system.windows structure via dotted paths", () => {
    const cfg = SystemConfig._new();
    expect(cfg.get<object>("system")).toBeTruthy();
    expect(cfg.get<object>("system.windows")).toBeTruthy();
    expect(cfg.get<object>("system.windows.main")).toEqual({});
    expect(cfg.get<object>("system.windows.config")).toEqual({});
    expect(cfg.get("system.windows.missing" as any)).toBeUndefined();
  });

  it("returns the full object for '/' and '.'", () => {
    const cfg = SystemConfig._new();
    const full = cfg.dump();
    expect(cfg.get("/")).toEqual(full);
    expect(cfg.get(".")).toEqual(full);
  });
});
