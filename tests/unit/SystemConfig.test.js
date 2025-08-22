"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tests/unit/main/SystemConfig.test.ts
const globals_1 = require("@jest/globals");
const memfs_1 = require("memfs");
globals_1.jest.mock('fs', () => require('memfs').fs);
const SystemConfig_1 = require("../../src/main/SystemConfig");
(0, globals_1.describe)('SystemConfig', () => {
    (0, globals_1.beforeEach)(() => {
        memfs_1.vol.reset();
        memfs_1.vol.fromJSON({
            '/app/assets/system.json': JSON.stringify({ theme: { dark: true }, paths: { data: '/var/app' } })
        });
    });
    (0, globals_1.it)('reads and exposes dotted path values', () => {
        const cfg = SystemConfig_1.SystemConfig.init();
        (0, globals_1.expect)(cfg.get('theme.dark')).toBe(true);
        (0, globals_1.expect)(cfg.get('paths.data')).toBe('/var/app');
    });
});
//# sourceMappingURL=SystemConfig.test.js.map