import type { NodeTemplate, Direction, PortDTO } from "../../types";

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

/** DEMO template set */
export const DEMO_TEMPLATES: NodeTemplate[] = [
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
    extraDefault: { category: "compute", version: 1 },
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
    extraDefault: { category: "storage" },
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
    extraDefault: { category: "worker" },
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
    extraDefault: { category: "integration" },
  },
];

/** Helper: optional explicit port list generation - here we only use the counts-based definition. */
export { genPortsBySideCounts };
