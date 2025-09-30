import React from "react";
import {
    Box,
    Button,
    Stack,
    TextField,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import ObjectTreeView, {
    type ObjectCatalogItem,
    type ObjectTreeNode,
    type InsertKind,
} from "../components/ObjectTreeView";

const DEFAULT_JSON = `{
  "name": "sample-object",
  "description": "Ez a panel az objektum katalógus tartalmát mutatja fában.",
  "settings": {
    "enabled": true,
    "colors": ["#84b6f4", "#ff9aa2"],
    "metadata": {
      "owner": "cf8",
      "version": 1
    }
  }
}`;

const ObjectView: React.FC = () => {
    const [preview, setPreview] = React.useState<string>(DEFAULT_JSON);
    const [rootPath, setRootPath] = React.useState<string>("./testdata");
    const [items, setItems] = React.useState<ObjectCatalogItem[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [selectedNode, setSelectedNode] = React.useState<ObjectTreeNode | null>(null);
    const [keyDialog, setKeyDialog] = React.useState<
        | {
              existingKeys: Set<string>;
              resolve: (value: string | null) => void;
              value: string;
              error: string | null;
          }
        | null
    >(null);

    const fetchCatalog = React.useCallback(async (path: string) => {
        setIsLoading(true);
        try {
            const response = await window.api.listObjects(path);
            if (!response.success) {
                throw new Error(response.error ?? "Ismeretlen hiba az objektum katalógus beolvasásakor.");
            }

            const nextItems: ObjectCatalogItem[] = (response.items ?? []).map((item) => ({
                id: item.fullPath,
                label: item.name,
                path: item.path,
                data: item.data ?? (item.error ? { __error: item.error } : {}),
            }));

            setItems(nextItems);
            if (nextItems.length > 0 && nextItems[0].data !== undefined) {
                setPreview(JSON.stringify(nextItems[0].data, null, 2));
            }
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setItems([]);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void fetchCatalog(rootPath);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleValueChange = React.useCallback(
        async ({ node, parsedValue }: { node: ObjectTreeNode; rawValue: string; parsedValue: unknown }) => {
            if (!node.sourceId) {
                const message = "Hiányzó forrásfájl útvonal.";
                setError(message);
                throw new Error(message);
            }
            const targetItem = items.find((item) => item.id === node.sourceId);
            if (!targetItem) {
                const message = "A kiválasztott fájl nem található a listában.";
                setError(message);
                throw new Error(message);
            }
            if (targetItem.data === undefined) {
                const message = "A fájl JSON tartalma nem elérhető.";
                setError(message);
                throw new Error(message);
            }
            const jsonPath = node.jsonPath;
            if (!Array.isArray(jsonPath)) {
                const message = "Ismeretlen JSON útvonal a kiválasztott elemhez.";
                setError(message);
                throw new Error(message);
            }

            let updatedData: unknown;
            try {
                updatedData = updateJsonValue(targetItem.data, jsonPath, parsedValue);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setError(message);
                throw error;
            }
            const response = await window.api.writeObject(node.sourceId, updatedData);
            if (!response.success) {
                const message = response.error ?? "A fájl mentése sikertelen.";
                setError(message);
                throw new Error(message);
            }

            const nextItems = items.map((item) =>
                item.id === node.sourceId ? { ...item, data: updatedData } : item
            );
            setItems(nextItems);
            setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, value: parsedValue } : prev));
            setPreview(JSON.stringify(parsedValue, null, 2));
            setError(null);
        },
        [items]
    );

    const handleInsertValue = React.useCallback(
        async ({ parent, kind }: { parent: ObjectTreeNode; kind: InsertKind }) => {
            if (!parent.sourceId) {
                const message = "Hiányzó forrásfájl útvonal.";
                setError(message);
                throw new Error(message);
            }

            const targetItem = items.find((item) => item.id === parent.sourceId);
            if (!targetItem) {
                const message = "A kiválasztott fájl nem található a listában.";
                setError(message);
                throw new Error(message);
            }
            if (targetItem.data === undefined) {
                const message = "A fájl JSON tartalma nem elérhető.";
                setError(message);
                throw new Error(message);
            }

            const parentValue = resolveJsonValue(targetItem.data, parent.jsonPath);
            let insertKey: string | undefined = undefined;

            if (Array.isArray(parentValue)) {
                insertKey = undefined;
            } else if (isPlainObject(parentValue)) {
                const existingKeys = new Set(Object.keys(parentValue));
                const requestedKey = await requestObjectKey(existingKeys, setKeyDialog);
                if (!requestedKey) {
                    return null;
                }
                insertKey = requestedKey;
            } else {
                const message = "Ebben a csomópontban nem hozható létre új elem.";
                setError(message);
                throw new Error(message);
            }

            let inserted;
            try {
                inserted = insertJsonValue(targetItem.data, parent.jsonPath, kind, {
                    key: insertKey ?? undefined,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setError(message);
                throw error;
            }

            const response = await window.api.writeObject(parent.sourceId, inserted.updated);
            if (!response.success) {
                const message = response.error ?? "A fájl mentése sikertelen.";
                setError(message);
                throw new Error(message);
            }

            const nextItems = items.map((item) =>
                item.id === parent.sourceId ? { ...item, data: inserted.updated } : item
            );
            setItems(nextItems);
            const newValue = resolveJsonValue(inserted.updated, inserted.newPath);
            try {
                setPreview(JSON.stringify(newValue, null, 2));
            } catch (error) {
                console.warn("Failed to stringify inserted value", error);
            }
            setError(null);
            return { sourceId: parent.sourceId, jsonPath: inserted.newPath };
        },
        [items]
    );

    const handleDeleteValue = React.useCallback(
        async ({ node }: { node: ObjectTreeNode }) => {
            if (!node.sourceId) {
                const message = "Hiányzó forrásfájl útvonal.";
                setError(message);
                throw new Error(message);
            }
            const targetItem = items.find((item) => item.id === node.sourceId);
            if (!targetItem) {
                const message = "A kiválasztott fájl nem található a listában.";
                setError(message);
                throw new Error(message);
            }
            if (targetItem.data === undefined) {
                const message = "A fájl JSON tartalma nem elérhető.";
                setError(message);
                throw new Error(message);
            }
            if (node.jsonPath.length === 0) {
                const message = "A gyökér elem nem törölhető.";
                setError(message);
                throw new Error(message);
            }

            let updatedData: unknown;
            try {
                updatedData = deleteJsonValue(targetItem.data, node.jsonPath);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setError(message);
                throw error;
            }

            const response = await window.api.writeObject(node.sourceId, updatedData);
            if (!response.success) {
                const message = response.error ?? "A fájl mentése sikertelen.";
                setError(message);
                throw new Error(message);
            }

            const nextItems = items.map((item) =>
                item.id === node.sourceId ? { ...item, data: updatedData } : item
            );
            setItems(nextItems);
            setSelectedNode(null);
            try {
                setPreview(JSON.stringify(updatedData, null, 2));
            } catch (error) {
                console.warn("Failed to stringify updated JSON", error);
            }
            setError(null);
        },
        [items]
    );

    const handleKeyDialogChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;
        setKeyDialog((prev) => (prev ? { ...prev, value: nextValue, error: null } : prev));
    }, []);

    const handleKeyDialogCancel = React.useCallback(() => {
        setKeyDialog((prev) => {
            if (prev) {
                prev.resolve(null);
            }
            return null;
        });
    }, []);

    const handleKeyDialogConfirm = React.useCallback(() => {
        setKeyDialog((prev) => {
            if (!prev) {
                return prev;
            }
            const trimmed = prev.value.trim();
            if (!trimmed) {
                return { ...prev, error: "Adj meg kulcsnevet." };
            }
            if (prev.existingKeys.has(trimmed)) {
                return { ...prev, error: "Ilyen kulcs már létezik." };
            }
            prev.resolve(trimmed);
            return null;
        });
    }, []);

    return (
        <>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Stack
                direction="row"
                spacing={1}
                sx={{ px: 2, py: 1, borderBottom: "1px solid #2d2d2d", alignItems: "center" }}
            >
                <Typography variant="subtitle2">Object Explorer</Typography>
                <Box sx={{ flex: 1 }} />
                <TextField
                    size="small"
                    label="Object katalogus gyökér"
                    value={rootPath}
                    onChange={(event) => setRootPath(event.target.value)}
                    sx={{ minWidth: 320 }}
                />
                <Button size="small" variant="outlined" onClick={() => fetchCatalog(rootPath)} disabled={isLoading}>
                    Betöltés
                </Button>
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, minHeight: 0 }}>
                <Box sx={{ borderRight: "1px solid #2d2d2d", overflow: "hidden" }}>
                    <CodeMirror
                        value={preview}
                        height="calc(100vh - 64px)"
                        theme={vscodeDark}
                        extensions={[json()]}
                        onChange={setPreview}
                    />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", p: 2, minHeight: 0 }}>
                    {error && (
                        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                            {error}
                        </Typography>
                    )}
                    {selectedNode && (
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }} noWrap>
                            Kiválasztva: {selectedNode.path}
                        </Typography>
                    )}
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <ObjectTreeView
                            items={items}
                            onSelect={(node) => {
                                setSelectedNode(node);
                                if (!node) {
                                    return;
                                }
                                if (node.type === "placeholder") {
                                    return;
                                }
                                if (node.value !== undefined) {
                                    try {
                                        setPreview(JSON.stringify(node.value, null, 2));
                                    } catch (error) {
                                        console.warn("Failed to stringify node value", error);
                                    }
                                } else {
                                    setPreview("null");
                                }
                            }}
                            onRefresh={() => fetchCatalog(rootPath)}
                            isLoading={isLoading}
                            onValueChange={handleValueChange}
                            onInsertValue={handleInsertValue}
                            onDeleteValue={handleDeleteValue}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
        <Dialog
            open={Boolean(keyDialog)}
            onClose={(_, reason) => {
                if (reason === "backdropClick") {
                    return;
                }
                handleKeyDialogCancel();
            }}
        >
            <DialogTitle>Új kulcs hozzáadása</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Kulcsnév"
                    fullWidth
                    value={keyDialog?.value ?? ""}
                    onChange={handleKeyDialogChange}
                    error={Boolean(keyDialog?.error)}
                    helperText={keyDialog?.error ?? ""}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            handleKeyDialogConfirm();
                        } else if (event.key === "Escape") {
                            event.preventDefault();
                            handleKeyDialogCancel();
                        }
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleKeyDialogCancel}>Mégse</Button>
                <Button variant="contained" onClick={handleKeyDialogConfirm}>
                    Mentés
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
};

