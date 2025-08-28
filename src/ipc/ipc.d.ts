/// <reference types="vite/client" />
import type { IpcChannels } from "../ipc/channels";
import type {
    LifecycleEvent,
    TimedPush,
    T1RequestParams,
    T2RequestParams,
    T3RequestParams,
    IWorkerMessage,
} from "../ipc/protocol";
import type { RendererLogLevel } from "../common/logging";
import type { EnvironmentSnapshot } from "../workers/environmentInfo";
import type { FileTreeNode } from "../common/fileTree";

declare global {
    interface Window {
        api: {
            workerMessage: IWorkerMessage;
            readLogs: () => Promise<{
                success: boolean;
                entries?: Array<{ path: string; lines: string[] }>;
                error?: string;
            }>;
            log: (
                level: RendererLogLevel,
                message: string,
                ...args: unknown[]
            ) => Promise<{ success: boolean; error?: string }>;
            getEnvironmentInfo: () => Promise<{
                success: boolean;
                data?: EnvironmentSnapshot;
                error?: string;
            }>;
            getConfigDumps: () => Promise<{
                success: boolean;
                system?: unknown;
                user?: unknown;
                error?: string;
            }>;
            scanCatalog: (path: string) => Promise<{
                success: boolean;
                tree?: FileTreeNode;
                error?: string;
            }>;
            createFile: (
                directoryPath: string,
                fileName: string
            ) => Promise<{
                success: boolean;
                fullPath?: string;
                error?: string;
            }>;
            createFolder: (
                directoryPath: string,
                folderName: string
            ) => Promise<{
                success: boolean;
                fullPath?: string;
                error?: string;
            }>;
            deleteFile: (path: string) => Promise<{
                success: boolean;
                error?: string;
            }>;
            deleteFolder: (path: string) => Promise<{
                success: boolean;
                error?: string;
            }>;
            renameFile: (path: string, newName: string) => Promise<{
                success: boolean;
                fullPath?: string;
                error?: string;
            }>;
            renameFolder: (path: string, newName: string) => Promise<{
                success: boolean;
                fullPath?: string;
                error?: string;
            }>;
        };
    }
}
export {};
