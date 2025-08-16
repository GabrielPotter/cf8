export type Direction = "top" | "right" | "bottom" | "left";

export interface PortDTO {
  id: string;
  side: Direction;
  index: number;
  label?: string;
  meta?: Record<string, any>;
}

export interface NodeDTO {
  id: string;
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  ports: PortDTO[];
  meta?: Record<string, any>;
}

export type EdgeRouting = "straight" | "bezier" | "orthogonal";

export interface EdgeDTO {
  id: string;
  source: { nodeId: string; portId: string };
  target: { nodeId: string; portId: string };
  routing: EdgeRouting;
  label?: string;
  hint?: string;
  waypoints?: { x: number; y: number }[];
  meta?: Record<string, any>;
}

export interface DiagramDTO {
  version: 1;
  nodes: NodeDTO[];
  edges: EdgeDTO[];
  viewport?: { x: number; y: number; zoom: number };
  meta?: Record<string, any>;
}

export interface RectNodeData {
  title?: string;
  width: number;
  height: number;
  ports: PortDTO[];

  onPortContextMenu?: (e: React.MouseEvent, nodeId: string, port: PortDTO) => void;
  onNodeContextMenu?: (e: React.MouseEvent, nodeId: string) => void;
  onPortClick?: (nodeId: string, port: PortDTO) => void;

  // Vizuális kijelöléshez (forrás port)
  activeSource?: { nodeId: string; portId: string } | null;
}
