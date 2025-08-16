import * as React from "react";
import {
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  EdgeLabelRenderer,
  BaseEdge,
  EdgeProps,
} from "reactflow";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import { IconButton, Tooltip } from "@mui/material";
import type { PortEdgeData } from "./types";

/** Vonalvezetés választó */
function pathFor(type: string, params: any): [string, number, number] {
  switch (type) {
    case "straight":
      return getStraightPath(params);
    case "bezier":
      return getBezierPath(params);
    case "orthogonal":
    default:
      return getSmoothStepPath({ ...params, borderRadius: 8 });
  }
}

/** Nyíl méretezés (fele akkora, mint korábban) */
const ARROW_W = 6;
const ARROW_H = 6;
const REF_Y = ARROW_H / 2;     // 3
const REF_X = ARROW_W  + 3.0;   // 5.5 – egy picit „ráhúzzuk” a vonalat

/**
 * Egyedi élkomponens nyílheggyel + (opcionális) címke + szerkesztés ikon
 */
export default function PortEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
}: EdgeProps<PortEdgeData>) {
  const d = data ?? { routing: "orthogonal" };

  const [edgePath, labelX, labelY] = pathFor(d.routing ?? "orthogonal", {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // vonal színe: data.color -> style.stroke -> fallback
  const stroke = d.color || (style as any)?.stroke || "#888";

  // csak akkor legyen label konténer, ha van szöveg vagy van editor ikon
  const showLabel = Boolean((d.label && `${d.label}`.trim().length > 0) || d.templateId);

  // egyedi marker ID minden élhez
  const markerId = `edge-arrow-${id}`;

  return (
    <>
      {/* Marker definíció ugyanabban az SVG-ben, ahol a BaseEdge is van */}
      <defs>
        <marker
          id={markerId}
          markerWidth={ARROW_W}
          markerHeight={ARROW_H}
          refX={REF_X}
          refY={REF_Y}
          orient="auto"
          markerUnits="strokeWidth"
        >
          {/* Félméretű nyíl: 0,0 → 6,3 → 0,6 */}
          <path d={`M0,0 L${ARROW_W},${REF_Y} L0,${ARROW_H} Z`} fill={stroke} />
        </marker>
      </defs>

      {/* Vonal + nyílhegy */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ ...(style ?? {}), stroke, strokeWidth: 2 }}
        markerEnd={`url(#${markerId})`}
      />

      {/* Címke + szerkesztő ikon (ha kell) */}
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
              pointerEvents: "all",
              userSelect: "none",
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              d.onEdgeContextMenu?.(e as any, id);
            }}
          >
            {d.label ? <span title={d.label}>{d.label}</span> : null}
            {d.templateId ? (
              <Tooltip title="Edit edge">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    d.onOpenEditor?.(id);
                  }}
                  sx={{ p: 0, ml: d.label ? 0.5 : 0 }}
                >
                  <SettingsSuggestIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            ) : null}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
