import React from "react";
import ReactFlow, {
  Background,
  MiniMap,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  OnEdgesChange,
  OnNodesChange,
  useReactFlow,
  useUpdateNodeInternals,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Box,
  Stack,
  Tooltip,
  PopoverProps,
  IconButton,
  Divider,
  useTheme,
} from "@mui/material";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import AddBoxIcon from "@mui/icons-material/AddBox";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import TimelineIcon from "@mui/icons-material/Timeline";

import RectNode from "./RectNode";
import PortEdge from "./PortEdge";
import NodeTemplateDialog from "./NodeTemplateDialog";
import EdgeTemplateDialog from "./EdgeTemplateDialog";
import NodeDataEditorDialog from "./NodeDataEditorDialog";
import EdgeDataEditorDialog from "./EdgeDataEditorDialog";
import { EdgeContextMenu, NodeContextMenu, PortContextMenu } from "./contextMenus";
import type {
  Direction,
  DiagramDTO,
  PortDTO,
  RectNodeData,
  NodeTemplate,
  PortEdgeData,
  PortEdgeRouting,
  EdgeTemplate,
} from "./types";
import { exportDiagram, importDiagram, renumberSide } from "./io";
import { DEFAULT_EDGE_STROKE } from "./constants";
import { getPaletteBundle } from "./palettes";
import { createNodeFromTemplate } from "./templateUtils";

const nodeTypes = { rectNode: RectNode };
const edgeTypes = { portEdge: PortEdge };

type AnchorEl = PopoverProps["anchorEl"];

function useThrottledUpdateInternals() {
  const updateNodeInternals = useUpdateNodeInternals();
  const rafRef = React.useRef<number | null>(null);
  const dirtyIdsRef = React.useRef<Set<string>>(new Set());

  const flush = React.useCallback(() => {
    rafRef.current = null;
    const ids = Array.from(dirtyIdsRef.current);
    dirtyIdsRef.current.clear();
    ids.forEach((id) => updateNodeInternals(id));
  }, [updateNodeInternals]);

  const schedule = React.useCallback((id: string) => {
    dirtyIdsRef.current.add(id);
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flush);
    }
  }, [flush]);

  React.useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      dirtyIdsRef.current.clear();
    };
  }, []);

  return schedule;
}

export type DiagramEditorProps = {
  templateSet?: string;
  templates?: NodeTemplate[];
  defaultNodeExtra?: Record<string, unknown>;
};

