import React from "react";
import {
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    TextField,
    Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import DataObjectIcon from "@mui/icons-material/DataObject";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LabelImportantOutlinedIcon from "@mui/icons-material/LabelImportantOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { SimpleTreeView } from "@mui/x-tree-view";
import { TreeItem } from "@mui/x-tree-view/TreeItem";

export type ObjectCatalogItem = {
    id: string;
    label: string;
    path?: string;
    data: unknown;
};

type ObjectTreeNodeType = "root" | "object" | "array" | "value" | "placeholder";

export type ObjectTreeNode = {
    id: string;
    type: ObjectTreeNodeType;
    label: string;
    path: string;
    depth: number;
    value?: unknown;
    parentId?: string;
    sourceId?: string;
    children?: ObjectTreeNode[];
    meta?: {
        key?: string;
        index?: number;
        totalChildren?: number;
        truncatedChildren?: number;
        note?: string;
    };
    jsonPath: Array<string | number>;
};

export type InsertKind = "string" | "number" | "boolean" | "null" | "object" | "array";

export type ObjectTreeViewProps = {
    items?: ObjectCatalogItem[] | null;
    rootLabel?: string;
    onSelect?: (node: ObjectTreeNode | null) => void;
    onRefresh?: () => void;
    isLoading?: boolean;
    maxChildrenPerNode?: number;
    maxDepth?: number;
    onValueChange?: (args: {
        node: ObjectTreeNode;
        rawValue: string;
        parsedValue: unknown;
    }) => Promise<void> | void;
    onInsertValue?: (args: {
        parent: ObjectTreeNode;
        kind: InsertKind;
    }) => Promise<{ sourceId: string; jsonPath: Array<string | number> } | null> | null | undefined;
    onDeleteValue?: (args: { node: ObjectTreeNode }) => Promise<void> | void;
};

const DEFAULT_ROOT_LABEL = "Objektum katalógus";
const DEFAULT_MAX_CHILDREN = Number.POSITIVE_INFINITY;
const DEFAULT_MAX_DEPTH = 8;

const OBJECT_INSERT_OPTIONS: Array<{ kind: InsertKind; label: string }> = [
    { kind: "string", label: "Új string" },
    { kind: "number", label: "Új szám" },
    { kind: "boolean", label: "Új logikai érték" },
    { kind: "null", label: "Új null" },
    { kind: "object", label: "Új objektum" },
    { kind: "array", label: "Új tömb" },
];

const ARRAY_INSERT_OPTIONS: Array<{ kind: InsertKind; label: string }> = [
    { kind: "string", label: "Új string elem" },
    { kind: "number", label: "Új szám elem" },
    { kind: "boolean", label: "Új logikai elem" },
    { kind: "null", label: "Új null elem" },
    { kind: "object", label: "Új objektum elem" },
    { kind: "array", label: "Új tömb elem" },
];

type BuildResult = {
    root: ObjectTreeNode;
    nodes: Map<string, ObjectTreeNode>;
    expandableIds: string[];
};

type PendingEdit = {
    sourceId: string;
    jsonPath: Array<string | number>;
};

const ObjectTreeView: React.FC<ObjectTreeViewProps> = ({
    items,
    rootLabel = DEFAULT_ROOT_LABEL,
    onSelect,
    onRefresh,
    isLoading = false,
    maxChildrenPerNode = DEFAULT_MAX_CHILDREN,
    maxDepth = DEFAULT_MAX_DEPTH,
    onValueChange,
    onInsertValue,
    onDeleteValue,
}) => {
    const { root, nodes, expandableIds } = React.useMemo<BuildResult>(() => {
        return buildObjectTree(items ?? [], {
            rootLabel,
            maxChildren: Math.max(1, maxChildrenPerNode),
            maxDepth: Math.max(1, maxDepth),
        });
    }, [items, rootLabel, maxChildrenPerNode, maxDepth]);

    const knownIds = React.useMemo(() => new Set(nodes.keys()), [nodes]);

    const initialExpanded = React.useMemo(() => {
        const base = new Set<string>();
        base.add(root.id);
        root.children?.forEach((child) => base.add(child.id));
        return Array.from(base);
    }, [root]);

    const [expandedItems, setExpandedItems] = React.useState<string[]>(initialExpanded);
    const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
    const [contextMenu, setContextMenu] = React.useState<{
        mouseX: number;
        mouseY: number;
        node: ObjectTreeNode;
    } | null>(null);
    const [editState, setEditState] = React.useState<{
        nodeId: string;
        value: string;
        error: string | null;
        isSaving: boolean;
    } | null>(null);
    const [pendingEdit, setPendingEdit] = React.useState<PendingEdit | null>(null);
    const editorRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
        if (contextMenu && !nodes.has(contextMenu.node.id)) {
            setContextMenu(null);
        }
    }, [contextMenu, nodes]);

    React.useEffect(() => {
        setExpandedItems((prev) => {
            const filtered = prev.filter((id) => knownIds.has(id));
            if (filtered.length === 0) {
                return initialExpanded;
            }
            return filtered;
        });
    }, [knownIds, initialExpanded]);

    React.useEffect(() => {
        setSelectedItemId((prev) => (prev && knownIds.has(prev) ? prev : null));
    }, [knownIds]);

    React.useEffect(() => {
        if (editState && !nodes.has(editState.nodeId)) {
            setEditState(null);
        }
    }, [editState, nodes]);

    React.useEffect(() => {
        if (!pendingEdit) {
            return;
        }
        const targetId = buildNodeId(pendingEdit.sourceId, pendingEdit.jsonPath);
        const targetNode = nodes.get(targetId);
        if (!targetNode) {
            return;
        }
        setExpandedItems((prev) => {
            const next = new Set(prev);
            let cursor: ObjectTreeNode | undefined = targetNode;
            while (cursor?.parentId) {
                next.add(cursor.parentId);
                cursor = nodes.get(cursor.parentId);
            }
            return Array.from(next);
        });
        setSelectedItemId(targetNode.id);
        setEditState({
            nodeId: targetNode.id,
            value: getInitialEditValue(targetNode),
            error: null,
            isSaving: false,
        });
        setPendingEdit(null);
    }, [pendingEdit, nodes]);

    React.useEffect(() => {
        if (editState) {
            editorRef.current?.focus();
            editorRef.current?.select();
        }
    }, [editState?.nodeId]);

    const handleSelect = React.useCallback(
        (nodeId: string | null) => {
            setSelectedItemId(nodeId);
            const node = nodeId ? nodes.get(nodeId) ?? null : null;
            onSelect?.(node ?? null);
        },
        [nodes, onSelect]
    );

    const closeContextMenu = React.useCallback(() => setContextMenu(null), []);

    const handleContextMenu = React.useCallback(
        (event: React.MouseEvent, node: ObjectTreeNode) => {
            event.preventDefault();
            event.stopPropagation();
            if (node.type === "placeholder") {
                return;
            }
            setContextMenu({ mouseX: event.clientX + 2, mouseY: event.clientY - 6, node });
            handleSelect(node.id);
        },
        [handleSelect]
    );

    const startEditing = React.useCallback(
        (node: ObjectTreeNode) => {
            setEditState({
                nodeId: node.id,
                value: getInitialEditValue(node),
                error: null,
                isSaving: false,
            });
            closeContextMenu();
        },
        [closeContextMenu]
    );

    const handleExpandAll = React.useCallback(() => {
        setExpandedItems(expandableIds);
    }, [expandableIds]);

    const handleCollapseAll = React.useCallback(() => {
        setExpandedItems(root.children && root.children.length > 0 ? [root.id] : []);
    }, [root]);

    const handleEditChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;
        setEditState((prev) => (prev ? { ...prev, value: nextValue } : prev));
    }, []);

    const cancelEdit = React.useCallback(() => {
        setEditState((prev) => (prev?.isSaving ? prev : null));
    }, []);

    const handleEditBlur = React.useCallback(() => {
        setEditState((prev) => {
            if (!prev || prev.isSaving || prev.error) {
                return prev;
            }
            return null;
        });
    }, []);

    const commitEdit = React.useCallback(async () => {
        if (!editState) {
            return;
        }
        const node = nodes.get(editState.nodeId);
        if (!node) {
            setEditState(null);
            return;
        }
        const rawValue = editState.value;
        const parsedValue = parseEditedValue(rawValue);

        if (!onValueChange) {
            setEditState(null);
            return;
        }

        setEditState((prev) => (prev ? { ...prev, isSaving: true, error: null } : prev));
        try {
            await onValueChange({ node, rawValue, parsedValue });
            setEditState(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setEditState((prev) => (prev ? { ...prev, isSaving: false, error: message } : prev));
        }
    }, [editState, nodes, onValueChange]);

    const handleEditKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            event.stopPropagation();
            if (event.key === "Enter") {
                event.preventDefault();
                void commitEdit();
            } else if (event.key === "Escape") {
                event.preventDefault();
                cancelEdit();
            }
        },
        [commitEdit, cancelEdit]
    );

    const handleInsert = React.useCallback(
        async (parent: ObjectTreeNode, kind: InsertKind) => {
            if (!onInsertValue) {
                return;
            }
            try {
                const result = await onInsertValue({ parent, kind });
                if (result) {
                    setPendingEdit(result);
                }
            } finally {
                closeContextMenu();
            }
        },
        [onInsertValue, closeContextMenu]
    );

    const handleDelete = React.useCallback(
        async (node: ObjectTreeNode) => {
            if (!onDeleteValue) {
                return;
            }
            closeContextMenu();
            if (editState?.nodeId === node.id) {
                setEditState(null);
            }
            await onDeleteValue({ node });
            const parentId = node.parentId ?? null;
            handleSelect(parentId);
        },
        [onDeleteValue, closeContextMenu, editState, handleSelect]
    );

    const renderLabel = React.useCallback(
        (node: ObjectTreeNode): React.ReactNode => {
            const isEditing = editState?.nodeId === node.id;
            if (!isEditing) {
                return renderNodeLabel(node);
            }
            return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 240 }}>
                    <TextField
                        variant="standard"
                        size="small"
                        inputRef={editorRef}
                        value={editState?.value ?? ""}
                        onChange={handleEditChange}
                        onKeyDown={handleEditKeyDown}
                        onBlur={handleEditBlur}
                        onClick={(event) => event.stopPropagation()}
                        onContextMenu={(event) => event.stopPropagation()}
                        disabled={editState?.isSaving}
                        error={Boolean(editState?.error)}
                        helperText={editState?.error ?? undefined}
                        sx={{ flex: 1 }}
                    />
                    {editState?.isSaving ? <CircularProgress size={14} /> : null}
                </Box>
            );
        },
        [editState, handleEditBlur, handleEditChange, handleEditKeyDown]
    );

    const renderTree = React.useCallback(
        (node: ObjectTreeNode): React.ReactNode => (
            <TreeItem
                key={node.id}
                itemId={node.id}
                label={renderLabel(node)}
                disabled={node.type === "placeholder"}
                onContextMenu={(event) => handleContextMenu(event, node)}
            >
                {node.children?.map((child) => renderTree(child))}
            </TreeItem>
        ),
        [handleContextMenu, renderLabel]
    );

    const menuNode = contextMenu?.node;
    const canEdit = Boolean(menuNode && menuNode.type === "value" && !editState);
    const canInsertObject = Boolean(menuNode && menuNode.type === "object" && onInsertValue);
    const canInsertArray = Boolean(menuNode && menuNode.type === "array" && onInsertValue);
    const canDelete = Boolean(
        menuNode && menuNode.type !== "root" && menuNode.type !== "placeholder" && onDeleteValue
    );

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
                <Typography variant="subtitle2">{rootLabel}</Typography>
                <Box sx={{ flex: 1 }} />
                {onRefresh && (
                    <Tooltip title="Frissítés">
                        <span>
                            <IconButton size="small" onClick={onRefresh} disabled={isLoading}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
                <Tooltip title="Összecsuk mindent">
                    <span>
                        <IconButton size="small" onClick={handleCollapseAll} disabled={expandedItems.length <= 1}>
                            <UnfoldLessIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Kinyit mindent">
                    <span>
                        <IconButton size="small" onClick={handleExpandAll} disabled={expandableIds.length === expandedItems.length}>
                            <UnfoldMoreIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            <Box sx={{ flex: 1, overflow: "auto", width: "100%" }}>
                {isLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : root.children && root.children.length > 0 ? (
                    <SimpleTreeView
                        expandedItems={expandedItems}
                        onExpandedItemsChange={(_event, itemIds) => setExpandedItems(itemIds)}
                        selectedItems={selectedItemId}
                        onSelectedItemsChange={(_event, itemId) => handleSelect(itemId ?? null)}
                        sx={{ minWidth: "fit-content", p: 1 }}
                    >
                        {renderTree(root)}
                    </SimpleTreeView>
                ) : (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Nincs megjeleníthető objektum.
                        </Typography>
                    </Box>
                )}
            </Box>
            <Menu
                open={Boolean(contextMenu)}
                onClose={closeContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
                }
            >
                <MenuItem onClick={() => menuNode && startEditing(menuNode)} disabled={!canEdit}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Érték szerkesztése" />
                </MenuItem>
                {canEdit && (canInsertObject || canInsertArray || canDelete) ? <Divider /> : null}
                {canInsertObject
                    ? OBJECT_INSERT_OPTIONS.map((option) => (
                          <MenuItem
                              key={option.kind}
                              onClick={() => menuNode && handleInsert(menuNode, option.kind)}
                          >
                              <ListItemIcon>
                                  <AddCircleOutlineIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={option.label} />
                          </MenuItem>
                      ))
                    : null}
                {canInsertArray
                    ? ARRAY_INSERT_OPTIONS.map((option) => (
                          <MenuItem
                              key={option.kind}
                              onClick={() => menuNode && handleInsert(menuNode, option.kind)}
                          >
                              <ListItemIcon>
                                  <AddCircleOutlineIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={option.label} />
                          </MenuItem>
                      ))
                    : null}
                {(canInsertObject || canInsertArray) && canDelete ? <Divider /> : null}
                {canDelete ? (
                    <MenuItem onClick={() => menuNode && handleDelete(menuNode)}>
                        <ListItemIcon>
                            <DeleteOutlineIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Elem törlése" />
                    </MenuItem>
                ) : null}
            </Menu>
        </Box>
    );
};

