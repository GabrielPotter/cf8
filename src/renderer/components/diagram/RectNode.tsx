import React, { useMemo, useEffect } from "react";
import { Handle, NodeProps, Position, useUpdateNodeInternals } from "reactflow";
import { Box, Tooltip, Typography, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import FunctionsIcon from "@mui/icons-material/Functions";
import StorageIcon from "@mui/icons-material/Storage";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import TuneIcon from "@mui/icons-material/Tune";
import type { Direction, PortDTO, RectNodeData } from "./types";
import { PORT_SIZE } from "./constants";

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

const Separator = styled("div")(({ theme }) => ({
  height: 1,
  background: theme.palette.divider,
}));

const PortsLayer = styled("div")({ position: "absolute", inset: 0, pointerEvents: "none" });

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

function portButtonStyle(side: Direction, idx: number, countOnSide: number, width: number, height: number) {
  const gapX = width / (countOnSide + 1);
  const gapY = height / (countOnSide + 1);
  switch (side) {
    case "top": return { left: gapX * (idx + 1) - PORT_SIZE / 2, top: -PORT_SIZE / 2 };
    case "bottom": return { left: gapX * (idx + 1) - PORT_SIZE / 2, top: height - PORT_SIZE / 2 };
    case "left": return { top: gapY * (idx + 1) - PORT_SIZE / 2, left: -PORT_SIZE / 2 };
    case "right": return { top: gapY * (idx + 1) - PORT_SIZE / 2, left: width - PORT_SIZE / 2 };
  }
}

function handleStyle(side: Direction, idx: number, countOnSide: number, width: number, height: number) {
  const gapX = width / (countOnSide + 1);
  const gapY = height / (countOnSide + 1);
  switch (side) {
    case "top": return { left: gapX * (idx + 1), top: 0 };
    case "bottom": return { left: gapX * (idx + 1), top: height };
    case "left": return { left: 0, top: gapY * (idx + 1) };
    case "right": return { left: width, top: gapY * (idx + 1) };
  }
}

function IconByKind({ kind }: { kind?: RectNodeData["iconKind"] }) {
  switch (kind) {
    case "db": return <StorageIcon fontSize="small" />;
    case "gear": return <BuildCircleIcon fontSize="small" />;
    case "cloud": return <CloudQueueIcon fontSize="small" />;
    case "sum":
    default: return <FunctionsIcon fontSize="small" />;
  }
}

function RectNode(props: NodeProps<RectNodeData>) {
  const { id, data, selected } = props;
  const { title, width, height, ports, activeSource, bgTop, bgMiddle, bgBottom, iconKind } = data;

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    const r = requestAnimationFrame(() => updateNodeInternals(id));
    return () => cancelAnimationFrame(r);
  }, [updateNodeInternals, id, ports, width, height]);

  const grouped = useMemo(() => {
    const g: Record<Direction, PortDTO[]> = { top: [], right: [], bottom: [], left: [] };
    for (const p of ports) g[p.side].push(p);
    (Object.keys(g) as Direction[]).forEach((s) => g[s].sort((a, b) => a.index - b.index));
    return g;
  }, [ports]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const isActivePort = (portId: string) => activeSource?.nodeId === id && activeSource?.portId === portId;

  const headerH = 28;
  const footerH = 24;

  return (
    <Container
      sx={{ width, height, outline: selected ? (theme) => `2px solid ${theme.palette.primary.main}` : "none" }}
      onContextMenu={(e) => { e.preventDefault(); data.onNodeContextMenu?.(e, id); }}
    >
      <Box
        sx={(theme) => ({
          height: headerH,
          px: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          background: bgTop ?? theme.palette.action.hover,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          position: "relative",
        })}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconByKind kind={iconKind} />
          <Tooltip title="Open editor">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); data.onOpenEditor?.(id); }}
              sx={{ p: 0.25 }}
            >
              <TuneIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="caption" sx={{ ml: 1, flex: 1, textAlign: "right" }} noWrap title={title ?? "Rect"}>
          {title ?? "Rect"}
        </Typography>
      </Box>

      <Separator />

      <Box sx={(theme) => ({ flex: 1, minHeight: 24, background: bgMiddle ?? theme.palette.background.default })} />

      <Separator />

      <Box
        sx={(theme) => ({
          height: footerH,
          px: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          background: bgBottom ?? theme.palette.background.paper,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        })}
      />

      {(["top", "right", "bottom", "left"] as Direction[]).flatMap((side) => {
        const arr = grouped[side];
        const pos = sideToRFPosition(side);
        return arr.map((p, i) => {
          const { left, top } = handleStyle(side, i, arr.length, width, height);
          const hs: React.CSSProperties = { position: "absolute", left, top, width: 1, height: 1, opacity: 0, pointerEvents: "none", zIndex: 1 };
          return (
            <React.Fragment key={`handles-${p.id}`}>
              <Handle id={p.id} type="source" position={pos} style={hs} />
              <Handle id={p.id} type="target" position={pos} style={hs} />
            </React.Fragment>
          );
        });
      })}

      <PortsLayer>
        {(["top", "right", "bottom", "left"] as Direction[]).flatMap((side) => {
          const arr = grouped[side];
          return arr.map((p, i) => {
            const style = portButtonStyle(side, i, arr.length, width, height);
            return (
              <Tooltip key={p.id} title={p.label ?? p.id} enterDelay={300}>
                <PortButton
                  style={style}
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
                  onClick={(e) => { e.stopPropagation(); data.onPortClick?.(id, p); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); data.onPortContextMenu?.(e, id, p); }}
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

export default React.memo(RectNode);
