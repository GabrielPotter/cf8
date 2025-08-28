import React from "react";
import { Box, Button, CircularProgress, Stack, Typography, Alert } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import type { EnvironmentSnapshot } from "../../workers/environmentInfo";


const AboutView: React.FC = () => {
    const [snapshot, setSnapshot] = React.useState<EnvironmentSnapshot | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const loadSnapshot = React.useCallback(async () => {
        if (!window.api?.getEnvironmentInfo) {
            setError("Az environment API nem elérhető a preloadban.");
            setSnapshot(null);
            return;
        }

        setLoading(true);
        try {
            const result = await window.api.getEnvironmentInfo();
            if (result.success && result.data) {
                setSnapshot(result.data);
                setError(null);
            } else {
                setSnapshot(null);
                setError(result.error ?? "Ismeretlen hiba az environment lekérdezésekor.");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setSnapshot(null);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void loadSnapshot();
    }, [loadSnapshot]);

    const jsonContent = React.useMemo(() => (snapshot ? JSON.stringify(snapshot, null, 2) : ""), [snapshot]);

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                <Box>
                    <Typography variant="h6">Alkalmazás környezet</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Futási környezet metaadatok (OS, verziók, hardver, hálózat)
                    </Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                {loading ? <CircularProgress size={20} /> : null}
                <Button size="small" variant="outlined" onClick={loadSnapshot} disabled={loading}>
                    Frissítés
                </Button>
            </Stack>

            {error ? (
                <Alert severity="error" variant="outlined">
                    {error}
                </Alert>
            ) : null}

            <Box
                sx={{
                    mt: 2,
                    flex: 1,
                    minHeight: 0,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    "& .cm-editor": {
                        height: "100%",
                        backgroundColor: "background.default",
                        fontSize: 12
                    },
                    "& .cm-scroller": {
                        fontFamily: "monospace",
                        overflow:"auto"
                    },
                }}
            >
                <CodeMirror
                    value={jsonContent}
                    theme={vscodeDark}
                    extensions={[json()]}
                    editable={false}
                    height="100%"
                    basicSetup={{
                        lineNumbers: true,
                        highlightActiveLine: false,
                        highlightActiveLineGutter: false,
                    }}
                    style={{ height: "100%" }}
                />
            </Box>
        </Box>
    );
};

export default AboutView;
