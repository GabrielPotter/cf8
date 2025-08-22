// tests/unit/main/SystemConfig.test.ts
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { vol } from "memfs";

jest.mock(
    "electron",
    () => {
        return {
            app: { isPackaged: false },
        } as unknown as typeof import("electron");
    },
    { virtual: true }
);

jest.mock("fs", () => require("memfs").fs);

import { SystemConfig } from "../../src/main/SystemConfig";
import path from "path";

describe("SystemConfig", () => {
    beforeAll(() => {
        vol.reset();
        const cfgPath = path.resolve(process.cwd(), "assets/config/cf8.json");
        vol.fromJSON({
            [cfgPath]: JSON.stringify({ theme: { dark: true }, paths: { data: "/var/app" } }),
        });
    });

    it("reads and exposes dotted path values", () => {
        const cfg = SystemConfig._new();
        expect(cfg.get<boolean>("theme.dark")).toBe(true);
        expect(cfg.get<string>("paths.data")).toBe("/var/app");
        expect(cfg.get<string>("key")).toBe(undefined);
    });
});
