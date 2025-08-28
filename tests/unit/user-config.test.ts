import { jest, describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { vol } from "memfs";

// Mock Electron to avoid native import, same as other tests
jest.mock(
  "electron",
  () => ({ app: { isPackaged: false } }) as unknown as typeof import("electron"),
  { virtual: true }
);

// Use in-memory fs for predictable IO
jest.mock("fs", () => require("memfs").fs);

import { UserConfig } from "../../src/common/user-config";
import { ConfigBase } from "../../src/common/config-base";

describe("UserConfig", () => {
  const OLD_HOME = process.env.HOME;
  beforeAll(() => {
    // Ensure a deterministic HOME for getUserConfigPath
    process.env.HOME = "/home/tester";
    vol.reset();
    const cfgPath: string = (ConfigBase as any).getUserConfigPath();
    vol.fromJSON({
      [cfgPath]: JSON.stringify({
        ui: { theme: "dark", lang: "hu" },
        editor: { fontSize: 14 },
      }),
    });
  });

  afterAll(() => {
    process.env.HOME = OLD_HOME;
  });

  it("reads from HOME and resolves dotted paths", () => {
    const cfg = UserConfig._new();
    expect(cfg.get<string>("ui.theme")).toBe("dark");
    expect(cfg.get<string>("ui.lang")).toBe("hu");
    expect(cfg.get<number>("editor.fontSize")).toBe(14);
    expect(cfg.get("missing.key" as any)).toBeUndefined();
    expect(cfg.get("missing.key" as any, 123)).toBe(123);
  });

  it("exposes dump and source path", () => {
    const cfg = UserConfig._new();
    const full = cfg.dump();
    const expectedPath: string = (ConfigBase as any).getUserConfigPath();
    expect(full).toEqual({ ui: { theme: "dark", lang: "hu" }, editor: { fontSize: 14 } });
    expect(cfg.getSourceDir()).toBe(expectedPath);
  });
});

