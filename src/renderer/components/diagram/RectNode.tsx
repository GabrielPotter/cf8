import React, { useMemo } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { Box, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Direction, PortDTO, RectNodeData } from "./types";

const Container = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  display: "flex",
  flexDirection: "column",
  position: "relative",
  overflow: "visible",
}));

const TitleBar = styled(Box)(({ theme }) => ({
  padding: "4px 8px",
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 12,
  color: theme.palette.text.secondary,
}));

const PortsLayer = styled("div")({
  position: "absolute",
  inset: 0,
  pointerEvents: "none", // a gombokra visszaengedjük
});

const PORT_SIZE = 14; // px
const HALF = PORT_SIZE / 2;

const PortButton = styled("button")<{ active?: boolean }>(({ theme, active }) => ({
  pointerEvents: "auto",
  position: "absolute",
  zIndex: 2,
  width: PORT_SIZE,
  height: PORT_SIZE,
  borderRadius: "50%",
  border: `1px solid ${theme.palette.divider}`,
  background: active ? theme.palette.primary.light : theme.palette.background.default,
  outline: active ? `2px solid ${theme.palette.primary.main}` : "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  userSelect: "none",
  WebkitUserDrag: "none",
  transition: "background 120ms, outline 120ms",
  "&:hover": {
    background: active ? theme.palette.primary.light : theme.palette.action.hover,
    outline: `2px solid ${theme.palette.primary.main}`,
  },
}));

function sideToRFPosition(side: Direction): Position {
  switch (side) {
    case "top": return Position.Top;
    case "right": return Position.Right;
    case "bottom": return Position.Bottom;
    case "left": return Position.Left;
  }
}

/** A PORT GOMB bal-felső sarka (a kör fele kilóg, a közepe a határvonalon ül) */
function portButtonStyle(
  side: Direction,
  idx: number,
  countOnSide: number,
  width: number,
  height: number
) {
  const gapX = width / (countOnSide + 1);
  const gapY = height / (countOnSide + 1);

  switch (side) {
    case "top":    return { left: gapX * (idx + 1) - HALF, top: -HALF };
    case "bottom": return { left: gapX * (idx + 1) - HALF, top: height - HALF };
    case "left":   return { top: gapY * (idx + 1) - HALF, left: -HALF };
    case "right":  return { top: gapY * (idx + 1) - HALF, left: width - HALF };
  }
}

/**
 * HANDLE POZÍCIÓ (1×1 px, a node határvonalán):
 *  - top/bottom: x = gapX*(i+1), y = 0 | height
 *  - left/right: y = gapY*(i+1), x = 0 | width
 * Ez garantálja, hogy az él a határvonalra (és így a kör közepére) fut.
 */
function handleStyle(
  side: Direction,
  idx: number,
  countOnSide: number,
  width: number,
  height: number
) {
  const gapX = width / (countOnSide + 1);
  const gapY = height / (countOnSide + 1);

  switch (side) {
    case "top":
      return { left: gapX * (idx + 1), top: 0 };
    case "bottom":
      return { left: gapX * (idx + 1), top: height };
    case "left":
      return { left: 0, top: gapY * (idx + 1) };
    case "right":
      return { left: width, top: gapY * (idx + 1) };
  }
}

export default function RectNode(props: NodeProps<RectNodeData>) {
  const { id, data, selected } = props;
  const { title, width, height, ports, activeSource } = data;

  const grouped = useMemo(() => {
    const g: Record<Direction, PortDTO[]> = { top: [], right: [], bottom: [], left: [] };
    for (const p of ports) g[p.side].push(p);
    (Object.keys(g) as Direction[]).forEach((s) => g[s].sort((a, b) => a.index - b.index));
    return g;
  }, [ports]);

  const stop = (e: React.SyntheticEvent) => {
    // Ne induljon node select/drag. Nem hívunk preventDefault-ot, hogy a click létrejöjjön.
    e.stopPropagation();
  };

  const isActivePort = (portId: string) =>
    activeSource?.nodeId === id && activeSource?.portId === portId;

  return (
    <Container
      sx={{
        width,
        height,
        outline: selected ? (theme) => `2px solid ${theme.palette.primary.main}` : "none",
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        data.onNodeContextMenu?.(e, id);
      }}
    >
      <TitleBar>
        <Typography variant="caption" noWrap>
          {title ?? "Rect"}
        </Typography>
      </TitleBar>

      {/* HANDLE-EK: a node HATÁRVONALÁN ülnek, 1×1 px-esek, láthatatlanok */}
      {(["top", "right", "bottom", "left"] as Direction[]).flatMap((side) => {
        const arr = grouped[side];
        const pos = sideToRFPosition(side);
        return arr.map((p, i) => {
          const { left, top } = handleStyle(side, i, arr.length, width, height);
          const hs: React.CSSProperties = {
            position: "absolute",
            left,
            top,
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
            zIndex: 1, // a gomb alatt
          };
          return (
            <React.Fragment key={`handles-${p.id}`}>
              <Handle id={p.id} type="source" position={pos} style={hs} />
              <Handle id={p.id} type="target" position={pos} style={hs} />
            </React.Fragment>
          );
        });
      })}

      {/* Vizuális port gombok (féloldalasan kilógva, de a közepe a határvonalon van) */}
      <PortsLayer>
        {(["top", "right", "bottom", "left"] as Direction[]).flatMap((side) => {
          const arr = grouped[side];
          return arr.map((p, i) => {
            const btnStyle = portButtonStyle(side, i, arr.length, width, height);
            return (
              <Tooltip key={p.id} title={p.label ?? p.id} enterDelay={300}>
                <PortButton
                  style={btnStyle}
                  active={isActivePort(p.id)}
                  onPointerDown={stop}
                  onPointerUp={stop}
                  onMouseDown={stop}
                  onMouseUp={stop}
                  onTouchStart={stop}
                  onTouchEnd={stop}
                  onDoubleClick={stop}
                  draggable={false}
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onPortClick?.(id, p);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    data.onPortContextMenu?.(e, id, p);
                  }}
                  aria-label={`port-${p.id}`}
                  data-nodeid={id}
                  data-portid={p.id}
                  data-side={side}
                />
              </Tooltip>
            );
          });
        })}
      </PortsLayer>
    </Container>
  );
}
