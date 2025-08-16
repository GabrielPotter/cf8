import React, { useCallback, useEffect, useState } from "react";
import { Box, AppBar, Toolbar, Button, Switch, Stack, Typography, Alert } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TabbedPropertyGrid from "../components/TabbedPropertyGrid";
import type { JSONSchema } from "../components/PropertyGrid";

const PropsTestView: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [schema, setSchema] = useState<JSONSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);

   React.useEffect(() => {
        (async () => {
            try {
                const s = await window.api.readJsonFromData("sample.schema.json");
                const d = await window.api.readJsonFromData("sample.data.json");
                setSchema(s);
                setData(d);
            } catch (e) {
                console.error("Failed to load sample data:", e);
            }
        })();
    }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar variant="dense" sx={{ gap: 2 }}>
         
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">Read-only</Typography>
            <Switch checked={readOnly} onChange={(_, v) => setReadOnly(v)} />
          </Stack>
          <Box sx={{ flex: 1 }} />
          {error && <Alert severity="error" variant="outlined">{error}</Alert>}
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, minHeight: 0, p: 1 }}>
        {data && schema ? (
          <TabbedPropertyGrid
            data={data}
            schema={schema}
            readOnly={readOnly}
            onChange={({ data: d, schema: s }) => {
              // Tesztnézetben is szinkronban tartjuk a lokális állapotot
              setData(d);
              setSchema(s);
            }}
            initialTab="grid"
            height="100%"
          />
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2">Betöltés…</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PropsTestView;
