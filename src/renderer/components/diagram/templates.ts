import type { Node } from "reactflow";
import type {
  Direction,
  NodeTemplate,
  PortDTO,
  RectNodeData,
  RectNodePersisted,
} from "./types";

function genPortsBySideCounts(
  nodeId: string,
  defs: { side: Direction; count: number; prefix?: string }[]
): PortDTO[] {
  const out: PortDTO[] = [];
  for (const d of defs) {
    for (let i = 0; i < d.count; i++) {
      const id = `${nodeId}-${d.side[0]}-${i}`;
      out.push({
        id,
        side: d.side,
        index: i,
        label: `${d.prefix ?? nodeId}/${d.side.toUpperCase()}/${i}`,
      });
    }
  }
  return out;
}

/** Előre definiált node sablonok */
export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    id: "sum-io",
    label: "Σ Processor",
    iconKind: "sum",
    width: 180,
    height: 120,
    bgTop: "#1e293b",
    bgMiddle: "#0b1220",
    bgBottom: "#111827",
    ports: [
      { side: "left", count: 2, prefix: "IN" },
      { side: "right", count: 2, prefix: "OUT" },
      { side: "top", count: 1, prefix: "CTRL" },
      { side: "bottom", count: 1, prefix: "STAT" },
    ],
  },
  {
    id: "db",
    label: "Database",
    iconKind: "db",
    width: 200,
    height: 130,
    bgTop: "#0a4a6e",
    bgMiddle: "#06344f",
    bgBottom: "#042638",
    ports: [
      { side: "left", count: 1, prefix: "IN" },
      { side: "right", count: 1, prefix: "OUT" },
      { side: "bottom", count: 2, prefix: "SYNC" },
    ],
  },
  {
    id: "gear",
    label: "Worker",
    iconKind: "gear",
    width: 170,
    height: 110,
    bgTop: "#334155",
    bgMiddle: "#0f172a",
    bgBottom: "#1f2937",
    ports: [
      { side: "left", count: 1, prefix: "IN" },
      { side: "right", count: 1, prefix: "OUT" },
    ],
  },
  {
    id: "cloud",
    label: "Cloud API",
    iconKind: "cloud",
    width: 190,
    height: 120,
    bgTop: "#1f3a8a",
    bgMiddle: "#172554",
    bgBottom: "#0b2440",
    ports: [
      { side: "top", count: 1, prefix: "AUTH" },
      { side: "bottom", count: 1, prefix: "CALL" },
      { side: "right", count: 2, prefix: "OUT" },
    ],
  },
];

/** Sablon alapján node példányosítása */
export function createNodeFromTemplate(
  template: NodeTemplate,
  id: string,
  title: string,
  position: { x: number; y: number }
): Node<RectNodeData> {
  const persisted: RectNodePersisted = {
    title,
    width: template.width,
    height: template.height,
    bgTop: template.bgTop,
    bgMiddle: template.bgMiddle,
    bgBottom: template.bgBottom,
    iconKind: template.iconKind,
    ports: Array.isArray(template.ports)
      ? genPortsBySideCounts(id, template.ports as any)
      : (template.ports as any)?.explicit ?? [],
  };
  return {
    id,
    type: "rectNode",
    position,
    data: {
      ...persisted,
      activeSource: null,
      // interaktorokat a szerkesztő fűzi be
    },
  };
}
