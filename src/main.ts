import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import { IpcChannels } from "./ipc/channels";
import { T1Client, T2Client, T3Client, registerPushTarget, unregisterPushTarget } from "./workers/workerClients";
import type { T1RequestParams, T2RequestParams, T3RequestParams, CommandRequest } from "./ipc/protocol";

let winmain: BrowserWindow | null = null;
let win1: BrowserWindow | null = null;
let win2: BrowserWindow | null = null;

const getMain = () => winmain;

const t1 = new T1Client(getMain);
const t2 = new T2Client(getMain);
const t3 = new T3Client(getMain);

function createWindow(name: "winmain" | "win1" | "win2") {
    const win = new BrowserWindow({
        width: 900,
        height: 600,
        title: name,
        webPreferences: {
            preload: join(__dirname, "preload.js"),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    const query = { view: name };
    if (app.isPackaged) win.loadFile(join(__dirname, "renderer/index.html"), { query });
    else {
      win.loadURL(`http://localhost:5173/?view=${name}`);
      win.webContents.openDevTools({ mode: "detach" });
    }
    win.on("closed", () => {
        if (name === "winmain") winmain = null;
        if (name === "win1") win1 = null;
        if (name === "win2") win2 = null;
    });
    return win;
}

app.whenReady().then(() => {
    winmain = createWindow("winmain");
    // induláskor start, minden workernek adunk delayMs-t a timed push-hoz (skeleton)
    t1.start(1500);
    t2.start(2500);
    t3.start(3500);

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) winmain = createWindow("winmain");
    });
});

app.on("window-all-closed", async () => {
    await Promise.all([t1.stop(), t2.stop(), t3.stop()]);
    if (process.platform !== "darwin") app.quit();
});

// ---- windows
ipcMain.handle(IpcChannels.WINDOW_OPEN, (_e, { view }: { view: "win1" | "win2" }) => {
    if (view === "win1") {
        if (!win1 || win1.isDestroyed()) win1 = createWindow("win1");
        else {
            win1.show();
            win1.focus();
        }
    }
    if (view === "win2") {
        if (!win2 || win2.isDestroyed()) win2 = createWindow("win2");
        else {
            win2.show();
            win2.focus();
        }
    }
    return true;
});
ipcMain.handle(IpcChannels.WINDOW_FOCUS_OR_CREATE, (_e, { view }: { view: "win1" | "win2" }) => {
    return ipcMain.emit(IpcChannels.WINDOW_OPEN, _e, { view });
});

// ---- push registry (timed push feliratkozás)
ipcMain.handle(IpcChannels.PUSH_REGISTER, (event, { channel, scope }: { channel: IpcChannels; scope: string }) => {
    registerPushTarget(channel, scope, event.sender);
    return true;
});
ipcMain.handle(IpcChannels.PUSH_UNREGISTER, (event, { channel, scope }: { channel: IpcChannels; scope: string }) => {
    unregisterPushTarget(channel, scope, event.sender);
    return true;
});

// ---- workers control
ipcMain.handle(IpcChannels.WORKERS_START_ALL, async () => {
    t1.start(1500);
    t2.start(2500);
    t3.start(3500);
    return true;
});
ipcMain.handle(IpcChannels.WORKERS_STOP_ALL, async () => {
    await Promise.all([t1.stop(), t2.stop(), t3.stop()]);
    return true;
});

// ---- RPC request/command skeletons
ipcMain.handle(IpcChannels.T1_REQUEST, async (_e, { params, scope }: { params: T1RequestParams; scope?: string }) =>
    t1.request(params, scope)
);
ipcMain.handle(IpcChannels.T2_REQUEST, async (_e, { params, scope }: { params: T2RequestParams; scope?: string }) =>
    t2.request(params, scope)
);
ipcMain.handle(IpcChannels.T3_REQUEST, async (_e, { params, scope }: { params: T3RequestParams; scope?: string }) =>
    t3.request(params, scope)
);

ipcMain.handle(IpcChannels.T1_COMMAND, async (_e, { command, scope }: CommandRequest & { scope?: string }) =>
    t1.command({ command }, scope)
);
ipcMain.handle(IpcChannels.T2_COMMAND, async (_e, { command, scope }: CommandRequest & { scope?: string }) =>
    t2.command({ command }, scope)
);
ipcMain.handle(IpcChannels.T3_COMMAND, async (_e, { command, scope }: CommandRequest & { scope?: string }) =>
    t3.command({ command }, scope)
);
