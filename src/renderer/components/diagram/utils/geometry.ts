import { Position } from "reactflow";

export function outwardDelta(pos: Position, amount: number): { dx: number; dy: number } {
  switch (pos) {
    case Position.Left: return { dx: -amount, dy: 0 };
    case Position.Right: return { dx: amount, dy: 0 };
    case Position.Top: return { dx: 0, dy: -amount };
    case Position.Bottom: return { dx: 0, dy: amount };
    default: return { dx: 0, dy: 0 };
  }
}

export function unitFromDelta(dx: number, dy: number): { ux: number; uy: number } {
  const len = Math.hypot(dx, dy) || 1;
  return { ux: dx / len, uy: dy / len };
}

export function unitFromPosition(pos: Position): { ux: number; uy: number } {
  switch (pos) {
    case Position.Left: return { ux: -1, uy: 0 };
    case Position.Right: return { ux: 1, uy: 0 };
    case Position.Top: return { ux: 0, uy: -1 };
    case Position.Bottom: return { ux: 0, uy: 1 };
    default: return { ux: 1, uy: 0 };
  }
}

/** RF labelBgPadding -> CSS padding normalizer */
export function normalizePadding(
  p: any // EdgeProps["labelBgPadding"] would cause a cyclic import; runtime-safe normalization
): string | number | undefined {
  if (p == null) return undefined;
  if (typeof p === "number" || typeof p === "string") return p;
  if (Array.isArray(p)) {
    const [v, h] = p as [number | string, number | string];
    const vStr = typeof v === "number" ? `${v}px` : String(v);
    const hStr = typeof h === "number" ? `${h}px` : String(h);
    return `${vStr} ${hStr}`;
  }
  return undefined;
}
