import React from "react";
import { Menu, MenuItem, ListItemText, PopoverProps } from "@mui/material";
import type { PortDTO } from "./types";

type AnchorEl = PopoverProps["anchorEl"];

export function NodeContextMenu(props: {
  anchorEl: AnchorEl;
  open: boolean;
  onClose: () => void;
  nodeId?: string;
  onDeleteNode?: (nodeId: string) => void;
  onAddPort?: (nodeId: string, side: "top" | "right" | "bottom" | "left") => void;
}) {
  const { anchorEl, open, onClose, nodeId, onDeleteNode, onAddPort } = props;
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem
        disabled={!nodeId}
        onClick={() => {
          if (nodeId) onDeleteNode?.(nodeId);
          onClose();
        }}
      >
        <ListItemText>Delete node</ListItemText>
      </MenuItem>
      <MenuItem
        disabled={!nodeId}
        onClick={() => {
          if (nodeId) onAddPort?.(nodeId, "top");
          onClose();
        }}
      >
        <ListItemText>Add port (top)</ListItemText>
      </MenuItem>
      <MenuItem
        disabled={!nodeId}
        onClick={() => {
          if (nodeId) onAddPort?.(nodeId, "right");
          onClose();
        }}
      >
        <ListItemText>Add port (right)</ListItemText>
      </MenuItem>
      <MenuItem
        disabled={!nodeId}
        onClick={() => {
          if (nodeId) onAddPort?.(nodeId, "bottom");
          onClose();
        }}
      >
        <ListItemText>Add port (bottom)</ListItemText>
      </MenuItem>
      <MenuItem
        disabled={!nodeId}
        onClick={() => {
          if (nodeId) onAddPort?.(nodeId, "left");
          onClose();
        }}
      >
        <ListItemText>Add port (left)</ListItemText>
      </MenuItem>
    </Menu>
  );
}

export function PortContextMenu(props: {
  anchorEl: AnchorEl;
  open: boolean;
  onClose: () => void;
  nodeId?: string;
  port?: PortDTO;
  onRemovePort?: (nodeId: string, portId: string) => void;
}) {
  const { anchorEl, open, onClose, nodeId, port, onRemovePort } = props;
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem
        disabled={!nodeId || !port}
        onClick={() => {
          if (nodeId && port) onRemovePort?.(nodeId, port.id);
          onClose();
        }}
      >
        <ListItemText>Remove port</ListItemText>
      </MenuItem>
    </Menu>
  );
}

export function EdgeContextMenu(props: {
  anchorEl: AnchorEl;
  open: boolean;
  onClose: () => void;
  edgeId?: string;
  onDeleteEdge?: (edgeId: string) => void;
  onSetRouting?: (edgeId: string, routing: "straight" | "bezier" | "orthogonal") => void;
}) {
  const { anchorEl, open, onClose, edgeId, onDeleteEdge, onSetRouting } = props;
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem
        disabled={!edgeId}
        onClick={() => {
          if (edgeId) onDeleteEdge?.(edgeId);
          onClose();
        }}
      >
        <ListItemText>Delete edge</ListItemText>
      </MenuItem>
      <MenuItem
        disabled={!edgeId}
        onClick={() => {
          if (edgeId) onSetRouting?.(edgeId, "straight");
          onClose();
        }}
      >
        <ListItemText>Routing: straight</ListItemText>
      </MenuItem>
      <MenuItem
        disabled={!edgeId}
        onClick={() => {
          if (edgeId) onSetRouting?.(edgeId, "bezier");
          onClose();
        }}
      >
        <ListItemText>Routing: bezier</ListItemText>
      </MenuItem>
      <MenuItem
        disabled={!edgeId}
        onClick={() => {
          if (edgeId) onSetRouting?.(edgeId, "orthogonal");
          onClose();
        }}
      >
        <ListItemText>Routing: orthogonal</ListItemText>
      </MenuItem>
    </Menu>
  );
}
