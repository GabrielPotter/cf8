import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Card, CardActionArea, CardContent, Typography, Box, useTheme, Divider
} from "@mui/material";
import FunctionsIcon from "@mui/icons-material/Functions";
import StorageIcon from "@mui/icons-material/Storage";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import type { NodeTemplate, NodeTemplateEditorProps } from "./types";
import type { TemplateEditorsMap } from "./palettes";

function TemplateIcon({ kind }: { kind: "sum" | "db" | "gear" | "cloud" }) {
  switch (kind) {
    case "sum": return <FunctionsIcon />;
    case "db": return <StorageIcon />;
    case "gear": return <BuildCircleIcon />;
    case "cloud": return <CloudQueueIcon />;
    default: return <FunctionsIcon />;
  }
}

export type NodeTemplateDialogProps = {
  open: boolean;
  templates: NodeTemplate[];
  editors?: TemplateEditorsMap; // optional, templateId -> Editor
  onClose: () => void;
  onCreate: (args: { name: string; template: NodeTemplate; extraData?: Record<string, unknown> }) => void;
};

export default function NodeTemplateDialog({ open, onClose, onCreate, templates, editors }: NodeTemplateDialogProps) {
  const theme = useTheme();
  const [name, setName] = React.useState<string>("");
  const [tpl, setTpl] = React.useState<NodeTemplate | null>(null);
  const [extraData, setExtraData] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => {
    if (open) {
      setName("");
      setTpl(null);
      setExtraData({});
    }
  }, [open]);

  const handlePick = (t: NodeTemplate) => {
    setTpl(t);
    setExtraData({ ...(t.extraDefault ?? {}) }); // base extra is the editor's starting point
  };

  const handleCreate = () => {
    if (!tpl) return;
    const finalName = name.trim() || tpl.label;
    onCreate({ name: finalName, template: tpl, extraData });
  };

  const EditorComp: React.ComponentType<NodeTemplateEditorProps> | undefined =
    tpl && editors ? (editors[tpl.id] as any) : undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Új node létrehozása</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Node neve"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="pl. Processor A"
          />
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Válassz sablont:
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {templates.map((t) => {
            const selected = tpl?.id === t.id;
            return (
              <Grid key={t.id} item xs={12} sm={6} md={4}>
                <Card
                  variant={selected ? "elevation" : "outlined"}
                  sx={{
                    borderColor: selected ? theme.palette.primary.main : undefined,
                    boxShadow: selected ? theme.shadows[3] : undefined,
                  }}
                >
                  <CardActionArea onClick={() => handlePick(t)}>
                    <CardContent sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <TemplateIcon kind={t.iconKind ?? "sum"} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>{t.label}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {t.width}×{t.height}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {EditorComp && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {tpl?.label} beállítások
            </Typography>
            <EditorComp
              value={extraData}
              onChange={(next) => setExtraData(next)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Mégse</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!tpl}>
          Létrehozás
        </Button>
      </DialogActions>
    </Dialog>
  );
}
