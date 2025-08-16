import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState
} from "reactflow";
import "reactflow/dist/style.css";
import { ResizableColumns } from "../components/ResizablePanels";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";

const initialNodes: Node[] = [
  { id: "a", position: { x: 0, y: 0 }, data: { label: "Start" }, type: "input" },
  { id: "b", position: { x: 250, y: 100 }, data: { label: "Lépés" } }
];

const initialEdges: Edge[] = [{ id: "e1", source: "a", target: "b" }];

const FlowView: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [meta, setMeta] = React.useState<string>(
    JSON.stringify({ title: "Flow meta", version: 1 }, null, 2)
  );

  const onConnect = React.useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const addNode = React.useCallback(() => {
    setNodes((ns) => {
      const id = `n${ns.length + 1}`;
      return [
        ...ns,
        {
          id,
          position: { x: Math.random() * 400 + 50, y: Math.random() * 250 + 50 },
          data: { label: `Node ${id}` }
        }
      ];
    });
  }, [setNodes]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, py: 1, borderBottom: "1px solid #2d2d2d", alignItems: "center" }}
      >
        <Typography variant="subtitle2">Flow szerkesztő</Typography>
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="outlined" onClick={addNode}>
          Új node
        </Button>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ResizableColumns
          left={
            <Box sx={{ height: "100%" }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
              >
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </Box>
          }
          right={
            <Box sx={{ p: 1, height: "100%", overflow: "hidden" }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Flow meta (CodeMirror)
              </Typography>
              <CodeMirror
                value={meta}
                height="calc(100% - 16px)"
                extensions={[json()]}
                onChange={setMeta}
              />
            </Box>
          }
          leftDefaultSize={70}
        />
      </Box>
    </Box>
  );
};

export default FlowView;
