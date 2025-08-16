import type { Node } from "reactflow";
import type { NodeTemplate, RectNodeData, RectNodePersisted, Direction, PortDTO } from "./types";

function genPortsBySideCounts(
  nodeId: string,
  defs: { side: Direction; count: number; prefix?: string }[]
): PortDTO[] {
  const out: PortDTO[] = [];
  for (const d of defs) {
    for (let i = 0; i < d.count; i++) {
      const id = `${nodeId}-${d.side[0]}-${i}`;
      out.push({ id, side: d.side, index: i, label: `${d.prefix ?? nodeId}/${d.side.toUpperCase()}/${i}` });
    }
  }
  return out;
}

export function createNodeFromTemplate(
  template: NodeTemplate,
  id: string,
  title: string,
  position: { x: number; y: number },
  extraData?: Record<string, unknown>
): Node<RectNodeData> {
  const persisted: RectNodePersisted = {
    /** 👇 FONTOS: ebből tudjuk, melyik editor jár a node-hoz */
    templateId: template.id,
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
    extra: { ...(template.extraDefault ?? {}), ...(extraData ?? {}) },
  };

  return {
    id,
    type: "rectNode",
    position,
    data: { ...persisted, activeSource: null },
  };
}