function EditorInner({ templateSet, templates: templatesProp, defaultNodeExtra }: DiagramEditorProps) {
  const theme = useTheme();
  const { fitView, getViewport, setViewport, getNode } = useReactFlow();
  const scheduleUpdateInternals = useThrottledUpdateInternals();

  const [nodes, setNodes, onNodesChange] = useNodesState<RectNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<PortEdgeData>([] as any);

  const [nodeMenu, setNodeMenu] = React.useState<{ anchorEl: AnchorEl; id?: string }>({ anchorEl: null });
  const [portMenu, setPortMenu] = React.useState<{ anchorEl: AnchorEl; id?: string; port?: PortDTO }>({ anchorEl: null });
  const [edgeMenu, setEdgeMenu] = React.useState<{ anchorEl: AnchorEl; id?: string }>({ anchorEl: null });

  const [activeSource, setActiveSource] = React.useState<{ nodeId: string; portId: string } | null>(null);

  const { templates, editors, edgeTemplates, edgeEditors } = React.useMemo(() => {
    if (templatesProp && templatesProp.length > 0) {
      return { templates: templatesProp, editors: undefined, edgeTemplates: [{ id: "edge-default", label: "Default edge" }], edgeEditors: undefined };
    }
    return getPaletteBundle(templateSet ?? "demo");
  }, [templatesProp, templateSet]);

  const [tplOpen, setTplOpen] = React.useState(false);
  const [edgeTplOpen, setEdgeTplOpen] = React.useState(false);
  const [currentEdgeTpl, setCurrentEdgeTpl] = React.useState<EdgeTemplate | null>(null);

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorNodeId, setEditorNodeId] = React.useState<string | null>(null);
  const [editorTplId, setEditorTplId] = React.useState<string | null>(null);
  const [editorValue, setEditorValue] = React.useState<Record<string, unknown>>({});

  const [edgeEditorOpen, setEdgeEditorOpen] = React.useState(false);
  const [edgeEditorId, setEdgeEditorId] = React.useState<string | null>(null);
  const [edgeEditorTplId, setEdgeEditorTplId] = React.useState<string | null>(null);
  const [edgeEditorValue, setEdgeEditorValue] = React.useState<Record<string, unknown>>({});

  const handleNodeContextMenu = React.useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setNodeMenu({ anchorEl: e.currentTarget as Element, id: nodeId });
  }, []);

  const handlePortContextMenu = React.useCallback((e: React.MouseEvent, nodeId: string, port: PortDTO) => {
    e.preventDefault();
    setPortMenu({ anchorEl: e.currentTarget as Element, id: nodeId, port });
  }, []);

  const connectingRef = React.useRef<{ nodeId: string; portId: string } | null>(null);
  const onPortClick = React.useCallback((nodeId: string, port: PortDTO) => {
    const prev = connectingRef.current;
    if (!prev) { const src = { nodeId, portId: port.id }; connectingRef.current = src; setActiveSource(src); return; }
    if (prev.nodeId === nodeId && prev.portId === port.id) { connectingRef.current = null; setActiveSource(null); return; }

    const sourceId = prev.nodeId, targetId = nodeId, sourceHandle = prev.portId, targetHandle = port.id;
    setEdges((es) => {
      if (es.some((e) => e.source === sourceId && e.sourceHandle === sourceHandle && e.target === targetId && e.targetHandle === targetHandle)) return es;
      const defaults = currentEdgeTpl?.defaults ?? {};
      const newEdge: Edge<PortEdgeData> = {
        id: `e-${sourceId}-${sourceHandle}--${targetId}-${targetHandle}`,
        source: sourceId,
        target: targetId,
        sourceHandle,
        targetHandle,
        type: "portEdge",
        data: {
          templateId: currentEdgeTpl ? currentEdgeTpl.id : undefined,
          routing: (defaults.routing ?? "orthogonal") as any,
          color: defaults.color,
          label: defaults.label,
          extra: defaults.extra ?? {},
        },
        style: { strokeWidth: 2, stroke: (defaults.color as string | undefined) ?? DEFAULT_EDGE_STROKE },
        label: defaults.label,
      };
      return attachEdgeInteractors([...es, newEdge]);
    });
    scheduleUpdateInternals(sourceId);
    scheduleUpdateInternals(targetId);
    connectingRef.current = null; setActiveSource(null);
  }, [setEdges, scheduleUpdateInternals, currentEdgeTpl]);

  const { getNode: rfGetNode } = useReactFlow();
  const attachInteractors = React.useCallback((list: Node<RectNodeData>[]): Node<RectNodeData>[] => {
    return list.map((n) => ({
      ...n,
      data: {
        ...n.data,
        onNodeContextMenu: handleNodeContextMenu,
        onPortContextMenu: handlePortContextMenu,
        onPortClick,
        onOpenEditor: (nodeId: string) => {
          const node = rfGetNode(nodeId) as Node<RectNodeData> | undefined;
          const tplId = node?.data?.templateId ?? null;
          setEditorNodeId(nodeId);
          setEditorTplId(tplId);
          setEditorValue((node?.data?.extra as Record<string, unknown>) ?? {});
          setEditorOpen(true);
        },
        activeSource: n.data.activeSource ?? null,
      },
    }));
  }, [handleNodeContextMenu, handlePortContextMenu, onPortClick, rfGetNode]);

  const openEdgeEditor = React.useCallback((edgeId: string) => {
    const cur = edges.find((e) => e.id === edgeId);
    const d = (cur?.data ?? {}) as PortEdgeData;
    const tplId = d.templateId ?? (currentEdgeTpl ? currentEdgeTpl.id : undefined);
    const initial: Record<string, unknown> = d.extra ?? {
      color: d.color,
      label: d.label,
      routing: d.routing ?? "orthogonal",
    };
    setEdgeEditorId(edgeId);
    setEdgeEditorTplId(tplId ?? null);
    setEdgeEditorValue(initial);
    setEdgeEditorOpen(true);
  }, [edges, currentEdgeTpl]);

  const attachEdgeInteractors = React.useCallback((list: Edge<PortEdgeData>[]): Edge<PortEdgeData>[] => {
    return list.map((e) => ({
      ...e,
      data: {
        ...(e.data ?? { routing: "orthogonal" }),
        onEdgeContextMenu: (ev: React.MouseEvent) => {
          ev.preventDefault();
          setEdgeMenu({ anchorEl: ev.currentTarget as Element, id: e.id });
        },
        onOpenEditor: () => openEdgeEditor(e.id),
      },
      label: (e.label as string) ?? (e.data as any)?.label,
      style: { ...(e.style ?? {}), stroke: (e.data as any)?.color ?? (e.style as any)?.stroke },
    }));
  }, [openEdgeEditor]);

  React.useEffect(() => {
    setNodes([]); setEdges([]);
    requestAnimationFrame(() => fitView({ padding: 0.2 }));
  }, [fitView, setEdges, setNodes]);

  const prevActiveRef = React.useRef<{ nodeId: string; portId: string } | null>(null);
  React.useEffect(() => {
    const prev = prevActiveRef.current; prevActiveRef.current = activeSource;
    if (!activeSource && !prev) return;
    const affected = new Set<string>(); if (activeSource) affected.add(activeSource.nodeId); if (prev) affected.add(prev.nodeId);
    setNodes((ns) => ns.map((n) => (affected.has(n.id) ? { ...n, data: { ...n.data, activeSource: activeSource ?? null } } : n)));
  }, [activeSource, setNodes]);

  const onConnectRF = React.useCallback((c: Connection) => {
    setEdges((eds) => {
      const defaults = currentEdgeTpl?.defaults ?? {};
      const newE: Edge<PortEdgeData> = {
        id: `e-${c.source}-${c.sourceHandle}--${c.target}-${c.targetHandle}`,
        source: c.source!, target: c.target!,
        sourceHandle: c.sourceHandle, targetHandle: c.targetHandle,
        type: "portEdge",
        data: {
          templateId: currentEdgeTpl ? currentEdgeTpl.id : undefined,
          routing: (defaults.routing ?? "orthogonal") as any,
          color: defaults.color,
          label: defaults.label,
          extra: defaults.extra ?? {},
        },
        style: { strokeWidth: 2, stroke: (defaults.color as string | undefined) ?? DEFAULT_EDGE_STROKE },
        label: defaults.label,
      };
      return attachEdgeInteractors([...eds, newE]);
    });
    if (c.source) scheduleUpdateInternals(c.source as string);
    if (c.target) scheduleUpdateInternals(c.target as string);
  }, [setEdges, scheduleUpdateInternals, attachEdgeInteractors, currentEdgeTpl]);

  const wrappedOnNodesChange: OnNodesChange = React.useCallback((changes) => onNodesChange(changes), [onNodesChange]);
  const wrappedOnEdgesChange: OnEdgesChange = React.useCallback((changes) => onEdgesChange(changes), [onEdgesChange]);

  const handleDeleteNode = React.useCallback((nodeId: string) => {
    setEdges((es) => es.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setNodes((ns) => ns.filter((n) => n.id !== nodeId));
  }, [setEdges, setNodes]);

  const handleAddPort = React.useCallback((nodeId: string, side: Direction) => {
    setNodes((ns) =>
      ns.map((n) => {
        if (n.id !== nodeId) return n;
        const ports = [...n.data.ports];
        const nextIndex = ports.filter((p) => p.side === side).length;
        ports.push({
          id: `${nodeId}-${side[0]}-${nextIndex}`,
          side,
          index: nextIndex,
          label: `${nodeId}/${side.toUpperCase()}/${nextIndex}`
        });
        return { ...n, data: { ...n.data, ports } };
      })
    );
    scheduleUpdateInternals(nodeId);
  }, [setNodes, scheduleUpdateInternals]);

  const handleRemovePort = React.useCallback((nodeId: string, portId: string) => {
    setEdges((es) => es.filter((e) => e.sourceHandle !== portId && e.targetHandle !== portId));
    setNodes((ns) =>
      ns.map((n) => {
        if (n.id !== nodeId) return n;
        const removed = n.data.ports.find((p) => p.id === portId);
        if (!removed) return n;
        const ports = n.data.ports.filter((p) => p.id !== portId);
        renumberSide(ports, removed.side);
        return { ...n, data: { ...n.data, ports } };
      })
    );
    scheduleUpdateInternals(nodeId);
  }, [setEdges, setNodes, scheduleUpdateInternals]);

  const handleDeleteEdge = React.useCallback((edgeId: string) => setEdges((es) => es.filter((e) => e.id !== edgeId)), [setEdges]);

  const handleSetRouting = React.useCallback((edgeId: string, routing: PortEdgeRouting) => {
    setEdges((es) => es.map((e) => (e.id !== edgeId ? e : {
      ...e,
      data: { ...(e.data as PortEdgeData ?? {}), routing },
    })));
  }, [setEdges]);

  const handleExport = React.useCallback(() => {
    (window as any).__rfViewport = getViewport();
    const dto = exportDiagram(nodes, edges);
    const blob = new Blob([JSON.stringify(dto, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "diagram.json"; a.click(); URL.revokeObjectURL(url);
  }, [nodes, edges, getViewport]);

  const handleImport = React.useCallback(async () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = "application/json";
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      const text = await input.files[0].text();
      const dto = JSON.parse(text) as DiagramDTO;
      const { nodes: nn, edges: ee, viewport } = importDiagram(dto);
      const nn2 = attachInteractors(nn);
      const ee2 = attachEdgeInteractors(ee);
      setNodes(nn2);
      setEdges(ee2);
      if (viewport) setViewport(viewport); else fitView({ padding: 0.2 });
      requestAnimationFrame(() => nn2.forEach((n) => scheduleUpdateInternals(n.id)));
      setActiveSource(null);
    };
    input.click();
  }, [attachInteractors, attachEdgeInteractors, setNodes, setEdges, setViewport, fitView, scheduleUpdateInternals]);

  const handleClear = React.useCallback(() => {
    setEdges([]); setNodes([]); requestAnimationFrame(() => fitView({ padding: 0.2 })); setActiveSource(null);
  }, [setEdges, setNodes, fitView]);

  const handleCreateFromTemplate = React.useCallback(
    ({ name, template, extraData }: { name: string; template: NodeTemplate; extraData?: Record<string, unknown> }) => {
      const vp = getViewport();
      const id = `N${Date.now().toString(36)}`;
      const newNode = createNodeFromTemplate(
        template,
        id,
        name,
        { x: -vp.x / vp.zoom + 120, y: -vp.y / vp.zoom + 80 },
        { ...(extraData ?? {}), ...(defaultNodeExtra ?? {}) }
      );
      const nodeWithInteractors = attachInteractors([newNode])[0];
      setNodes((ns) => [...ns, nodeWithInteractors]);
      requestAnimationFrame(() => scheduleUpdateInternals(id));
      setTplOpen(false);
    },
    [getViewport, attachInteractors, setNodes, scheduleUpdateInternals, defaultNodeExtra]
  );

  const onEdgeContextMenu = React.useCallback((e: React.MouseEvent, edge: Edge) => {
    e.preventDefault();
    setEdgeMenu({ anchorEl: e.currentTarget as Element, id: edge.id });
  }, []);

  const onPaneContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setActiveSource(null);
  }, []);

  const handleEditorSave = React.useCallback((next: Record<string, unknown>) => {
    if (!editorNodeId) return;
    setNodes((ns) => ns.map((n) => (n.id === editorNodeId ? { ...n, data: { ...n.data, extra: next } } : n)));
    setEditorOpen(false);
  }, [editorNodeId, setNodes]);

  const handleEdgeEditorSave = React.useCallback((next: Record<string, unknown>) => {
    if (!edgeEditorId) return;
    setEdges((es) => es.map((e) => {
      if (e.id !== edgeEditorId) return e;
      const d = (e.data ?? {}) as PortEdgeData;
      const nextRouting = (next.routing as any) ?? d.routing ?? "orthogonal";
      const nextColor = (next.color as string | undefined) ?? d.color;
      const nextLabel = (next.label as string | undefined) ?? (e.label as string | undefined) ?? d.label;

      return {
        ...e,
        data: {
          ...d,
          routing: nextRouting,
          color: nextColor,
          label: nextLabel,
          extra: next,
          templateId: d.templateId ?? edgeEditorTplId ?? currentEdgeTpl?.id,
        },
        label: nextLabel,
        style: { ...(e.style ?? {}), stroke: nextColor ?? (e.style as any)?.stroke },
      };
    }));
    setEdgeEditorOpen(false);
  }, [edgeEditorId, edgeEditorTplId, currentEdgeTpl, setEdges]);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ p: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
        <Tooltip title="Fit view"><IconButton size="small" onClick={() => fitView({ padding: 0.2 })}><CenterFocusStrongIcon fontSize="small" /></IconButton></Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Export JSON"><IconButton size="small" onClick={handleExport}><FileDownloadIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Import JSON"><IconButton size="small" onClick={handleImport}><FileUploadIcon fontSize="small" /></IconButton></Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Add node (template)"><IconButton size="small" color="primary" onClick={() => setTplOpen(true)}><AddBoxIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title={`Edge template (${currentEdgeTpl ? currentEdgeTpl.label : "Default"})`}>
          <IconButton size="small" onClick={() => setEdgeTplOpen(true)}><TimelineIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Clear canvas"><IconButton size="small" color="error" onClick={handleClear}><DeleteSweepIcon fontSize="small" /></IconButton></Tooltip>
      </Stack>

      <Box sx={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges as any}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={wrappedOnNodesChange}
          onEdgesChange={wrappedOnEdgesChange}
          onConnect={onConnectRF}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          fitView
          defaultEdgeOptions={{ type: "portEdge", style: { strokeWidth: 2, stroke: DEFAULT_EDGE_STROKE } }}
          minZoom={0.2}
          maxZoom={2}
          panOnDrag
        >
          <Background />
          <MiniMap
            pannable
            zoomable
            maskColor={theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
            nodeColor={theme.palette.mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)"}
            nodeStrokeColor={theme.palette.mode === "dark" ? "#fff" : "#000"}
            style={{ position: "absolute", right: 8, bottom: 8, width: 180, height: 120, boxShadow: "0 2px 6px rgba(0,0,0,0.25)", borderRadius: 8, background: theme.palette.background.paper, pointerEvents: "auto", zIndex: 5 }}
          />
        </ReactFlow>
      </Box>

      <NodeContextMenu
        anchorEl={nodeMenu.anchorEl}
        open={!!nodeMenu.anchorEl}
        nodeId={nodeMenu.id}
        onClose={() => setNodeMenu({ anchorEl: null })}
        onDeleteNode={handleDeleteNode}
        onAddPort={handleAddPort}
      />
      <PortContextMenu
        anchorEl={portMenu.anchorEl}
        open={!!portMenu.anchorEl}
        nodeId={portMenu.id}
        port={portMenu.port}
        onClose={() => setPortMenu({ anchorEl: null })}
        onRemovePort={handleRemovePort}
      />
      <EdgeContextMenu
        anchorEl={edgeMenu.anchorEl}
        open={!!edgeMenu.anchorEl}
        edgeId={edgeMenu.id}
        onClose={() => setEdgeMenu({ anchorEl: null })}
        onDeleteEdge={handleDeleteEdge}
        onSetRouting={handleSetRouting}
        onOpenEditor={(edgeId) => { setEdgeMenu({ anchorEl: null }); openEdgeEditor(edgeId); }}
      />

      <NodeTemplateDialog
        open={tplOpen}
        templates={templates}
        onClose={() => setTplOpen(false)}
        onCreate={(args) => { handleCreateFromTemplate(args); }}
        editors={undefined}
      />

      <EdgeTemplateDialog
        open={edgeTplOpen}
        onClose={() => setEdgeTplOpen(false)}
        edgeTemplates={edgeTemplates}
        currentId={currentEdgeTpl?.id ?? null}
        onSelect={(tpl) => { setCurrentEdgeTpl(tpl); setEdgeTplOpen(false); }}
      />

      <NodeDataEditorDialog
        open={editorOpen}
        title="Node editor"
        editors={editors}
        templateId={editorTplId ?? undefined}
        value={editorValue ?? {}}
        onClose={() => setEditorOpen(false)}
        onSave={handleEditorSave}
      />

      <EdgeDataEditorDialog
        open={edgeEditorOpen}
        title="Edge editor"
        editors={edgeEditors}
        templateId={edgeEditorTplId ?? undefined}
        value={edgeEditorValue ?? {}}
        onClose={() => setEdgeEditorOpen(false)}
        onSave={handleEdgeEditorSave}
      />
    </Box>
  );
}

export default function DiagramEditor(props: DiagramEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}
