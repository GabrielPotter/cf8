import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Typography } from "@mui/material";
import type { NodeTemplateEditorProps } from "./types";
import type { TemplateEditorsMap } from "./palettes";

export type NodeDataEditorDialogProps = {
  open: boolean;
  title?: string;
  /** full editors map (templateId -> editor) */
  editors?: TemplateEditorsMap;
  /** which template editor to render */
  templateId?: string;
  value?: Record<string, unknown>;
  onClose: () => void;
  onSave: (next: Record<string, unknown>) => void;
};

export default function NodeDataEditorDialog({
  open,
  onClose,
  onSave,
  title,
  editors,
  templateId,
  value,
}: NodeDataEditorDialogProps) {
  const initial = (value ?? {}) as Record<string, unknown>;
  const [local, setLocal] = React.useState<Record<string, unknown>>(initial);

  React.useEffect(() => {
    if (open) setLocal((value ?? {}) as Record<string, unknown>);
  }, [open, value]);

  const EditorComp: React.ComponentType<NodeTemplateEditorProps> | undefined =
    templateId && editors ? (editors as any)[templateId] : undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title ?? "Node editor"}</DialogTitle>
      <DialogContent dividers>
        {EditorComp ? (
          <EditorComp value={local} onChange={setLocal} />
        ) : (
          <>
            <Typography variant="body2">No editor available for this node type.</Typography>
            <Divider sx={{ my: 1.5 }} />
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(local, null, 2)}</pre>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(local)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
