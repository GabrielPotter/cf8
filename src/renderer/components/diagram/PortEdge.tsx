import * as React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
  Position,
} from "reactflow";

/**
 * Egyedi él:
 * - a forrás/cél pontot kifelé tolja (CUT), hogy a vonal a konnektor előtt érjen véget
 * - a nyílhegyet kézzel rajzolja
 * - a path VÉGPONTJA a nyíl ALAPJÁNAK KÖZEPÉIG tart (nem megy a nyíl alá)
 * - a labelt az útvonal közepére teszi
 */

const PORT_SIZE = 14;
const CUT = PORT_SIZE / 2 + 6; // port közepe elé ennyivel hozzuk vissza a vonalat (ne lógjon a kör alá)
const ARROW_SIZE = 8;          // nyíl hossza
const ARROW_HALF = 3.5;        // nyíl fél-alap szélessége

function outwardDelta(pos: Position, amount: number): { dx: number; dy: number } {
  switch (pos) {
    case Position.Left: return { dx: -amount, dy: 0 };
    case Position.Right: return { dx:  amount, dy: 0 };
    case Position.Top: return { dx: 0, dy: -amount };
    case Position.Bottom: return { dx: 0, dy:  amount };
    default: return { dx: 0, dy: 0 };
  }
}

function unitFromDelta(dx: number, dy: number): { ux: number; uy: number } {
  const len = Math.hypot(dx, dy) || 1;
  return { ux: dx / len, uy: dy / len };
}

function unitFromPosition(pos: Position): { ux: number; uy: number } {
  switch (pos) {
    case Position.Left: return { ux: -1, uy: 0 };
    case Position.Right: return { ux: 1, uy: 0 };
    case Position.Top: return { ux: 0, uy: -1 };
    case Position.Bottom: return { ux: 0, uy: 1 };
    default: return { ux: 1, uy: 0 };
  }
}

/** RF labelBgPadding -> CSS padding normalizáló */
function normalizePadding(
  p: EdgeProps["labelBgPadding"]
): string | number | undefined {
  if (p == null) return undefined;
  if (typeof p === "number" || typeof p === "string") return p;
  // React Flow: [vertical, horizontal]
  if (Array.isArray(p)) {
    const [v, h] = p;
    const vStr = typeof v === "number" ? `${v}px` : String(v);
    const hStr = typeof h === "number" ? `${h}px` : String(h);
    return `${vStr} ${hStr}`;
  }
  return undefined;
}

export default function PortEdge(props: EdgeProps) {
  const {
    id,
    sourceX, sourceY, targetX, targetY,
    sourcePosition = Position.Right,
    targetPosition = Position.Left,
    style,
    label,
    labelStyle,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    interactionWidth,
    data,
  } = props;

  // forrás/cél pontokat a port félátmérőjével "kifelé" toljuk
  const src = outwardDelta(sourcePosition, CUT);
  const sx = sourceX + src.dx;
  const sy = sourceY + src.dy;

  const dst = outwardDelta(targetPosition, CUT);
  const tx_tip = targetX + dst.dx; // a nyíl csúcsa (a port előtt)
  const ty_tip = targetY + dst.dy;

  // Nyíl orientáció:
  const routing = (data?.routing as "straight" | "bezier" | "orthogonal" | undefined) ?? "orthogonal";
  const dir = routing === "orthogonal"
    ? (() => {
        const n = unitFromPosition(targetPosition); // kifelé
        return { ux: -n.ux, uy: -n.uy };            // befelé (node felé)
      })()
    : unitFromDelta(tx_tip - sx, ty_tip - sy);

  // A VONAL a nyíl ALAPJÁIG tart
  const baseX = tx_tip - dir.ux * ARROW_SIZE;
  const baseY = ty_tip - dir.uy * ARROW_SIZE;

  // A nyíl háromszög két alap-sarka (merőleges az irányra)
  const perpX = -dir.uy;
  const perpY = dir.ux;
  const p1x = baseX + perpX * ARROW_HALF;
  const p1y = baseY + perpY * ARROW_HALF;
  const p2x = baseX - perpX * ARROW_HALF;
  const p2y = baseY - perpY * ARROW_HALF;

  // Path számítás – a target MOST (baseX, baseY)
  let path = "";
  let labelX = (sx + baseX) / 2;
  let labelY = (sy + baseY) / 2;

  if (routing === "bezier") {
    const [d, lx, ly] = getBezierPath({
      sourceX: sx, sourceY: sy, targetX: baseX, targetY: baseY,
      sourcePosition, targetPosition,
    });
    path = d; labelX = lx; labelY = ly;
  } else if (routing === "straight") {
    path = `M ${sx},${sy} L ${baseX},${baseY}`;
  } else {
    const [d, lx, ly] = getSmoothStepPath({
      sourceX: sx, sourceY: sy, targetX: baseX, targetY: baseY,
      sourcePosition, targetPosition, borderRadius: 8,
    });
    path = d; labelX = lx; labelY = ly;
  }

  // Alap szín: fehér (sötét háttérhez); felülírható az edge.style.stroke-kal
  const stroke = (style as any)?.stroke ?? "#fff";

  return (
    <>
      {/* a vonal MOST a nyíl ALAPJÁIG tart */}
      <BaseEdge
        id={id}
        path={path}
        style={{ strokeWidth: 2, stroke, ...style }}
        interactionWidth={interactionWidth ?? 20}
      />

      {/* nyílhegy – a csúcs (tx_tip, ty_tip), az alap közepe (baseX, baseY) */}
      <path d={`M ${tx_tip} ${ty_tip} L ${p1x} ${p1y} L ${p2x} ${p2y} Z`} fill={stroke} />

      {/* címke az útvonal közepén */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              color: "#111",
              fontSize: 12,
              fontFamily: "Inter, Roboto, system-ui, sans-serif",
              ...(labelStyle as React.CSSProperties),
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.95)",
                padding: normalizePadding(labelBgPadding) ?? "2px 6px", // 👈 normalizált
                borderRadius: labelBgBorderRadius ?? 4,
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                border: "1px solid rgba(0,0,0,0.08)",
                ...(labelBgStyle as React.CSSProperties),
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
