import React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import type { FileTreeNode } from "../../common/fileTree";
import { FileTreeView } from "../components/FileTreeView";

const DEFAULT_JSON = `{
  "name": "example",
  "items": [1, 2, 3],
  "note": "Váltogasd a nézeteket – megmarad az állapot."
}`;

const ExplorerView: React.FC = () => {
    const [code, setCode] = React.useState<string>(DEFAULT_JSON);
    const [path, setPath] = React.useState<string>("./src");

    const [tree, setTree] = React.useState<FileTreeNode | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const scan = async () => {
        const result = await window.api.scanCatalog(path);
        if (result.success) {
            setTree(result.tree ?? null);
            setError(null);
        } else {
            setTree(null);
            setError(result.error ?? "Ismeretlen hiba a katalógus beolvasásakor.");
        }
    };

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Stack
                direction="row"
                spacing={1}
                sx={{ px: 2, py: 1, borderBottom: "1px solid #2d2d2d", alignItems: "center" }}
            >
                <Typography variant="subtitle2">Explorer / JSON szerkesztő + Katalógus</Typography>
                <Box sx={{ flex: 1 }} />
                <TextField
                    size="small"
                    label="Katalógus gyökér"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    sx={{ minWidth: 320 }}
                />
                <Button size="small" variant="outlined" onClick={scan}>
                    Scan
                </Button>
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, minHeight: 0 }}>
                <Box sx={{ borderRight: "1px solid #2d2d2d", overflow: "hidden" }}>
                    <CodeMirror value={code} height="calc(100vh - 64px)" theme={vscodeDark} extensions={[json()]} onChange={setCode} />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", p: 2, minHeight: 0 }}>
                    {error && (
                        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                            {error}
                        </Typography>
                    )}
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <FileTreeView root={tree} onRefresh={scan} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ExplorerView;