export default ObjectTreeView;

function buildObjectTree(
    items: ObjectCatalogItem[],
    options: { rootLabel: string; maxChildren: number; maxDepth: number }
): BuildResult {
    const nodes = new Map<string, ObjectTreeNode>();

    const root: ObjectTreeNode = {
        id: "object-root",
        type: "root",
        label: options.rootLabel,
        path: options.rootLabel,
        depth: 0,
        children: [],
        jsonPath: [],
    };

    nodes.set(root.id, root);

    for (const item of items) {
        const sourceId = item.id;
        const label = item.label || sourceId;
        const displayPath = item.path || label;
        const rawValue = item.data;
        const nodeType = determineNodeType(rawValue);
        const nodeId = buildNodeId(sourceId, []);

        const objectNode: ObjectTreeNode = {
            id: nodeId,
            type: nodeType,
            label,
            path: displayPath,
            depth: 1,
            parentId: root.id,
            sourceId,
            value: rawValue,
            jsonPath: [],
            children: [],
        };

        nodes.set(objectNode.id, objectNode);
        root.children?.push(objectNode);

        if (nodeType === "object" || nodeType === "array") {
            const { children, truncated } = buildChildren(
                rawValue,
                objectNode,
                {
                    nodes,
                    sourceId,
                    maxChildren: options.maxChildren,
                    maxDepth: options.maxDepth,
                    placeholderSeq: 0,
                },
                objectNode.depth
            );
            objectNode.children = children;
            objectNode.meta = {
                totalChildren: getChildCount(rawValue),
                truncatedChildren: truncated,
            };
        }
    }

    const expandableIds: string[] = [];
    nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
            expandableIds.push(node.id);
        }
    });

    return { root, nodes, expandableIds };
}

