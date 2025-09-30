export const rendererLogLevels = ["error", "warn", "info", "verbose", "debug", "silly"] as const;

export type RendererLogLevel = typeof rendererLogLevels[number];

export const isRendererLogLevel = (value: unknown): value is RendererLogLevel =>
  typeof value === "string" && rendererLogLevels.includes(value as RendererLogLevel);
