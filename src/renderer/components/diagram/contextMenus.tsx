import * as React from "react";
import { Menu, MenuItem, ListItemText, Divider } from "@mui/material";
import type { Direction, PortDTO, PortEdgeRouting } from "./types";

type AnchorEl = HTMLElement | null;

export function NodeContextMenu(props: {
  anchorEl: AnchorEl;
  open: boolean;
  nodeId?: string;
  onClose: () => void;
  onDeleteNode: (nodeId: string) => void;
  onAddPort: (nodeId: string, side: Direction) => void;
}) {
  const { anchorEl, open, nodeId, onClose, onDeleteNode, onAddPort } = props;
  return (
    <Menu open={open} anchorEl={anchorEl} onClose={onClose}>
      <MenuItem disabled={!nodeId} onClick={() => nodeId && onDeleteNode(nodeId)}>
        <ListItemText>Delete node</ListItemText>
      </MenuItem>
      <Divider />
      {(["top", "right", "bottom", "left"] as Direction[]).map((s) => (
        <MenuItem key={s} disabled={!nodeId} onClick={() => nodeId && onAddPort(nodeId, s)}>
          <ListItemText>Add port: {s}</ListItemText>
        </MenuItem>
      ))}
    </Menu>
  );
}

export function PortContextMenu(props: {
  anchorEl: AnchorEl;
  open: boolean;
  nodeId?: string;
  port?: PortDTO;
  onClose: () => void;
  onRemovePort: (nodeId: string, portId: string) => void;
}) {
  const { anchorEl, open, nodeId, port, onClose, onRemovePort } = props;
  return (
    <Menu open={open} anchorEl={anchorEl} onClose={onClose}>
      <MenuItem disabled={!nodeId || !port} onClick={() => nodeId && port && onRemovePort(nodeId, port.id)}>
        <ListItemText>Remove port</ListItemText>
      </MenuItem>
    </Menu>
  );
}

export function EdgeContextMenu(props: {
  anchorEl: AnchorEl;
  open: boolean;
  edgeId?: string;
  onClose: () => void;
  onDeleteEdge: (edgeId: string) => void;
  onSetRouting: (edgeId: string, routing: PortEdgeRouting) => void;
  onOpenEditor: (edgeId: string) => void;
}) {
  const { anchorEl, open, edgeId, onClose, onDeleteEdge, onSetRouting, onOpenEditor } = props;
  return (
    <Menu open={open} anchorEl={anchorEl} onClose={onClose}>
      <MenuItem disabled={!edgeId} onClick={() => edgeId && onOpenEditor(edgeId)}>
        <ListItemText>Edit edge…</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem disabled={!edgeId} onClick={() => edgeId && onSetRouting(edgeId, "orthogonal")}>
        <ListItemText>Routing: orthogonal</ListItemText>
      </MenuItem>
      <MenuItem disabled={!edgeId} onClick={() => edgeId && onSetRouting(edgeId, "straight")}>
        <ListItemText>Routing: straight</ListItemText>
      </MenuItem>
      <MenuItem disabled={!edgeId} onClick={() => edgeId && onSetRouting(edgeId, "bezier")}>
        <ListItemText>Routing: bezier</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem disabled={!edgeId} onClick={() => edgeId && onDeleteEdge(edgeId)}>
        <ListItemText>Delete edge</ListItemText>
      </MenuItem>
    </Menu>
  );
}