type BuildContext = {
    nodes: Map<string, ObjectTreeNode>;
    sourceId: string;
    maxChildren: number;
    maxDepth: number;
    placeholderSeq: number;
};

function buildChildren(
    value: unknown,
    parent: ObjectTreeNode,
    ctx: BuildContext,
    depth: number
): { children: ObjectTreeNode[]; truncated: number } {
    if (depth >= ctx.maxDepth) {
        const placeholder: ObjectTreeNode = {
            id: `${buildNodeId(ctx.sourceId, parent.jsonPath)}::placeholder-depth-${ctx.placeholderSeq++}`,
            type: "placeholder",
            label: "… további szintek elrejtve",
            path: parent.path,
            depth: parent.depth + 1,
            parentId: parent.id,
            sourceId: parent.sourceId ?? ctx.sourceId,
            meta: { note: "depth-limit" },
            jsonPath: [...parent.jsonPath],
        };
        ctx.nodes.set(placeholder.id, placeholder);
        return { children: [placeholder], truncated: 0 };
    }

    if (!isObjectLike(value)) {
        return { children: [], truncated: 0 };
    }

    const entries = Array.isArray(value)
        ? value.map((entry, index) => ({ key: String(index), value: entry, isArrayItem: true }))
        : Object.entries(value).map(([key, entry]) => ({ key, value: entry, isArrayItem: false }));

    const truncated = Math.max(entries.length - ctx.maxChildren, 0);
    const visibleEntries = ctx.maxChildren > 0 ? entries.slice(0, ctx.maxChildren) : entries;

    const children: ObjectTreeNode[] = visibleEntries.map((entry) => {
        const childToken = entry.isArrayItem ? Number(entry.key) : entry.key;
        const childJsonPath = [...parent.jsonPath, childToken];
        const childId = buildNodeId(ctx.sourceId, childJsonPath);
        const childType = determineNodeType(entry.value);
        const label = entry.isArrayItem ? `[${entry.key}]` : entry.key;
        const childPath = entry.isArrayItem
            ? `${parent.path}[${entry.key}]`
            : parent.path
            ? `${parent.path}.${entry.key}`
            : entry.key;

        const childNode: ObjectTreeNode = {
            id: childId,
            type: childType,
            label,
            path: childPath,
            depth: parent.depth + 1,
            parentId: parent.id,
            sourceId: parent.sourceId ?? ctx.sourceId,
            value: entry.value,
            meta: entry.isArrayItem ? { index: Number(entry.key) } : { key: entry.key },
            jsonPath: childJsonPath,
            children: [],
        };

        ctx.nodes.set(childNode.id, childNode);

        if (childType === "object" || childType === "array") {
            const { children: grandChildren, truncated: childTruncated } = buildChildren(
                entry.value,
                childNode,
                ctx,
                depth + 1
            );
            childNode.children = grandChildren;
            childNode.meta = {
                ...childNode.meta,
                totalChildren: getChildCount(entry.value),
                truncatedChildren: childTruncated,
            };
        }

        return childNode;
    });

    if (truncated > 0) {
        const placeholder: ObjectTreeNode = {
            id: `${buildNodeId(ctx.sourceId, parent.jsonPath)}::placeholder-truncated-${ctx.placeholderSeq++}`,
            type: "placeholder",
            label: `+${truncated} további elem`,
            path: parent.path,
            depth: parent.depth + 1,
            parentId: parent.id,
            sourceId: parent.sourceId ?? ctx.sourceId,
            meta: { note: "truncated" },
            jsonPath: [...parent.jsonPath],
        };
        ctx.nodes.set(placeholder.id, placeholder);
        children.push(placeholder);
    }

    return { children, truncated };
}

