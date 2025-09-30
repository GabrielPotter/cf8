import React from "react";
import { Box, Button, CircularProgress, Stack, Typography, Alert } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

const JSON_EXTENSIONS = [json()];
const CODEMIRROR_SETUP = {
    lineNumbers: true,
    highlightActiveLine: false,
    highlightActiveLineGutter: false,
} as const;

const SettingsView: React.FC = () => {
    const [systemConfig, setSystemConfig] = React.useState<unknown>(null);
    const [userConfig, setUserConfig] = React.useState<unknown>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const loadConfigs = React.useCallback(async () => {
        if (!window.api?.getConfigDumps) {
            setError("A config API nem elérhető a preloadban.");
            setSystemConfig(null);
            setUserConfig(null);
            return;
        }

        setLoading(true);
        try {
            const result = await window.api.getConfigDumps();
            if (result.success) {
                setSystemConfig(result.system ?? {});
                setUserConfig(result.user ?? {});
                setError(null);
            } else {
                setSystemConfig(null);
                setUserConfig(null);
                setError(result.error ?? "Ismeretlen hiba a konfiguráció lekérdezésekor.");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setSystemConfig(null);
            setUserConfig(null);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void loadConfigs();
    }, [loadConfigs]);

    const systemText = React.useMemo(() => (systemConfig ? JSON.stringify(systemConfig, null, 2) : ""), [systemConfig]);
    const userText = React.useMemo(() => (userConfig ? JSON.stringify(userConfig, null, 2) : ""), [userConfig]);

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                <Box>
                    <Typography variant="h6">Konfiguráció</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Rendszer és felhasználói konfiguráció megjelenítése (read-only)
                    </Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                {loading ? <CircularProgress size={20} /> : null}
                <Button size="small" variant="outlined" onClick={loadConfigs} disabled={loading}>
                    Frissítés
                </Button>
            </Stack>

            {error ? (
                <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            ) : null}

            <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                <ConfigEditor title="System config" value={systemText} />
                <ConfigEditor title="User config" value={userText} />
            </Stack>
        </Box>
    );
};

export default SettingsView;

const ConfigEditor: React.FC<{ title: string; value: string }> = ({ title, value }) => (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            {title}
        </Typography>
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
                "& .cm-editor": {
                    height: "100%",
                    backgroundColor: "background.default",
                    fontSize:12
                },
                "& .cm-scroller": {
                    fontFamily: "monospace",
                    overflow:"auto"
                },
            }}
        >
            <CodeMirror
                value={value}
                theme={vscodeDark}
                extensions={JSON_EXTENSIONS}
                editable={false}
                height="100%"
                basicSetup={CODEMIRROR_SETUP}
                style={{ height: "100%" }}
            />
        </Box>
    </Box>
);
