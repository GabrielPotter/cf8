import type { ToastMessage, MetricsSnapshot, SearchDoc, ImageItem, Thumbnail } from "../ipc/protocol";
import { IpcChannels } from "../ipc/channels";

declare global {
  interface Window {
    api: {
      // Global workers
      startAllWorkers(): Promise<boolean>;
      stopAllWorkers(): Promise<boolean>;

      // Metrics
      metricsStart(intervalMs?: number, scope?: string): Promise<boolean>;
      metricsStop(scope?: string): Promise<boolean>;
      metricsGetSnapshot(): Promise<MetricsSnapshot>;
      onMetricsTick(cb: (snap: MetricsSnapshot) => void): () => void;

      // Search
      searchIndexDocs(docs: SearchDoc[], scope?: string): Promise<boolean>;
      searchQuery(query: string, scope?: string): Promise<string[]>;
      searchClear(scope?: string): Promise<boolean>;
      onSearchIndexed(cb: (count: number) => void): () => void;
      onSearchProgress(cb: (current:number,total:number)=>void): () => void;

      // Image
      imageGenerate(item: ImageItem, scope?: string): Promise<Thumbnail>;
      imageList(scope?: string): Promise<Thumbnail[]>;
      imageClear(scope?: string): Promise<boolean>;
      onImageCompleted(cb: (id:string, thumb: Thumbnail) => void): () => void;
      onImageError(cb: (error: string) => void): () => void;

      // UI toast
      onToast(cb: (t: ToastMessage) => void): () => void;

      // Windows
      openWindow(view: "metrics" | "search"): Promise<boolean>;
      focusOrCreateWindow(view: "metrics" | "search"): Promise<boolean>;

      // Push routing
      registerPush(channel: IpcChannels, scope: string): Promise<boolean>;
      unregisterPush(channel: IpcChannels, scope: string): Promise<boolean>;
    };
  }
}
export {};
