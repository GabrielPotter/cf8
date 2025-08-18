import type { NodeTemplate } from "../../types";

/** Példa: „A” készlet – most csak egy minimál sablon, hogy lásd a váltást */
export const A_TEMPLATES: NodeTemplate[] = [
  {
    id: "a-basic",
    label: "A / Basic",
    iconKind: "gear",
    width: 160,
    height: 100,
    bgTop: "#2b2f3a",
    bgMiddle: "#1b1f2a",
    bgBottom: "#10131a",
    ports: [
      { side: "left", count: 1, prefix: "IN" },
      { side: "right", count: 1, prefix: "OUT" },
    ],
    extraDefault: { family: "A", tier: "basic" },
  },
];
