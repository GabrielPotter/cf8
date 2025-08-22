import React from "react";
import { SnackbarProvider, useSnackbar } from "notistack";
import { Button, Container, Box, Stack, Typography } from "@mui/material";
import { IpcChannels } from "../ipc/channels";

function useView(): "winmain"|"win1"|"win2" {
  const [view, setView] = React.useState<"winmain"|"win1"|"win2">("winmain");
  React.useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    setView((qp.get("view") as any) || "winmain");
  }, []);
  return view;
}

const NotistackBridge: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  React.useEffect(() => {
    if (!window.api?.onToast) return;
    const off = window.api.onToast(({ message, variant }) => enqueueSnackbar(message, { variant }));
    return () => off?.();
  }, [enqueueSnackbar]);
  return null;
};

const useLifecycleLogs = (label: string) => {
  React.useEffect(() => {
    // minden ablak logolja a lifecycle eventeket
    const off1 = window.api.onLifecycle("t1", ev => console.log(`${label} lifecycle`, ev));
    const off2 = window.api.onLifecycle("t2", ev => console.log(`${label} lifecycle`, ev));
    const off3 = window.api.onLifecycle("t3", ev => console.log(`${label} lifecycle`, ev));
    return () => { off1(); off2(); off3(); };
  }, [label]);
};

const Main: React.FC = () => {
  useLifecycleLogs("winmain");

  React.useEffect(() => {
    const scope = "main:default";
    if (!window.api?.registerPush) return;
    window.api.registerPush(IpcChannels.T1_TIMED, scope);
    window.api.registerPush(IpcChannels.T2_TIMED, scope);
    window.api.registerPush(IpcChannels.T3_TIMED, scope);
    const off1 = window.api.onTimed("t1", p => window.api.toast({ message: `MAIN timed t1: ${p.info}` }));
    const off2 = window.api.onTimed("t2", p => window.api.toast({ message: `MAIN timed t2: ${p.info}` }));
    const off3 = window.api.onTimed("t3", p => window.api.toast({ message: `MAIN timed t3: ${p.info}` }));
    return () => {
      window.api.unregisterPush(IpcChannels.T1_TIMED, scope);
      window.api.unregisterPush(IpcChannels.T2_TIMED, scope);
      window.api.unregisterPush(IpcChannels.T3_TIMED, scope);
      off1(); off2(); off3();
    };
  }, []);

  const open1 = () => window.api.openWin1();
  const open2 = () => window.api.openWin2();

  return (
    <Container maxWidth="sm">
      <Box py={4}>
        <Typography variant="h5" gutterBottom>winmain</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={open1}>Open win1</Button>
          <Button variant="outlined" onClick={open2}>Open win2</Button>
        </Stack>
      </Box>
    </Container>
  );
};

const PlainWin: React.FC<{ label: "win1"|"win2" }> = ({ label }) => {
  useLifecycleLogs(label);

  React.useEffect(() => {
    const scope = `${label}:default`;
    const ch = label === "win1" ? IpcChannels.T1_TIMED : IpcChannels.T2_TIMED;
    if (!window.api?.registerPush) return;
    window.api.registerPush(ch, scope);
    const off = window.api.onTimed(label === "win1" ? "t1" : "t2", p => window.api.toast({ message: `${label} timed: ${p.info}` }));
    return () => { window.api.unregisterPush(ch, scope); off(); };
  }, [label]);

  return (
    <Container maxWidth="sm">
      <Box py={4}>
        <Typography variant="h5">{label}</Typography>
      </Box>
    </Container>
  );
};

const AppInner: React.FC = () => {
  const view = useView();
  if (view === "win1") return <PlainWin label="win1" />;
  if (view === "win2") return <PlainWin label="win2" />;
  return <Main />;
};

const App: React.FC = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
    <NotistackBridge />
    <AppInner />
  </SnackbarProvider>
);

export default App;
