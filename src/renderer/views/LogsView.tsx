import React from "react";
import { Box, Button, Stack, Typography, CircularProgress } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { rendererLog } from "../logger";

type LogFileEntry = {
    path: string;
    lines: string[];
};

const LogsView: React.FC = () => {
    const [entries, setEntries] = React.useState<LogFileEntry[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const loadLogs = React.useCallback(async () => {
        if (!window.api?.readLogs) {
            setError("A log olvasó API nem elérhető a preloadban.");
            return;
        }

        setLoading(true);
        try {
            const result = await window.api.readLogs();
            if (result.success && result.entries) {
                setEntries(result.entries);
                setError(null);
                void rendererLog.debug("Log files loaded", { count: result.entries.length });
            } else {
                setEntries([]);
                setError(result.error ?? "Ismeretlen hiba a log fájl olvasása közben.");
                void rendererLog.warn("Log read returned failure", result.error ?? "unknown error");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setEntries([]);
            setError(message);
            void rendererLog.error("Log read threw error", message);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void loadLogs();
    }, [loadLogs]);

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Stack
                direction="row"
                spacing={1}
                sx={{ px: 2, py: 1, borderBottom: "1px solid #2d2d2d", alignItems: "center" }}
            >
                <Typography variant="subtitle2">Log fájlok</Typography>
                <Box sx={{ flex: 1 }} />
                {loading ? <CircularProgress size={20} /> : null}
                <Button size="small" variant="outlined" onClick={loadLogs} disabled={loading}>
                    Frissítés
                </Button>
            </Stack>
            <Box sx={{ flex: 1, minHeight: 0, p: 2, display: "flex", flexDirection: "column" }}>
                {error ? (
                    <Typography color="error" variant="body2">
                        {error}
                    </Typography>
                ) : entries.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        Nincs megjeleníthető log bejegyzés.
                    </Typography>
                ) : (
                    <Stack
                        spacing={2}
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            overflow: "auto",
                        }}
                    >
                        {entries.map((entry) => (
                            <Box
                                key={entry.path}
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    flex: entries.length > 1 ? "0 0 auto" : "1 1 auto",
                                    minHeight: entries.length > 1 ? undefined : 0,
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {entry.path}
                                </Typography>
                                <Box
                                    sx={{
                                        mt: 0.5,
                                        flex: 1,
                                        minHeight: 0,
                                        borderRadius: 1,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        overflow: "hidden",
                                        "& .cm-editor": {
                                            height: "100%",
                                            backgroundColor: "background.default",
                                            fontSize: 13,
                                        },
                                        "& .cm-scroller": {
                                            fontFamily: "monospace",
                                            overflow: "auto"
                                        },
                                    }}
                                >
                                    <CodeMirror
                                        value={entry.lines.join("\n")}
                                        theme={vscodeDark}
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
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
};

export default LogsView;
