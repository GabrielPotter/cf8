import type { NodeTemplate } from "../../types";

/** Example: "B" set - different sizing/icon */
export const B_TEMPLATES: NodeTemplate[] = [
  {
    id: "b-service",
    label: "B / Service",
    iconKind: "cloud",
    width: 220,
    height: 140,
    bgTop: "#234",
    bgMiddle: "#112",
    bgBottom: "#0a0f1a",
    ports: [
      { side: "top", count: 1, prefix: "CTRL" },
      { side: "bottom", count: 2, prefix: "IO" },
      { side: "right", count: 1, prefix: "OUT" },
    ],
    extraDefault: { family: "B", role: "service" },
  },
];
