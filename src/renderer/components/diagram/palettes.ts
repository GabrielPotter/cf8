import type { NodeTemplate, EdgeTemplate } from "./types";
import { DEMO_TEMPLATES } from "./nodes/demo";
import { A_TEMPLATES } from "./nodes/a";
import { B_TEMPLATES } from "./nodes/b";
import {
  SLANG_TEMPLATES,
  SLANG_EDITORS,
  SLANG_EDGE_TEMPLATES,
  SLANG_EDGE_EDITORS,
} from "./nodes/slang";

export type TemplateEditorsMap = Record<string, (props: any) => JSX.Element>;

type PaletteBundle = {
  templates: NodeTemplate[];
  editors?: TemplateEditorsMap;
  edgeTemplates: EdgeTemplate[];
  edgeEditors?: TemplateEditorsMap;
};

const REGISTRY: Record<string, PaletteBundle> = {
  demo: {
    templates: DEMO_TEMPLATES,
    editors: undefined,
    edgeTemplates: [
      { id: "edge-default", label: "Default edge", defaults: { routing: "orthogonal", color: "#888" } },
    ],
    edgeEditors: undefined,
  },
  a: {
    templates: A_TEMPLATES,
    editors: undefined,
    edgeTemplates: [
      { id: "edge-default", label: "Default edge", defaults: { routing: "orthogonal", color: "#888" } },
    ],
    edgeEditors: undefined,
  },
  b: {
    templates: B_TEMPLATES,
    editors: undefined,
    edgeTemplates: [
      { id: "edge-default", label: "Default edge", defaults: { routing: "orthogonal", color: "#888" } },
    ],
    edgeEditors: undefined,
  },
  slang: {
    templates: SLANG_TEMPLATES,
    editors: SLANG_EDITORS,
    edgeTemplates: SLANG_EDGE_TEMPLATES,
    edgeEditors: SLANG_EDGE_EDITORS,
  },
};

export function getPaletteBundle(key?: string): PaletteBundle {
  if (!key) return REGISTRY.demo;
  return REGISTRY[key] ?? REGISTRY.demo;
}
