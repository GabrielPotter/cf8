import React from "react";
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { SimpleTreeView } from "@mui/x-tree-view";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import type { FileTreeNode } from "../../common/fileTree";

export type FileTreeViewProps = {
    root?: FileTreeNode | null;
    onSelect?: (node: FileTreeNode) => void;
    onRefresh?: () => void;
};

const formatLabel = (node: FileTreeNode): React.ReactNode => {
    const isDirectory = node.type === "directory";
    const icon = node.error ? <ErrorOutlineIcon color="error" fontSize="small" /> : isDirectory ? <FolderIcon fontSize="small" /> : <InsertDriveFileIcon fontSize="small" />;

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
            {icon}
            <Typography component="span" variant="body2" noWrap>
                {node.name}
            </Typography>
            {!isDirectory && typeof node.size === "number" && (
                <Typography component="span" variant="caption" color="text.secondary">
                    {`(${Math.max(node.size, 0)} B)`}
                </Typography>
            )}
            {node.error && (
                <Typography component="span" variant="caption" color="error.main" noWrap>
                    {node.error}
                </Typography>
            )}
        </Box>
    );
};

const findNodeByPath = (node: FileTreeNode | null | undefined, fullPath: string | null): FileTreeNode | null => {
    if (!node || !fullPath) {
        return null;
    }

    if (node.fullPath === fullPath) {
        return node;
    }

    for (const child of node.children ?? []) {
        const found = findNodeByPath(child, fullPath);
        if (found) {
            return found;
        }
    }

    return null;
};

