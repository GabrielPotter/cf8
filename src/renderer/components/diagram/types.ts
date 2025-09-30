export type Direction = "top" | "right" | "bottom" | "left";

/** #### PORT */
export type PortDTO = {
  id: string;
  side: Direction;
  index: number;
  label?: string;
};

/** #### NODE (persisted + runtime) */
export type RectNodePersisted = {
  templateId?: string;
  title?: string;
  width: number;
  height: number;
  ports: PortDTO[];
  bgTop?: string;
  bgMiddle?: string;
  bgBottom?: string;
  iconKind?: "sum" | "db" | "gear" | "cloud";
  extra?: Record<string, unknown>;
};

export type RectNodeRuntime = {
  onNodeContextMenu?: (e: React.MouseEvent, nodeId: string) => void;
  onPortContextMenu?: (e: React.MouseEvent, nodeId: string, port: PortDTO) => void;
  onPortClick?: (nodeId: string, port: PortDTO) => void;
  onOpenEditor?: (nodeId: string) => void;
  activeSource?: { nodeId: string; portId: string } | null;
};

export type RectNodeData = RectNodePersisted & RectNodeRuntime;

/** #### EDGE (persisted + runtime) */
export type PortEdgeRouting = "straight" | "bezier" | "orthogonal";

export type PortEdgePersisted = {
  templateId?: string; // edge template key - if an editor exists
  routing: PortEdgeRouting;
  color?: string;
  label?: string;
  extra?: Record<string, unknown>;
};

export type PortEdgeRuntime = {
  onEdgeContextMenu?: (e: React.MouseEvent, edgeId: string) => void;
  onOpenEditor?: (edgeId: string) => void;
};

export type PortEdgeData = PortEdgePersisted & PortEdgeRuntime;

/** #### DIAGRAM DTO */
export type DiagramViewport = { x: number; y: number; zoom: number };

export type NodeDTO = {
  id: string;
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  ports: PortDTO[];
  meta?: {
    templateId?: string;
    iconKind?: RectNodePersisted["iconKind"];
    bgTop?: string;
    bgMiddle?: string;
    bgBottom?: string;
    extra?: Record<string, unknown>;
    [k: string]: unknown;
  };
};

export type EdgeDTO = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  routing?: PortEdgeRouting;
  color?: string;
  label?: string;
  meta?: {
    templateId?: string;
    extra?: Record<string, unknown>;
    [k: string]: unknown;
  };
};

export type DiagramDTO = {
  version: number;
  nodes: NodeDTO[];
  edges: EdgeDTO[];
  viewport?: DiagramViewport;
  meta?: Record<string, unknown>;
};

/** #### NODE/EDGE templates and editor props */
export type NodeTemplate = {
  id: string;                // e.g. "slang-intent"
  label: string;             // UI label
  iconKind: RectNodePersisted["iconKind"];
  width: number;
  height: number;
  bgTop?: string;
  bgMiddle?: string;
  bgBottom?: string;
  ports?:
    | { side: Direction; count: number; prefix?: string }[]
    | { explicit: PortDTO[] };
  extraDefault?: Record<string, unknown>;
};

export type NodeTemplateEditorProps = {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
};

export type EdgeTemplate = {
  id: string;                // e.g. "slang-basic-edge"
  label: string;             // UI label
  // visual defaults for new edges
  defaults?: {
    routing?: PortEdgeRouting;
    color?: string;
    label?: string;
    extra?: Record<string, unknown>;
  };
};

export type EdgeTemplateEditorProps = {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
};
