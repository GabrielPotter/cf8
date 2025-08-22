export enum IpcChannels {
  // UI
  UI_TOAST = "ui/toast",

  // Metrics worker
  METRICS_START = "metrics/start",
  METRICS_STOP = "metrics/stop",
  METRICS_GET_SNAPSHOT = "metrics/getSnapshot",
  METRICS_TICK = "metrics/tick",

  // Search worker
  SEARCH_INDEX_DOCS = "search/indexDocs",
  SEARCH_QUERY = "search/query",
  SEARCH_CLEAR = "search/clear",
  SEARCH_INDEXED = "search/indexed",
  SEARCH_PROGRESS = "search/progress",

  // Image worker
  IMAGE_GENERATE = "image/generate",
  IMAGE_LIST = "image/list",
  IMAGE_CLEAR = "image/clear",
  IMAGE_COMPLETED = "image/completed",
  IMAGE_ERROR = "image/error",

  // Global workers
  WORKERS_START_ALL = "workers/startAll",
  WORKERS_STOP_ALL = "workers/stopAll",

  // Windows
  WINDOW_OPEN = "window/open",
  WINDOW_FOCUS_OR_CREATE = "window/focusOrCreate",

  // Push routing registry
  PUSH_REGISTER = "push/register",     // { channel, scope }
  PUSH_UNREGISTER = "push/unregister", // { channel, scope }
}
