import os from "node:os";
import process from "node:process";

export type EnvironmentSnapshot = {
    timestamp: string;
    platform: {
        type: NodeJS.Platform;
        release: string;
        arch: string;
        uptimeSeconds: number;
        hostname: string;
        homeDir: string;
    };
    software: {
        appName?: string;
        appVersion?: string;
        isPackaged?: boolean;
        electron?: string;
        chrome?: string;
        node: string;
        v8?: string;
        uv?: string;
        openssl?: string;
        tz?: string;
        locale?: string;
    };
    hardware: {
        cpuModel: string;
        logicalCores: number;
        cpuSpeedMhz?: number;
        totalMemoryBytes: number;
        freeMemoryBytes: number;
        loadAverage: number[];
    };
    runtime: {
        pid: number;
        cwd: string;
        execPath: string;
        argv: string[];
        uptimeSeconds: number;
        envFlags: {
            isCI: boolean;
            isDocker: boolean;
            isTest: boolean;
        };
    };
    network: Array<{
        name: string;
        addresses: Array<{
            family: string;
            address: string;
            internal: boolean;
            mac: string;
            netmask: string;
        }>;
    }>;
};

/**
 * Singleton class for retrieving runtime environment metadata.
 */
export class EnvironmentInfo {
    private static instance: EnvironmentInfo | null = null;
    private cachedSnapshot: EnvironmentSnapshot | null = null;

    private constructor() {}

    public static getInstance(): EnvironmentInfo {
        if (!EnvironmentInfo.instance) {
            EnvironmentInfo.instance = new EnvironmentInfo();
        }
        return EnvironmentInfo.instance;
    }

    public getSnapshot(options?: { refresh?: boolean }): EnvironmentSnapshot {
        const refresh = options?.refresh ?? false;
        if (!refresh && this.cachedSnapshot) {
            return this.cachedSnapshot;
        }

        this.cachedSnapshot = this.collectSnapshot();
        return this.cachedSnapshot;
    }

    public getSnapshotJson(options?: { refresh?: boolean; pretty?: boolean }): string {
        const { refresh = false, pretty = false } = options ?? {};
        const snapshot = this.getSnapshot({ refresh });
        return JSON.stringify(snapshot, null, pretty ? 2 : undefined);
    }

    private collectSnapshot(): EnvironmentSnapshot {
        const cpus = os.cpus() ?? [];
        const firstCpu = cpus[0];

        const software = this.resolveSoftwareInfo();
        const network = this.resolveNetworkInfo();

        return {
            timestamp: new Date().toISOString(),
            platform: {
                type: process.platform,
                release: os.release(),
                arch: process.arch,
                uptimeSeconds: os.uptime(),
                hostname: os.hostname(),
                homeDir: os.homedir(),
            },
            software,
            hardware: {
                cpuModel: firstCpu?.model ?? "unknown",
                logicalCores: cpus.length,
                cpuSpeedMhz: firstCpu?.speed,
                totalMemoryBytes: os.totalmem(),
                freeMemoryBytes: os.freemem(),
                loadAverage: os.loadavg(),
            },
            runtime: {
                pid: process.pid,
                cwd: process.cwd(),
                execPath: process.execPath,
                argv: [...process.argv],
                uptimeSeconds: process.uptime(),
                envFlags: this.resolveEnvFlags(),
            },
            network,
        };
    }

    private resolveSoftwareInfo(): EnvironmentSnapshot["software"] {
        const { versions } = process;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const locale = Intl.DateTimeFormat().resolvedOptions().locale;

        const { appName, appVersion, isPackaged } = this.resolveAppInfo();

        return {
            appName,
            appVersion,
            isPackaged,
            electron: versions.electron,
            chrome: versions.chrome,
            node: process.version,
            v8: versions.v8,
            uv: versions.uv,
            openssl: versions.openssl,
            tz,
            locale,
        };
    }

    private resolveAppInfo(): { appName?: string; appVersion?: string; isPackaged?: boolean } {
        try {
            const electronModule = require("electron") as typeof import("electron");
            const app = electronModule?.app;
            if (app) {
                return {
                    appName: app.getName(),
                    appVersion: app.getVersion(),
                    isPackaged: app.isPackaged,
                };
            }
        } catch (err) {
            void err;
        }

        return {
            appName: process.env.npm_package_name,
            appVersion: process.env.npm_package_version,
            isPackaged: Boolean(process.env.ELECTRON_IS_PACKAGED ?? false),
        };
    }

    private resolveEnvFlags(): { isCI: boolean; isDocker: boolean; isTest: boolean } {
        const env = process.env;
        const isCI = Boolean(env.CI || env.CONTINUOUS_INTEGRATION || env.BUILD_NUMBER);
        const isDocker = Boolean(env.DOCKER || env.CONTAINER || env.KUBERNETES_SERVICE_HOST || this.hasDockerEnv());
        const isTest = env.NODE_ENV === "test" || env.JEST_WORKER_ID !== undefined;

        return { isCI, isDocker, isTest };
    }

    private hasDockerEnv(): boolean {
        try {
            // Checking /proc/1/cgroup is a quick signal for containerized environments.
            const fs = require("node:fs") as typeof import("node:fs");
            const content = fs.readFileSync("/proc/1/cgroup", "utf8");
            return /docker|kubepods|containerd/i.test(content);
        } catch (err) {
            void err;
            return false;
        }
    }

    private resolveNetworkInfo(): EnvironmentSnapshot["network"] {
        const interfaces = os.networkInterfaces();
        return Object.entries(interfaces).map(([name, infos]) => ({
            name,
            addresses: (infos ?? []).map((info) => ({
                family: info.family,
                address: info.address,
                internal: info.internal,
                mac: info.mac,
                netmask: info.netmask,
            })),
        }));
    }
}

export const environmentInfo = EnvironmentInfo.getInstance();
