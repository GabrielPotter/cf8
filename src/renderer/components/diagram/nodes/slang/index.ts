import { NodeTemplate, NodeTemplateEditorProps, EdgeTemplate } from "../../types";
import IntentEditor from "./IntentEditor";
import EntityEditor from "./EntityEditor";
import ReplyEditor from "./ReplyEditor";
import EdgeBasicEditor from "./EdgeBasicEditor";

/** ---- NODE templates ---- */
export const SLANG_TEMPLATES: NodeTemplate[] = [
  {
    id: "slang-intent",
    label: "Slang / Intent",
    iconKind: "sum",
    width: 200,
    height: 120,
    bgTop: "#1e293b",
    bgMiddle: "#0b1220",
    bgBottom: "#111827",
    ports: [
      { side: "left", count: 1, prefix: "IN" },
      { side: "right", count: 2, prefix: "OUT" },
    ],
    extraDefault: {
      intentName: "",
      trainingPhrases: [] as string[],
      confidenceThreshold: 0.6,
      locale: "en",
    },
  },
  {
    id: "slang-entity",
    label: "Slang / Entity Extractor",
    iconKind: "gear",
    width: 220,
    height: 130,
    bgTop: "#334155",
    bgMiddle: "#0f172a",
    bgBottom: "#1f2937",
    ports: [
      { side: "left", count: 1, prefix: "IN" },
      { side: "right", count: 1, prefix: "OUT" },
      { side: "bottom", count: 1, prefix: "ERR" },
    ],
    extraDefault: {
      entityName: "",
      patterns: [] as string[],
      strategy: "regex",
    },
  },
  {
    id: "slang-reply",
    label: "Slang / Reply",
    iconKind: "cloud",
    width: 200,
    height: 120,
    bgTop: "#1f3a8a",
    bgMiddle: "#172554",
    bgBottom: "#0b2440",
    ports: [
      { side: "left", count: 2, prefix: "IN" },
      { side: "right", count: 1, prefix: "OUT" },
    ],
    extraDefault: {
      text: "OK",
      tone: "neutral",
      language: "en",
    },
  },
];

/** ---- NODE editors ---- */
export const SLANG_EDITORS: Record<string, (p: NodeTemplateEditorProps) => JSX.Element> = {
  "slang-intent": IntentEditor,
  "slang-entity": EntityEditor,
  "slang-reply": ReplyEditor,
};

/** ---- EDGE templates (edge types for the palette) ---- */
export const SLANG_EDGE_TEMPLATES: EdgeTemplate[] = [
  {
    id: "slang-basic-edge",
    label: "Slang / Basic edge",
    defaults: {
      routing: "orthogonal",
      color: "#888",
      label: "",
      extra: {},
    },
  },
  {
    id: "slang-straight-blue",
    label: "Slang / Straight blue",
    defaults: {
      routing: "straight",
      color: "#2196f3",
      label: "",
      extra: {},
    },
  },
];

/** ---- EDGE editors ---- */
export const SLANG_EDGE_EDITORS: Record<string, (p: any) => JSX.Element> = {
  "slang-basic-edge": EdgeBasicEditor,
  "slang-straight-blue": EdgeBasicEditor,
};
