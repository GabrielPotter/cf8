import React from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  OnEdgesChange,
  OnNodesChange,
  useUpdateNodeInternals,
} from "reactflow";
import "reactflow/dist/style.css";
import { Box, Button, Stack, Tooltip, PopoverProps } from "@mui/material";
import RectNode from "./RectNode";
import PortEdge from "./PortEdge";
import { EdgeContextMenu, NodeContextMenu, PortContextMenu } from "./contextMenus";
import type { Direction, DiagramDTO, PortDTO, RectNodeData } from "./types";
import { exportDiagram, importDiagram, renumberSide } from "./io";

const nodeTypes = { rectNode: RectNode };
const edgeTypes = { portEdge: PortEdge };

type AnchorEl = PopoverProps["anchorEl"];

function useStablePortClick(
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  setActiveSource: React.Dispatch<React.SetStateAction<{ nodeId: string; portId: string } | null>>,
  updateNodeInternals: (id: string) => void
) {
  const [connectingFrom, setConnectingFrom] = React.useState<{ nodeId: string; portId: string } | null>(null);
  const connectingRef = React.useRef(connectingFrom);
  React.useEffect(() => { connectingRef.current = connectingFrom; }, [connectingFrom]);

  const onPortClick = React.useCallback(
    (nodeId: string, port: PortDTO) => {
      const prev = connectingRef.current;
      if (!prev) {
        const src = { nodeId, portId: port.id };
        setConnectingFrom(src);
        setActiveSource(src);
        return;
      }
      if (prev.nodeId === nodeId && prev.portId === port.id) {
        setConnectingFrom(null);
        setActiveSource(null);
        return;
      }

      const sourceId = prev.nodeId;
      const targetId = nodeId;
      const sourceHandle = prev.portId;
      const targetHandle = port.id;
      const edgeId = `e-${sourceId}-${sourceHandle}--${targetId}-${targetHandle}`;

      setEdges((es) => {
        if (es.some((e) => e.source === sourceId && e.sourceHandle === sourceHandle && e.target === targetId && e.targetHandle === targetHandle)) {
          return es;
        }
        const newEdge: Edge = {
          id: edgeId,
          source: sourceId,
          target: targetId,
          sourceHandle,
          targetHandle,
          type: "portEdge",
          // 👇 alap fehér stroke sötét háttérhez (felülírható)
          style: { strokeWidth: 2, stroke: "#fff" },
          label: `${sourceId} → ${targetId}`,
          data: { routing: "orthogonal" as const },
        };
        return [...es, newEdge];
      });

      setTimeout(() => {
        updateNodeInternals(sourceId);
        updateNodeInternals(targetId);
      }, 0);

      setConnectingFrom(null);
      setActiveSource(null);
    },
    [setEdges, setActiveSource, updateNodeInternals]
  );

  return { onPortClick };
}

function attachInteractors(
  list: Node<RectNodeData>[],
  handlers: {
    onPortClick: (nodeId: string, port: PortDTO) => void;
    setNodeMenu: React.Dispatch<React.SetStateAction<{ anchorEl: AnchorEl; id?: string }>>;
    setPortMenu: React.Dispatch<React.SetStateAction<{ anchorEl: AnchorEl; id?: string; port?: PortDTO }>>;
  }
): Node<RectNodeData>[] {
  const { onPortClick, setNodeMenu, setPortMenu } = handlers;
  return list.map((n) => ({
    ...n,
    data: {
      ...n.data,
      onNodeContextMenu: (e: React.MouseEvent, nodeId: string) =>
        setNodeMenu({ anchorEl: (e.currentTarget as Element), id: nodeId }),
      onPortContextMenu: (e: React.MouseEvent, nodeId: string, port: PortDTO) =>
        setPortMenu({ anchorEl: (e.currentTarget as Element), id: nodeId, port }),
      onPortClick,
      activeSource: n.data.activeSource ?? null,
    },
  }));
}

