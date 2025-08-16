import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import type { EdgeTemplate } from "./types";

export default function EdgeTemplateDialog({
  open,
  onClose,
  edgeTemplates,
  onSelect,
  currentId,
}: {
  open: boolean;
  onClose: () => void;
  edgeTemplates: EdgeTemplate[];
  onSelect: (tpl: EdgeTemplate | null) => void;
  currentId?: string | null;
}) {
  const [sel, setSel] = React.useState<string | null>(currentId ?? null);
  React.useEffect(() => { if (open) setSel(currentId ?? null); }, [open, currentId]);

  const handleConfirm = () => {
    const tpl = edgeTemplates.find((t) => t.id === sel);
    onSelect(tpl ?? null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Choose edge template</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          <Typography variant="body2">Select the edge type used for new connections.</Typography>
          <List dense>
            <ListItemButton selected={sel === null} onClick={() => setSel(null)}>
              <ListItemText primary="Default (no editor)" />
            </ListItemButton>
            {edgeTemplates.map((t) => (
              <ListItemButton key={t.id} selected={sel === t.id} onClick={() => setSel(t.id)}>
                <ListItemText primary={t.label} secondary={t.id} />
              </ListItemButton>
            ))}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>Use</Button>
      </DialogActions>
    </Dialog>
  );
}
