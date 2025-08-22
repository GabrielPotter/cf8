import type { IpcChannels } from "../ipc/channels";
import type { LifecycleEvent, TimedPush, T1RequestParams, T2RequestParams, T3RequestParams } from "../ipc/protocol";

declare global {
  interface Window {
    api: {
      onToast(cb: (msg: { message: string; variant?: "default"|"error"|"success"|"warning"|"info" }) => void): () => void;
      onLifecycle(service: "t1"|"t2"|"t3", cb: (ev: LifecycleEvent) => void): () => void;
      onTimed(service: "t1"|"t2"|"t3", cb: (p: TimedPush) => void): () => void;

      registerPush(channel: IpcChannels, scope: string): Promise<boolean>;
      unregisterPush(channel: IpcChannels, scope: string): Promise<boolean>;

      openWin1(): Promise<boolean>;
      openWin2(): Promise<boolean>;

      startAllWorkers(): Promise<boolean>;
      stopAllWorkers(): Promise<boolean>;

      t1Request(params: T1RequestParams, scope?: string): Promise<string>;
      t2Request(params: T2RequestParams, scope?: string): Promise<string>;
      t3Request(params: T3RequestParams, scope?: string): Promise<string>;

      t1Command(command: string, scope?: string): Promise<string>;
      t2Command(command: string, scope?: string): Promise<string>;
      t3Command(command: string, scope?: string): Promise<string>;
    };
  }
}
export {};