export const FileTreeView: React.FC<FileTreeViewProps> = ({ root, onSelect, onRefresh }) => {
    const [expandedItems, setExpandedItems] = React.useState<string[]>(() => (root ? [root.fullPath] : []));
    const [contextMenu, setContextMenu] = React.useState<{
        mouseX: number;
        mouseY: number;
        node: FileTreeNode | null;
    } | null>(null);
    const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
    const [activeDirectory, setActiveDirectory] = React.useState<string | null>(null);
    const [createState, setCreateState] = React.useState<{
        parentPath: string;
        tempId: string;
        kind: "file" | "folder";
    } | null>(null);
    const [newFileName, setNewFileName] = React.useState<string>("");
    const [createError, setCreateError] = React.useState<string | null>(null);
    const [isCreating, setIsCreating] = React.useState<boolean>(false);
    const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
    const [renameState, setRenameState] = React.useState<{
        node: FileTreeNode;
        value: string;
        error: string | null;
        isProcessing: boolean;
    } | null>(null);
    const lastNotifiedSelection = React.useRef<string | null>(null);

    const getParentPath = React.useCallback((fullPath: string | null | undefined): string | null => {
        if (!fullPath) {
            return null;
        }
        const normalized = fullPath.replace(/[\\/]+$/, "");
        const lastSlash = Math.max(normalized.lastIndexOf("/"), normalized.lastIndexOf("\\"));
        if (lastSlash <= 0) {
            return null;
        }
        return normalized.slice(0, lastSlash);
    }, []);

    const expandableItems = React.useMemo(() => {
        if (!root) {
            return [] as string[];
        }

        const collectIds = (node: FileTreeNode, acc: string[]): void => {
            acc.push(node.fullPath);
            node.children?.forEach((child) => collectIds(child, acc));
        };

        const ids: string[] = [];
        collectIds(root, ids);
        return ids;
    }, [root]);

    const handleExpandAll = () => {
        setExpandedItems(expandableItems);
    };

    const handleCollapseAll = () => {
        setExpandedItems([]);
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const ensureExpanded = (itemId: string) => {
        setExpandedItems((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    };

    const getDirectoryForNode = React.useCallback(
        (node: FileTreeNode | null | undefined): string | null => {
            if (!root || root.type !== "directory") {
                return null;
            }

            if (!node) {
                return root.fullPath;
            }

            if (node.type === "directory") {
                return node.fullPath;
            }

            const full = node.fullPath;
            const lastSlash = Math.max(full.lastIndexOf("/"), full.lastIndexOf("\\"));
            if (lastSlash <= 0) {
                return root.fullPath;
            }
            return full.slice(0, lastSlash);
        },
        [root]
    );

    React.useEffect(() => {
        if (!root) {
            setExpandedItems([]);
            setSelectedItemId(null);
            setActiveDirectory(null);
            setCreateState(null);
            setNewFileName("");
            setCreateError(null);
            setIsCreating(false);
            setIsDeleting(false);
            lastNotifiedSelection.current = null;
            setRenameState(null);
            return;
        }

        const availableIds = new Set(expandableItems);

        setExpandedItems((prev) => {
            const filtered = prev.filter((id) => availableIds.has(id));
            if (!filtered.includes(root.fullPath)) {
                filtered.unshift(root.fullPath);
            }
            if (filtered.length === prev.length && filtered.every((id, index) => id === prev[index])) {
                return prev;
            }
            return filtered;
        });

        setSelectedItemId((prev) => {
            let next = prev;
            if (!next || !availableIds.has(next)) {
                let cursor = prev;
                while (cursor) {
                    cursor = getParentPath(cursor);
                    if (cursor && availableIds.has(cursor)) {
                        next = cursor;
                        break;
                    }
                }
                if (!next || !availableIds.has(next)) {
                    next = root.fullPath;
                }
            }
            if (next !== prev) {
                return next;
            }
            return prev;
        });

        setContextMenu(null);
        setCreateState(null);
        setRenameState(null);
        setNewFileName("");
        setCreateError(null);
        setIsCreating(false);
        setIsDeleting(false);
    }, [root, expandableItems, getParentPath]);

    React.useEffect(() => {
        if (!root) {
            setActiveDirectory(null);
            return;
        }

        const node = selectedItemId ? findNodeByPath(root, selectedItemId) : null;
        const directory = node ? getDirectoryForNode(node) : getDirectoryForNode(root);
        setActiveDirectory(directory ?? null);
    }, [selectedItemId, root, getDirectoryForNode]);

    React.useEffect(() => {
        if (!root) {
            lastNotifiedSelection.current = null;
            return;
        }

        if (!selectedItemId || selectedItemId === lastNotifiedSelection.current) {
            return;
        }

        const node = findNodeByPath(root, selectedItemId);
        if (node && onSelect) {
            onSelect(node);
            lastNotifiedSelection.current = node.fullPath;
        }
    }, [selectedItemId, root, onSelect]);

    const getSelectedNode = React.useCallback((): FileTreeNode | null => {
        if (!root || !selectedItemId) {
            return null;
        }
        return findNodeByPath(root, selectedItemId);
    }, [root, selectedItemId]);

    const cancelCreateEntry = () => {
        setCreateState(null);
        setNewFileName("");
        setCreateError(null);
        setIsCreating(false);
    };

    const cancelRenameEntry = () => {
        setRenameState(null);
    };

    const submitCreateEntry = async () => {
        if (!createState || isCreating) {
            return;
        }

        const trimmedName = newFileName.trim();
        if (!trimmedName) {
            setCreateError(createState.kind === "folder" ? "Adj meg mappanevet." : "Adj meg fájlnevet.");
            return;
        }

        setIsCreating(true);
        setCreateError(null);

        try {
            const result =
                createState.kind === "folder"
                    ? await window.api.createFolder(createState.parentPath, trimmedName)
                    : await window.api.createFile(createState.parentPath, trimmedName);
            if (result.success) {
                cancelCreateEntry();
                onRefresh?.();
            } else {
                setCreateError(result.error ?? "Ismeretlen hiba történt.");
            }
        } catch (error) {
            setCreateError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsCreating(false);
        }
    };

    const startCreateEntry = (kind: "file" | "folder", targetNode: FileTreeNode | null) => {
        if (createState || renameState || isDeleting || isCreating) {
            closeContextMenu();
            return;
        }

        const selectedNode = getSelectedNode();
        const targetDirectory =
            getDirectoryForNode(targetNode) ??
            activeDirectory ??
            (selectedNode ? getDirectoryForNode(selectedNode) : null) ??
            (root ? root.fullPath : null);
        if (!targetDirectory) {
            return;
        }

        ensureExpanded(targetDirectory);
        setActiveDirectory(targetDirectory);
        setCreateState({ parentPath: targetDirectory, tempId: `${targetDirectory}::__new__${kind}`, kind });
        setNewFileName("");
        setCreateError(null);
        setIsCreating(false);
        closeContextMenu();
    };

    const startCreateFile = (targetNode: FileTreeNode | null) => {
        startCreateEntry("file", targetNode);
    };

    const startCreateFolder = (targetNode: FileTreeNode | null) => {
        startCreateEntry("folder", targetNode);
    };

    const startRenameEntry = (targetNode: FileTreeNode | null) => {
        if (!targetNode || renameState || createState || isDeleting || isCreating) {
            closeContextMenu();
            return;
        }

        setRenameState({ node: targetNode, value: targetNode.name, error: null, isProcessing: false });
        setSelectedItemId(targetNode.fullPath);
        lastNotifiedSelection.current = targetNode.fullPath;
        closeContextMenu();
    };

    const handleRenameFile = (target: FileTreeNode | null) => {
        if (!target || target.type !== "file") {
            closeContextMenu();
            return;
        }
        startRenameEntry(target);
    };

    const handleRenameFolder = (target: FileTreeNode | null) => {
        if (!target || target.type !== "directory" || (root && target.fullPath === root.fullPath)) {
            closeContextMenu();
            return;
        }
        startRenameEntry(target);
    };

    const submitRenameEntry = async () => {
        if (!renameState || renameState.isProcessing) {
            return;
        }

        const trimmedName = renameState.value.trim();
        if (!trimmedName) {
            setRenameState((prev) => (prev ? { ...prev, error: prev.node.type === "directory" ? "Adj meg új mappanevet." : "Adj meg új fájlnevet." } : prev));
            return;
        }

        setRenameState((prev) => (prev ? { ...prev, isProcessing: true, error: null } : prev));

        try {
            const result =
                renameState.node.type === "directory"
                    ? await window.api.renameFolder(renameState.node.fullPath, trimmedName)
                    : await window.api.renameFile(renameState.node.fullPath, trimmedName);

            if (result.success) {
                const newPath = result.fullPath ?? renameState.node.fullPath;
                setRenameState(null);
                setSelectedItemId(newPath);
                lastNotifiedSelection.current = newPath;
                onRefresh?.();
            } else {
                setRenameState((prev) => (prev ? { ...prev, isProcessing: false, error: result.error ?? "Ismeretlen hiba történt." } : prev));
            }
        } catch (error) {
            setRenameState((prev) => (prev ? { ...prev, isProcessing: false, error: error instanceof Error ? error.message : String(error) } : prev));
        }
    };

    const handleDeleteEntry = async (kind: "file" | "folder", target: FileTreeNode | null) => {
        if (!target) {
            closeContextMenu();
            return;
        }

        if (kind === "file" && target.type !== "file") {
            closeContextMenu();
            return;
        }

        if (kind === "folder" && target.type !== "directory") {
            closeContextMenu();
            return;
        }

        if (kind === "folder" && root && target.fullPath === root.fullPath) {
            closeContextMenu();
            return;
        }

        const pathToDelete = target.fullPath;
        closeContextMenu();
        setIsDeleting(true);
        setRenameState(null);

        try {
            const result =
                kind === "folder"
                    ? await window.api.deleteFolder(pathToDelete)
                    : await window.api.deleteFile(pathToDelete);

            if (!result.success) {
                console.error(`Nem sikerült törölni a ${kind === "folder" ? "mappát" : "fájlt"}:`, result.error);
            } else {
                onRefresh?.();
            }
        } catch (error) {
            console.error(`Nem sikerült törölni a ${kind === "folder" ? "mappát" : "fájlt"}.`, error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteFile = (target: FileTreeNode | null) => handleDeleteEntry("file", target);
    const handleDeleteFolder = (target: FileTreeNode | null) => handleDeleteEntry("folder", target);

    const handleContextMenuForNode = (event: React.MouseEvent, node: FileTreeNode) => {
        event.preventDefault();
        event.stopPropagation();
        setSelectedItemId(node.fullPath);
        setActiveDirectory(getDirectoryForNode(node));
        if (onSelect) {
            onSelect(node);
        }
        setContextMenu({ mouseX: event.clientX + 2, mouseY: event.clientY - 6, node });
        lastNotifiedSelection.current = node.fullPath;
    };

    const renderCreatePlaceholder = () => {
        if (!createState) {
            return null;
        }

        const Icon = createState.kind === "folder" ? FolderIcon : InsertDriveFileIcon;

        return (
            <TreeItem
                key={createState.tempId}
                itemId={createState.tempId}
                label={(
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                        }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <Icon fontSize="small" />
                        <TextField
                            autoFocus
                            fullWidth
                            size="small"
                            variant="standard"
                            value={newFileName}
                            onChange={(event) => {
                                setNewFileName(event.target.value);
                                if (createError) {
                                    setCreateError(null);
                                }
                            }}
                            onKeyDown={(event) => {
                                event.stopPropagation();
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    submitCreateEntry();
                                } else if (event.key === "Escape") {
                                    event.preventDefault();
                                    cancelCreateEntry();
                                }
                            }}
                            onKeyUp={(event) => {
                                event.stopPropagation();
                            }}
                            onFocus={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                            disabled={isCreating}
                            error={Boolean(createError)}
                            helperText={createError ?? undefined}
                        />
                    </Box>
                )}
                onClick={(event) => event.stopPropagation()}
                onContextMenu={(event) => event.preventDefault()}
            />
        );
    };

    const renderRenameLabel = (node: FileTreeNode): React.ReactNode => {
        if (!renameState || renameState.node.fullPath !== node.fullPath) {
            return formatLabel(node);
        }

        const Icon = node.type === "directory" ? FolderIcon : InsertDriveFileIcon;

        return (
            <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}
                onClick={(event) => event.stopPropagation()}
            >
                <Icon fontSize="small" />
                <TextField
                    autoFocus
                    fullWidth
                    size="small"
                    variant="standard"
                    value={renameState.value}
                    onChange={(event) => {
                        const nextValue = event.target.value;
                        setRenameState((prev) => (prev ? { ...prev, value: nextValue, error: prev.error && nextValue.trim() ? null : prev.error } : prev));
                    }}
                    onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === "Enter") {
                            event.preventDefault();
                            submitRenameEntry();
                        } else if (event.key === "Escape") {
                            event.preventDefault();
                            cancelRenameEntry();
                        }
                    }}
                    onKeyUp={(event) => event.stopPropagation()}
                    onFocus={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    disabled={renameState.isProcessing}
                    error={Boolean(renameState.error)}
                    helperText={renameState.error ?? undefined}
                />
            </Box>
        );
    };

    const renderTree = (node: FileTreeNode): React.ReactNode => {
        const handleSelect = () => {
            closeContextMenu();
        };

        return (
            <TreeItem
                key={node.fullPath}
                itemId={node.fullPath}
                label={renderRenameLabel(node)}
                onClick={handleSelect}
                onContextMenu={(event) => handleContextMenuForNode(event, node)}
            >
                {node.children?.map((child) => renderTree(child))}
                {createState && createState.parentPath === node.fullPath ? renderCreatePlaceholder() : null}
            </TreeItem>
        );
    };

    const selectedNode = getSelectedNode();
    const menuTarget = contextMenu?.node ?? selectedNode;
    const menuDirectory = menuTarget ? getDirectoryForNode(menuTarget) : activeDirectory ?? (root ? getDirectoryForNode(root) : null);
    const canCreateInTarget = menuTarget?.type === "directory";
    const hasInlineEdit = Boolean(createState) || Boolean(renameState);
    const isProcessingAction = isCreating || isDeleting || Boolean(renameState?.isProcessing);
    const isCreateDisabled = hasInlineEdit || isProcessingAction || !menuDirectory || !canCreateInTarget;
    const canDeleteFile = !hasInlineEdit && !isProcessingAction && menuTarget?.type === "file";
    const canDeleteFolder =
        !hasInlineEdit && !isProcessingAction && menuTarget?.type === "directory" && menuTarget?.fullPath !== root?.fullPath;
    const canRenameFile = !hasInlineEdit && !isProcessingAction && menuTarget?.type === "file";
    const canRenameFolder =
        !hasInlineEdit && !isProcessingAction && menuTarget?.type === "directory" && menuTarget?.fullPath !== root?.fullPath;

    return (
        <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Typography variant="subtitle2">Katalógus</Typography>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Frissítés">
                    <span>
                        <IconButton
                            size="small"
                            aria-label="Frissítés"
                            onClick={() => onRefresh?.()}
                            disabled={!onRefresh}
                        >
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Összecsuk mindent">
                    <span>
                        <IconButton
                            size="small"
                            aria-label="Összecsuk mindent"
                            onClick={handleCollapseAll}
                            disabled={!root}
                        >
                            <UnfoldLessIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Kinyit mindent">
                    <span>
                        <IconButton
                            size="small"
                            aria-label="Kinyit mindent"
                            onClick={handleExpandAll}
                            disabled={!root}
                        >
                            <UnfoldMoreIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            <Box
                sx={{ flex: 1, width: "100%", overflow: "auto" }}
                onContextMenu={(event) => {
                    if (!root) {
                        return;
                    }
                    if (event.defaultPrevented) {
                        return;
                    }
                    event.preventDefault();
                    const targetNode = getSelectedNode() ?? root;
                    setActiveDirectory(getDirectoryForNode(targetNode));
                    setContextMenu({ mouseX: event.clientX + 2, mouseY: event.clientY - 6, node: targetNode });
                }}
            >
                {root ? (
                    <SimpleTreeView
                        expandedItems={expandedItems}
                        onExpandedItemsChange={(event, itemIds) => setExpandedItems(itemIds)}
                        selectedItems={selectedItemId ? [selectedItemId] : []}
                        onSelectedItemsChange={(_event, itemIds) => {
                            const next = itemIds[itemIds.length - 1] ?? null;
                            setSelectedItemId(next ?? null);
                            const node = next ? findNodeByPath(root, next) : null;
                            setActiveDirectory(node ? getDirectoryForNode(node) : root ? getDirectoryForNode(root) : null);
                            if (node && onSelect) {
                                onSelect(node);
                                lastNotifiedSelection.current = node.fullPath;
                            }
                        }}
                        sx={{ minWidth: "fit-content" }}
                        key={root?.fullPath ?? "tree"}
                    >
                        {renderTree(root)}
                    </SimpleTreeView>
                ) : (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Nincs betöltött katalógus.
                        </Typography>
                    </Box>
                )}
            </Box>
            <Menu
                open={Boolean(contextMenu)}
                onClose={closeContextMenu}
                anchorReference="anchorPosition"
                anchorPosition=
                    {contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
            >
                <MenuItem
                    onClick={() => {
                        handleDeleteFolder(menuTarget ?? null);
                    }}
                    disabled={!canDeleteFolder}
                >
                    <ListItemIcon>
                        <DeleteForeverIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Mappa törlése" />
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleDeleteFile(menuTarget ?? null);
                    }}
                    disabled={!canDeleteFile}
                >
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fájl törlése" />
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleRenameFolder(menuTarget ?? null);
                    }}
                    disabled={!canRenameFolder}
                >
                    <ListItemIcon>
                        <DriveFileRenameOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Mappa átnevezése" />
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleRenameFile(menuTarget ?? null);
                    }}
                    disabled={!canRenameFile}
                >
                    <ListItemIcon>
                        <DriveFileRenameOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fájl átnevezése" />
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        startCreateFolder(menuTarget ?? null);
                    }}
                    disabled={isCreateDisabled}
                >
                    <ListItemIcon>
                        <CreateNewFolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Új mappa" />
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        startCreateFile(menuTarget ?? null);
                    }}
                    disabled={isCreateDisabled}
                >
                    <ListItemIcon>
                        <NoteAddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Új fájl" />
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default FileTreeView;
