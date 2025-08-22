import React from "react";
import { CssBaseline, Container, Box, Stack, Button, Typography, Divider } from "@mui/material";
import StatusToasts from "./components/StatusToasts";
import MetricsPanel from "./components/MetricsPanel";
import SearchPanel from "./components/SearchPanel";
import ImagePanel from "./components/ImagePanel";
import { IpcChannels } from "../ipc/channels";

function useView(): "main" | "metrics" | "search" {
  const [view, setView] = React.useState<"main" | "metrics" | "search">("main");
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = (params.get("view") || "main") as "main" | "metrics" | "search";
    setView(v);
  }, []);
  return view;
}

function useScopedPush(view: string) {
  const scope = `${view}:default`;
  React.useEffect(() => {
    // regisztráljuk azokat a push csatornákat, amiket ez a nézet szeretne kapni
    const regs: Array<Promise<any>> = [];
    if (view === "metrics" || view === "main") {
      regs.push(window.api.registerPush(IpcChannels.METRICS_TICK, scope));
    }
    if (view === "search" || view === "main") {
      regs.push(window.api.registerPush(IpcChannels.SEARCH_INDEXED, scope));
      regs.push(window.api.registerPush(IpcChannels.SEARCH_PROGRESS, scope));
    }
    // képek: csak a mainben jelenítjük meg, de mutatom a mintát
    if (view === "main") {
      regs.push(window.api.registerPush(IpcChannels.IMAGE_COMPLETED, scope));
      regs.push(window.api.registerPush(IpcChannels.IMAGE_ERROR, scope));
    }
    // cleanup: leiratkozás
    return () => {
      if (view === "metrics" || view === "main") {
        window.api.unregisterPush(IpcChannels.METRICS_TICK, scope);
      }
      if (view === "search" || view === "main") {
        window.api.unregisterPush(IpcChannels.SEARCH_INDEXED, scope);
        window.api.unregisterPush(IpcChannels.SEARCH_PROGRESS, scope);
      }
      if (view === "main") {
        window.api.unregisterPush(IpcChannels.IMAGE_COMPLETED, scope);
        window.api.unregisterPush(IpcChannels.IMAGE_ERROR, scope);
      }
    };
  }, [view]);

  return scope;
}

const MainLayout: React.FC = () => {
  const scope = useScopedPush("main");
  const start = () => window.api.startAllWorkers();
  const stop = () => window.api.stopAllWorkers();
  const openMetrics = () => window.api.focusOrCreateWindow("metrics");
  const openSearch = () => window.api.focusOrCreateWindow("search");

  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box py={3}>
          <Typography variant="h5" gutterBottom>cf8 – Main Window</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
            <Button variant="contained" onClick={start}>Start all workers</Button>
            <Button variant="outlined" onClick={stop}>Stop all workers</Button>
            <Button onClick={openMetrics}>Open Metrics Window</Button>
            <Button onClick={openSearch}>Open Search Window</Button>
          </Stack>

          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box flex={1}><MetricsPanel /></Box>
            <Box flex={1}><SearchPanel /></Box>
          </Stack>

          <Divider sx={{ my: 2 }} />
          <ImagePanel />
        </Box>
      </Container>
      <StatusToasts />
    </>
  );
};

const MetricsOnlyLayout: React.FC = () => {
  const scope = useScopedPush("metrics");
  const start = () => window.api.metricsStart(1000, scope);
  const stop = () => window.api.metricsStop(scope);

  return (
    <>
      <CssBaseline />
      <Container maxWidth="md">
        <Box py={3}>
          <Typography variant="h5" gutterBottom>Metrics Window</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={start}>Start metrics</Button>
            <Button variant="outlined" onClick={stop}>Stop metrics</Button>
          </Stack>
          <MetricsPanel />
        </Box>
      </Container>
      <StatusToasts />
    </>
  );
};

const SearchOnlyLayout: React.FC = () => {
  const scope = useScopedPush("search");
  return (
    <>
      <CssBaseline />
      <Container maxWidth="md">
        <Box py={3}>
          <Typography variant="h5" gutterBottom>Search Window</Typography>
          <SearchPanel />
        </Box>
      </Container>
      <StatusToasts />
    </>
  );
};

const App: React.FC = () => {
  const view = useView();
  if (view === "metrics") return <MetricsOnlyLayout />;
  if (view === "search") return <SearchOnlyLayout />;
  return <MainLayout />;
};

export default App;
