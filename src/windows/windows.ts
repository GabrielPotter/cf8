import type { BrowserWindow } from "electron";

const windows = new Map<string, BrowserWindow>();

export function setWindow(key: string, win: BrowserWindow) {
  windows.set(key, win);
}

export function getWindow(key: string) {
  return windows.get(key) ?? null;
}

export function removeWindow(key: string) {
  windows.delete(key);
}

export function ensureMainWindow() {
  const win = getWindow("main");
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
}
