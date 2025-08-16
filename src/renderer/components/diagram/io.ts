import type { Edge, Node, Viewport } from "reactflow";
import type { DiagramDTO, PortDTO, RectNodeData, PortEdgeData } from "./types";

type SerializedNode = {
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
    iconKind?: RectNodeData["iconKind"];
    bgTop?: string;
    bgMiddle?: string;
    bgBottom?: string;
    extra?: Record<string, unknown>;
    [k: string]: unknown;
  };
};

type SerializedEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  routing?: "straight" | "bezier" | "orthogonal";
  color?: string;
  label?: string;
  meta?: {
    templateId?: string;
    extra?: Record<string, unknown>;
    [k: string]: unknown;
  };
};

type SerializedViewport = { x: number; y: number; zoom: number };

type SerializedDiagram = {
  version: number;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  viewport?: SerializedViewport;
  meta?: Record<string, unknown>;
};

export function exportDiagram(
  nodes: Node<RectNodeData>[],
  edges: Edge<PortEdgeData>[],
  opts?: { version?: number; meta?: Record<string, unknown> }
): SerializedDiagram {
  const version = opts?.version ?? 3;
  const outNodes: SerializedNode[] = nodes.map((n) => {
    const d = n.data;
    return {
      id: n.id,
      type: "rect",
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
      width: d.width,
      height: d.height,
      title: d.title,
      ports: d.ports ?? [],
      meta: {
        templateId: d.templateId,
        iconKind: d.iconKind,
        bgTop: d.bgTop,
        bgMiddle: d.bgMiddle,
        bgBottom: d.bgBottom,
        extra: d.extra ?? {},
      },
    };
  });

  const outEdges: SerializedEdge[] = edges.map((e) => {
    const ed = (e.data ?? {}) as PortEdgeData;
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      routing: ed.routing,
      color: ed.color,
      label: (e.label as string) ?? ed.label,
      meta: {
        templateId: ed.templateId,
        extra: ed.extra ?? {},
      },
    };
  });

  const vp: SerializedViewport | undefined = (() => {
    const anyWin = window as any;
    if (anyWin && anyWin.__rfViewport) {
      const { x, y, zoom } = anyWin.__rfViewport as Viewport;
      return { x: Math.round(x), y: Math.round(y), zoom };
    }
    return undefined;
  })();

  return { version, nodes: outNodes, edges: outEdges, viewport: vp, meta: opts?.meta ?? {} };
}

export function importDiagram(dto: SerializedDiagram): {
  nodes: Node<RectNodeData>[];
  edges: Edge<PortEdgeData>[];
  viewport?: Viewport;
} {
  const nodes: Node<RectNodeData>[] = dto.nodes.map((sn) => {
    const data: RectNodeData = {
      templateId: sn.meta?.templateId,
      title: sn.title,
      width: sn.width,
      height: sn.height,
      ports: sn.ports ?? [],
      iconKind: sn.meta?.iconKind,
      bgTop: sn.meta?.bgTop,
      bgMiddle: sn.meta?.bgMiddle,
      bgBottom: sn.meta?.bgBottom,
      extra: (sn.meta?.extra ?? {}) as Record<string, unknown>,
      activeSource: null,
    };
    return { id: sn.id, type: "rectNode", position: { x: sn.x, y: sn.y }, data };
  });

  const edges: Edge<PortEdgeData>[] = (dto.edges ?? []).map((se) => ({
    id: se.id,
    source: se.source,
    target: se.target,
    sourceHandle: se.sourceHandle,
    targetHandle: se.targetHandle,
    type: "portEdge",
    data: {
      routing: se.routing ?? "orthogonal",
      color: se.color,
      label: se.label,
      templateId: se.meta?.templateId,
      extra: se.meta?.extra ?? {},
    },
    label: se.label,
    style: { strokeWidth: 2, stroke: se.color },
  }));

  const viewport: Viewport | undefined = dto.viewport
    ? { x: dto.viewport.x, y: dto.viewport.y, zoom: dto.viewport.zoom }
    : undefined;

  return { nodes, edges, viewport };
}

export function renumberSide(ports: PortDTO[], side: PortDTO["side"]) {
  const sidePorts = ports.filter((p) => p.side === side).sort((a, b) => a.index - b.index);
  sidePorts.forEach((p, idx) => (p.index = idx));
}
