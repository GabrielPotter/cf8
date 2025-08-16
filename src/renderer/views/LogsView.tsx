import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

const LogsView: React.FC = () => {
  const [logs, setLogs] = React.useState<string[]>([
    "App started",
    "Renderer ready"
  ]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (window.api?.getVersion) {
          const v = await window.api.getVersion();
          if (mounted) setLogs((l) => [...l, `API version: ${v}`]);
        } else {
          if (mounted) setLogs((l) => [...l, "Preload API unavailable"]);
        }
      } catch (err: any) {
        if (mounted) setLogs((l) => [...l, `Version error: ${err?.message ?? String(err)}`]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addLog = () => setLogs((l) => [...l, `Log @ ${new Date().toLocaleTimeString()}`]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, py: 1, borderBottom: "1px solid #2d2d2d", alignItems: "center" }}
      >
        <Typography variant="subtitle2">Logs</Typography>
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="outlined" onClick={addLog}>
          Új log
        </Button>
      </Stack>
      <Box sx={{ flex: 1, overflow: "auto", p: 2, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
        {logs.map((line, i) => (
          <div key={i}>• {line}</div>
        ))}
      </Box>
    </Box>
  );
};

export default LogsView;