export default ObjectView;

async function requestObjectKey(
    existingKeys: Set<string>,
    setState: React.Dispatch<
        React.SetStateAction<
            | {
                  existingKeys: Set<string>;
                  resolve: (value: string | null) => void;
                  value: string;
                  error: string | null;
              }
            | null
        >
    >
): Promise<string | null> {
    const suggested = suggestKey(existingKeys);
    return new Promise((resolve) => {
        setState({ existingKeys, resolve, value: suggested, error: null });
    });
}

function updateJsonValue(target: unknown, path: Array<string | number>, value: unknown): unknown {
    if (path.length === 0) {
        return value;
    }

    if (Array.isArray(target)) {
        const token = path[0];
        const index = typeof token === "number" ? token : Number(token);
        if (!Number.isInteger(index) || index < 0 || index >= target.length) {
            throw new Error("Érvénytelen tömb index.");
        }
        const clone = target.slice();
        clone[index] = updateJsonValue(clone[index], path.slice(1), value);
        return clone;
    }

    if (typeof target === "object" && target !== null) {
        const token = path[0];
        const key = typeof token === "number" ? String(token) : token;
        if (!(key in (target as Record<string, unknown>))) {
            throw new Error("A kiválasztott kulcs nem található a JSON-ban.");
        }
        const clone = { ...(target as Record<string, unknown>) };
        clone[key] = updateJsonValue(clone[key], path.slice(1), value);
        return clone;
    }

    throw new Error("A kiválasztott JSON elem nem módosítható.");
}

