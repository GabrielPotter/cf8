export enum IpcChannels {
  // UI (main -> renderer)
  UI_TOAST = "ui/toast",

  // Lifecycle push per worker (main -> renderer, csak fő ablak)
  T1_LIFECYCLE = "t1/lifecycle",
  T2_LIFECYCLE = "t2/lifecycle",
  T3_LIFECYCLE = "t3/lifecycle",

  // Timed push per worker (main -> renderer, csak feliratkozóknak)
  T1_TIMED = "t1/timed",
  T2_TIMED = "t2/timed",
  T3_TIMED = "t3/timed",

  // RPC – request/response per worker (renderer -> main -> worker)
  T1_REQUEST = "t1/request",
  T2_REQUEST = "t2/request",
  T3_REQUEST = "t3/request",

  // Commands per worker (renderer -> main -> worker)
  T1_COMMAND = "t1/command",
  T2_COMMAND = "t2/command",
  T3_COMMAND = "t3/command",

  // Push routing (renderer -> main)
  PUSH_REGISTER = "push/register",     // { channel, scope }
  PUSH_UNREGISTER = "push/unregister", // { channel, scope }

  // Windows (renderer -> main)
  WINDOW_OPEN = "window/open",               // { view: "win1" | "win2" }
  WINDOW_FOCUS_OR_CREATE = "window/focusOrCreate",

  // Workers (renderer -> main)
  WORKERS_START_ALL = "workers/startAll",
  WORKERS_STOP_ALL = "workers/stopAll",
}
