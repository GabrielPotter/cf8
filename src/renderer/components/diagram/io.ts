import { Edge, Node, XYPosition } from "reactflow";
import type { DiagramDTO, EdgeDTO, EdgeRouting, NodeDTO, PortDTO, RectNodeData } from "./types";

// ReactFlow Node -> NodeDTO
export function toDTO_Node(n: Node<RectNodeData>): NodeDTO {
  const { id, position, data } = n;
  return {
    id,
    type: "rect",
    x: position.x,
    y: position.y,
    width: data.width,
    height: data.height,
    title: data.title,
    ports: data.ports,
    meta: {},
  };
}

// ReactFlow Edge -> EdgeDTO
export function toDTO_Edge(e: Edge): EdgeDTO {
  // RF edge .sourceHandle és .targetHandle a port id
  const routing: EdgeRouting =
    (e.data?.routing as EdgeRouting) ?? "straight";

  return {
    id: e.id,
    source: { nodeId: e.source!, portId: e.sourceHandle! },
    target: { nodeId: e.target!, portId: e.targetHandle! },
    routing,
    label: e.label as string | undefined,
    hint: e.data?.hint,
    waypoints: e.data?.waypoints,
    meta: {},
  };
}

export function exportDiagram(nodes: Node<RectNodeData>[], edges: Edge[]): DiagramDTO {
  return {
    version: 1,
    nodes: nodes.map(toDTO_Node),
    edges: edges.map(toDTO_Edge),
    viewport: (window as any).__rfViewport ?? undefined,
    meta: {},
  };
}

// DTO -> ReactFlow Node
export function fromDTO_Node(n: NodeDTO): Node<RectNodeData> {
  return {
    id: n.id,
    type: "rectNode",
    position: { x: n.x, y: n.y } as XYPosition,
    data: {
      title: n.title,
      width: n.width,
      height: n.height,
      ports: n.ports,
    },
  };
}

// DTO -> ReactFlow Edge
export function fromDTO_Edge(e: EdgeDTO): Edge {
  const type = e.routing === "straight" ? "straight" :
               e.routing === "bezier" ? "bezier" : "smoothstep";

  return {
    id: e.id,
    source: e.source.nodeId,
    target: e.target.nodeId,
    sourceHandle: e.source.portId,
    targetHandle: e.target.portId,
    type,
    label: e.label,
    data: {
      routing: e.routing,
      hint: e.hint,
      waypoints: e.waypoints,
    },
  };
}

export function importDiagram(dto: DiagramDTO) {
  const nodes = dto.nodes.map(fromDTO_Node);
  const edges = dto.edges.map(fromDTO_Edge);
  const viewport = dto.viewport;
  return { nodes, edges, viewport };
}

// Segéd: port index újraszámozás az adott oldalon
export function renumberSide(ports: PortDTO[], side: "top"|"right"|"bottom"|"left") {
  const arr = ports.filter(p => p.side === side).sort((a,b)=>a.index-b.index);
  arr.forEach((p, i) => p.index = i);
}
