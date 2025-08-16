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

/** #### DIAGRAM DTO */
export type DiagramDTO = {
  schemaVersion: number;
  nodes: any[];
  edges: any[];
  viewport?: { x: number; y: number; zoom: number };
};

/** #### EDGE (persisted + runtime) */
export type PortEdgeRouting = "straight" | "bezier" | "orthogonal";

export type PortEdgePersisted = {
  templateId?: string; // edge template kulcs – ha van editor
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

/** #### NODE/EDGE sablonok és editor-propsok */
export type NodeTemplate = {
  id: string;                // pl. "slang-intent"
  label: string;             // UI név
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
  id: string;                // pl. "slang-basic-edge"
  label: string;             // UI név
  // vizuális alapok (default értékek új élhez)
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