function insertJsonValue(
    target: unknown,
    parentPath: Array<string | number>,
    kind: InsertKind,
    options: { key?: string }
): { updated: unknown; newPath: Array<string | number> } {
    const clone = cloneJson(target);
    const parentRef = resolveMutableTarget(clone, parentPath);
    const value = defaultValueForKind(kind);

    if (Array.isArray(parentRef)) {
        parentRef.push(value);
        const newIndex = parentRef.length - 1;
        return { updated: clone, newPath: [...parentPath, newIndex] };
    }

    if (typeof parentRef === "object" && parentRef !== null) {
        const key = options.key;
        if (!key) {
            throw new Error("Adj meg kulcsnevet a beszúráshoz.");
        }
        if (Object.prototype.hasOwnProperty.call(parentRef, key)) {
            throw new Error("Ilyen kulcs már létezik.");
        }
        (parentRef as Record<string, unknown>)[key] = value;
        return { updated: clone, newPath: [...parentPath, key] };
    }

    throw new Error("Ide nem szúrható be új elem.");
}

function deleteJsonValue(target: unknown, path: Array<string | number>): unknown {
    if (path.length === 0) {
        throw new Error("A gyökér elem nem törölhető.");
    }
    const clone = cloneJson(target);
    const parentPath = path.slice(0, -1);
    const token = path[path.length - 1];
    const parentRef = resolveMutableTarget(clone, parentPath);

    if (Array.isArray(parentRef)) {
        const index = typeof token === "number" ? token : Number(token);
        if (!Number.isInteger(index) || index < 0 || index >= parentRef.length) {
            throw new Error("Érvénytelen tömb index.");
        }
        parentRef.splice(index, 1);
        return clone;
    }

    if (typeof parentRef === "object" && parentRef !== null) {
        const key = typeof token === "number" ? String(token) : token;
        if (!Object.prototype.hasOwnProperty.call(parentRef, key)) {
            throw new Error("A törlendő kulcs nem található.");
        }
        delete (parentRef as Record<string, unknown>)[key];
        return clone;
    }

    throw new Error("A kiválasztott elem nem törölhető.");
}