function EditorInner() {
  const { fitView, getViewport, setViewport } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const [nodes, setNodes, onNodesChange] = useNodesState<RectNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [nodeMenu, setNodeMenu] = React.useState<{ anchorEl: AnchorEl; id?: string }>({ anchorEl: null });
  const [portMenu, setPortMenu] = React.useState<{ anchorEl: AnchorEl; id?: string; port?: PortDTO }>({ anchorEl: null });
  const [edgeMenu, setEdgeMenu] = React.useState<{ anchorEl: AnchorEl; id?: string }>({ anchorEl: null });

  const [activeSource, setActiveSource] = React.useState<{ nodeId: string; portId: string } | null>(null);

  const { onPortClick } = useStablePortClick(setEdges, setActiveSource, updateNodeInternals);

  React.useEffect(() => {
    const initial: Node<RectNodeData>[] = attachInteractors(
      [
        {
          id: "A",
          type: "rectNode",
          position: { x: 100, y: 120 },
          data: {
            title: "Box A",
            width: 160,
            height: 90,
            ports: [
              { id: "A-t-0", side: "top", index: 0, label: "A/T0" },
              { id: "A-r-0", side: "right", index: 0, label: "A/R0" },
              { id: "A-b-0", side: "bottom", index: 0, label: "A/B0" },
              { id: "A-l-0", side: "left", index: 0, label: "A/L0" },
            ],
          },
        },
        {
          id: "B",
          type: "rectNode",
          position: { x: 420, y: 220 },
          data: {
            title: "Box B",
            width: 160,
            height: 90,
            ports: [
              { id: "B-t-0", side: "top", index: 0, label: "B/T0" },
              { id: "B-r-0", side: "right", index: 0, label: "B/R0" },
              { id: "B-b-0", side: "bottom", index: 0, label: "B/B0" },
              { id: "B-l-0", side: "left", index: 0, label: "B/L0" },
            ],
          },
        },
      ],
      { onPortClick, setNodeMenu, setPortMenu }
    );

    setNodes(initial);
    setEdges([
      {
        id: "E1",
        source: "A",
        target: "B",
        sourceHandle: "A-r-0",
        targetHandle: "B-l-0",
        type: "portEdge",
        style: { strokeWidth: 2, stroke: "#fff" },
        data: { routing: "orthogonal" as const, hint: "Right-to-Left" },
        label: "A → B",
      },
    ]);

    setTimeout(() => fitView({ padding: 0.2 }), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevActiveRef = React.useRef<{ nodeId: string; portId: string } | null>(null);
  React.useEffect(() => {
    const prev = prevActiveRef.current;
    prevActiveRef.current = activeSource;
    if (!activeSource && !prev) return;
    const affected = new Set<string>();
    if (activeSource) affected.add(activeSource.nodeId);
    if (prev) affected.add(prev.nodeId);
    setNodes((ns) => ns.map((n) => (affected.has(n.id) ? { ...n, data: { ...n.data, activeSource: activeSource ?? null } } : n)));
  }, [activeSource, setNodes]);

  const onConnect = React.useCallback(
    (c: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            type: "portEdge",
            style: { strokeWidth: 2, stroke: "#fff" },
            data: { routing: "orthogonal" },
          },
          eds
        )
      );
      if (c.source) setTimeout(() => updateNodeInternals(c.source as string), 0);
      if (c.target) setTimeout(() => updateNodeInternals(c.target as string), 0);
    },
    [setEdges, updateNodeInternals]
  );

  const wrappedOnNodesChange: OnNodesChange = React.useCallback((changes) => onNodesChange(changes), [onNodesChange]);
  const wrappedOnEdgesChange: OnEdgesChange = React.useCallback((changes) => onEdgesChange(changes), [onEdgesChange]);

  const handleDeleteNode = (nodeId: string) => {
    setEdges((es) => es.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setNodes((ns) => ns.filter((n) => n.id !== nodeId));
  };
  const handleAddPort = (nodeId: string, side: Direction) => {
    setNodes((ns) =>
      ns.map((n) => {
        if (n.id !== nodeId) return n;
        const ports = [...n.data.ports];
        const nextIndex = ports.filter((p) => p.side === side).length;
        ports.push({ id: `${nodeId}-${side[0]}-${nextIndex}`, side, index: nextIndex, label: `${nodeId}/${side.toUpperCase()}/${nextIndex}` });
        return { ...n, data: { ...n.data, ports } };
      })
    );
    setTimeout(() => updateNodeInternals(nodeId), 0);
  };
  const handleRemovePort = (nodeId: string, portId: string) => {
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
    setTimeout(() => updateNodeInternals(nodeId), 0);
  };

  const handleDeleteEdge = (edgeId: string) => setEdges((es) => es.filter((e) => e.id !== edgeId));
  const handleSetRouting = (edgeId: string, routing: "straight" | "bezier" | "orthogonal") => {
    setEdges((es) => es.map((e) => (e.id !== edgeId ? e : { ...e, data: { ...(e.data ?? {}), routing } })));
  };

  const handleExport = () => {
    (window as any).__rfViewport = getViewport();
    const dto = exportDiagram(nodes, edges);
    const blob = new Blob([JSON.stringify(dto, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "diagram.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "application/json";
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      const text = await input.files[0].text();
      const dto = JSON.parse(text) as DiagramDTO;
      const { nodes: nn, edges: ee, viewport } = importDiagram(dto);
      const nn2 = attachInteractors(nn, { onPortClick, setNodeMenu, setPortMenu });
      setNodes(nn2);
      setEdges(ee.map((e) => ({
        ...e,
        type: "portEdge" as const,
        style: { strokeWidth: 2, stroke: "#fff", ...(e as any).style },
      })));
      if (viewport) setViewport(viewport); else fitView({ padding: 0.2 });
      setTimeout(() => nn2.forEach((n) => updateNodeInternals(n.id)), 0);
      setActiveSource(null);
    };
    input.click();
  };

  const onEdgeContextMenu = React.useCallback((e: React.MouseEvent, edge: Edge) => {
    e.preventDefault();
    setEdgeMenu({ anchorEl: e.currentTarget as Element, id: edge.id });
  }, []);
  const onPaneContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setActiveSource(null);
  }, []);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" spacing={1} sx={{ p: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
        <Button variant="outlined" onClick={() => fitView({ padding: 0.2 })}>Fit view</Button>
        <Button variant="outlined" onClick={handleExport}>Export JSON</Button>
        <Button variant="outlined" onClick={handleImport}>Import JSON</Button>
        <Tooltip title="Új téglalap hozzáadása">
          <Button variant="contained" onClick={() => {
            const id = `N${Date.now().toString(36)}`;
            const n: Node<RectNodeData> = {
              id,
              type: "rectNode",
              position: { x: 120, y: 80 },
              data: {
                title: id,
                width: 160,
                height: 90,
                ports: [
                  { id: `${id}-l-0`, side: "left", index: 0, label: `${id}/L/0` },
                  { id: `${id}-r-0`, side: "right", index: 0, label: `${id}/R/0` },
                ],
                activeSource: activeSource ?? null,
              },
            };
            setNodes((ns) => attachInteractors([...ns, n], { onPortClick, setNodeMenu, setPortMenu }));
          }}>
            Add box
          </Button>
        </Tooltip>
      </Stack>

      <Box sx={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={wrappedOnNodesChange}
          onEdgesChange={wrappedOnEdgesChange}
          onConnect={onConnect}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          fitView
          defaultEdgeOptions={{
            type: "portEdge",
            style: { strokeWidth: 2, stroke: "#fff" }, // jól látható default
          }}
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </Box>

      <NodeContextMenu
        anchorEl={nodeMenu.anchorEl} open={!!nodeMenu.anchorEl}
        nodeId={nodeMenu.id}
        onClose={() => setNodeMenu({ anchorEl: null })}
        onDeleteNode={handleDeleteNode}
        onAddPort={handleAddPort}
      />
      <PortContextMenu
        anchorEl={portMenu.anchorEl} open={!!portMenu.anchorEl}
        nodeId={portMenu.id} port={portMenu.port}
        onClose={() => setPortMenu({ anchorEl: null })}
        onRemovePort={handleRemovePort}
      />
      <EdgeContextMenu
        anchorEl={edgeMenu.anchorEl} open={!!edgeMenu.anchorEl}
        edgeId={edgeMenu.id}
        onClose={() => setEdgeMenu({ anchorEl: null })}
        onDeleteEdge={handleDeleteEdge}
        onSetRouting={handleSetRouting}
      />
    </Box>
  );
}

export default function DiagramEditor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
