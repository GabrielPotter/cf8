import { app } from "electron";
import { createMainWindow } from "../windows/createWindow";
import { registerIpcHandlers } from "./ipc";
import { ensureMainWindow } from "../windows/windows";

app.name = "cf8";

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    ensureMainWindow();
  });

  app.whenReady().then(async () => {
    registerIpcHandlers();
    await createMainWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", async () => {
    ensureMainWindow();
  });
}
