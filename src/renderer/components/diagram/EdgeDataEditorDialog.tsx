import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Typography } from "@mui/material";
import type { EdgeTemplateEditorProps } from "./types";
import type { TemplateEditorsMap } from "./palettes";

export type EdgeDataEditorDialogProps = {
  open: boolean;
  title?: string;
  editors?: TemplateEditorsMap;     // templateId -> editor komponens
  templateId?: string;
  value?: Record<string, unknown>;
  onClose: () => void;
  onSave: (next: Record<string, unknown>) => void;
};

export default function EdgeDataEditorDialog({
  open, onClose, onSave, title, editors, templateId, value
}: EdgeDataEditorDialogProps) {
  const initial = (value ?? {}) as Record<string, unknown>;
  const [local, setLocal] = React.useState<Record<string, unknown>>(initial);
  React.useEffect(() => { if (open) setLocal((value ?? {}) as Record<string, unknown>); }, [open, value]);

  const EditorComp = (templateId && editors ? (editors as any)[templateId] : undefined) as
    | React.ComponentType<EdgeTemplateEditorProps>
    | undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title ?? "Edge editor"}</DialogTitle>
      <DialogContent dividers>
        {EditorComp ? (
          <EditorComp value={local} onChange={setLocal} />
        ) : (
          <>
            <Typography variant="body2">No editor available for this edge type.</Typography>
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