function resolveMutableTarget(root: unknown, path: Array<string | number>): any {
    let cursor: any = root;
    for (const token of path) {
        if (Array.isArray(cursor)) {
            const idx = typeof token === "number" ? token : Number(token);
            if (!Number.isInteger(idx) || idx < 0 || idx >= cursor.length) {
                throw new Error("Érvénytelen tömb index.");
            }
            cursor = cursor[idx];
        } else if (typeof cursor === "object" && cursor !== null) {
            const key = typeof token === "number" ? String(token) : token;
            if (!(key in cursor)) {
                throw new Error("A kiválasztott kulcs nem található a JSON-ban.");
            }
            cursor = (cursor as Record<string, unknown>)[key];
        } else {
            throw new Error("Az útvonal nem érhető el a JSON-ban.");
        }
    }
    return cursor;
}

function resolveJsonValue(target: unknown, path: Array<string | number>): unknown {
    let cursor: unknown = target;
    for (const token of path) {
        if (Array.isArray(cursor)) {
            const index = typeof token === "number" ? token : Number(token);
            cursor = cursor[index];
        } else if (typeof cursor === "object" && cursor !== null) {
            const key = typeof token === "number" ? String(token) : token;
            cursor = (cursor as Record<string, unknown>)[key];
        } else {
            return undefined;
        }
    }
    return cursor;
}

function cloneJson<T>(value: T): T {
    if (value === undefined) {
        return value;
    }
    return JSON.parse(JSON.stringify(value)) as T;
}

function defaultValueForKind(kind: InsertKind): unknown {
    switch (kind) {
        case "string":
            return "";
        case "number":
            return 0;
        case "boolean":
            return false;
        case "null":
            return null;
        case "object":
            return {};
        case "array":
            return [];
        default:
            return null;
    }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function suggestKey(existingKeys: Set<string>): string {
    const base = "ujKulcs";
    if (!existingKeys.has(base)) {
        return base;
    }
    let counter = 1;
    let candidate = `${base}${counter}`;
    while (existingKeys.has(candidate)) {
        counter += 1;
        candidate = `${base}${counter}`;
    }
    return candidate;
}
