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

type PathParams = Parameters<typeof getSmoothStepPath>[0];
type PathResult = ReturnType<typeof getStraightPath>;

/** Route selector */
function pathFor(type: string, params: PathParams): PathResult {
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

/** Arrow sizing (half the previous size) */
const ARROW_W = 6;
const ARROW_H = 6;
const REF_Y = ARROW_H / 2;     // 3
const REF_X = ARROW_W  + 3.0;   // 5.5 - pull the line slightly into the arrow

/**
 * Custom edge component with arrowhead + (optional) label + edit icon
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

  // Line color: data.color -> style.stroke -> fallback
  const stroke = d.color || (style as any)?.stroke || "#888";

  // Only render label container if there is text or an editor icon
  const showLabel = Boolean((d.label && `${d.label}`.trim().length > 0) || d.templateId);

  // Unique marker ID per edge
  const markerId = `edge-arrow-${id}`;

  return (
    <>
      {/* Marker definition in the same SVG as BaseEdge */}
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
          {/* Half-size arrow: 0,0 -> 6,3 -> 0,6 */}
          <path d={`M0,0 L${ARROW_W},${REF_Y} L0,${ARROW_H} Z`} fill={stroke} />
        </marker>
      </defs>

      {/* Line + arrowhead */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ ...(style ?? {}), stroke, strokeWidth: 2 }}
        markerEnd={`url(#${markerId})`}
      />

      {/* Label + editor icon (if needed) */}
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
