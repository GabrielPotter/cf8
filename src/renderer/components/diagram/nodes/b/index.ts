import type { NodeTemplate } from "../../types";

/** Példa: „B” készlet – más méretezés/ikon */
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