function determineNodeType(value: unknown): ObjectTreeNodeType {
    if (Array.isArray(value)) {
        return "array";
    }
    if (isObjectLike(value)) {
        return "object";
    }
    return "value";
}

function isObjectLike(value: unknown): value is Record<string, unknown> | unknown[] {
    return typeof value === "object" && value !== null;
}

function getChildCount(value: unknown): number | undefined {
    if (Array.isArray(value)) {
        return value.length;
    }
    if (isObjectLike(value)) {
        return Object.keys(value).length;
    }
    return undefined;
}

function renderNodeLabel(node: ObjectTreeNode): React.ReactNode {
    const icon = getNodeIcon(node.type);
    const secondaryTexts: string[] = [];

    if (node.type === "object" || node.type === "array") {
        if (typeof node.meta?.totalChildren === "number") {
            secondaryTexts.push(
                node.type === "array"
                    ? `${node.meta.totalChildren} elem`
                    : `${node.meta.totalChildren} mező`
            );
        }
        if (typeof node.meta?.truncatedChildren === "number" && (node.meta.truncatedChildren ?? 0) > 0) {
            secondaryTexts.push(`+${node.meta.truncatedChildren} rejtve`);
        }
    }

    if (node.type === "value" && node.value !== undefined) {
        secondaryTexts.push(describePrimitive(node.value));
    }

    if (node.type !== "root" && node.type !== "placeholder" && node.path && node.path !== node.label) {
        secondaryTexts.push(node.path);
    }

    if (node.type === "placeholder" && node.meta?.note === "depth-limit") {
        secondaryTexts.push("Mélység limit");
    }

    const secondary = secondaryTexts.length > 0 ? secondaryTexts.join(" • ") : undefined;

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
            {icon}
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                    component="span"
                    variant="body2"
                    color={node.type === "placeholder" ? "text.disabled" : undefined}
                    noWrap
                >
                    {formatPrimaryLabel(node)}
                </Typography>
                {secondary && (
                    <Typography component="div" variant="caption" color="text.secondary" noWrap>
                        {secondary}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

function getNodeIcon(type: ObjectTreeNodeType): React.ReactNode {
    switch (type) {
        case "root":
            return <AccountTreeIcon fontSize="small" color="primary" />;
        case "object":
            return <DataObjectIcon fontSize="small" color="action" />;
        case "array":
            return <FormatListBulletedIcon fontSize="small" color="action" />;
        case "value":
            return <LabelImportantOutlinedIcon fontSize="small" color="disabled" />;
        case "placeholder":
        default:
            return <MoreHorizIcon fontSize="small" color="disabled" />;
    }
}

function formatPrimaryLabel(node: ObjectTreeNode): string {
    if (node.type === "value") {
        const preview = describePrimitive(node.value);
        return `${node.label}: ${preview}`;
    }
    return node.label;
}

function describePrimitive(value: unknown): string {
    if (value === null) {
        return "null";
    }
    const typeOf = typeof value;
    if (typeOf === "string") {
        const strValue = value as string;
        const text = strValue.length > 32 ? `${strValue.slice(0, 29)}…` : strValue;
        return `"${text}"`;
    }
    if (typeOf === "number" || typeOf === "boolean" || typeOf === "bigint") {
        return String(value);
    }
    if (typeOf === "undefined") {
        return "undefined";
    }
    if (Array.isArray(value)) {
        return `Array(${value.length})`;
    }
    if (isObjectLike(value)) {
        const keys = Object.keys(value);
        return `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", …" : ""}}`;
    }
    return String(value);
}

function getInitialEditValue(node: ObjectTreeNode): string {
    if (typeof node.value === "string") {
        return node.value;
    }
    if (node.value === undefined) {
        return "";
    }
    try {
        return JSON.stringify(node.value);
    } catch (error) {
        void error;
        return String(node.value);
    }
}

function parseEditedValue(input: string): unknown {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
        return "";
    }
    try {
        return JSON.parse(trimmed);
    } catch (error) {
        void error;
        return input;
    }
}

function buildNodeId(sourceId: string, jsonPath: Array<string | number>): string {
    if (jsonPath.length === 0) {
        return `object:${sourceId}:root`;
    }
    const pathPart = jsonPath
        .map((token) => (typeof token === "number" ? `[${token}]` : token.replace(/\./g, "\\.")))
        .join(".");
    return `object:${sourceId}:${pathPart}`;
}
