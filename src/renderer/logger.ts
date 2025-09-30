import type { RendererLogLevel } from "../common/logging";

const fallback = (level: RendererLogLevel, message: string, args: unknown[]) => {
  const consoleLike: Partial<Record<RendererLogLevel, (...p: unknown[]) => void>> & Console = console;
  const consoleFn = consoleLike[level]?.bind(console) ?? console.log.bind(console);
  consoleFn(`[renderer-local] ${message}`, ...args);
};

const send = async (level: RendererLogLevel, message: string, ...args: unknown[]) => {
  if (window.api?.log) {
    try {
      const result = await window.api.log(level, message, ...args);
      if (result.success) {
        return;
      }
      fallback(
        "warn",
        `Log backend returned error for level=${level}: ${result.error ?? "unknown"}`,
        []
      );
      return;
    } catch (error) {
      fallback("error", `Failed to send log: ${error instanceof Error ? error.message : String(error)}`, []);
    }
  }

  fallback(level, message, args);
};

export const rendererLog = {
  log: send,
  error: (message: string, ...args: unknown[]) => send("error", message, ...args),
  warn: (message: string, ...args: unknown[]) => send("warn", message, ...args),
  info: (message: string, ...args: unknown[]) => send("info", message, ...args),
  verbose: (message: string, ...args: unknown[]) => send("verbose", message, ...args),
  debug: (message: string, ...args: unknown[]) => send("debug", message, ...args),
  silly: (message: string, ...args: unknown[]) => send("silly", message, ...args),
};
