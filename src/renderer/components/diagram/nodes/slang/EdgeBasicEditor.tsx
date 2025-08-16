import * as React from "react";
import { Stack, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import type { EdgeTemplateEditorProps } from "../../types";

export default function EdgeBasicEditor(rawProps?: EdgeTemplateEditorProps) {
  const props = rawProps ?? { value: {}, onChange: () => {} };
  const value = (props.value ?? {}) as { color?: string; label?: string; routing?: "straight"|"bezier"|"orthogonal" };
  const onChange = props.onChange ?? (() => {});
  const patch = (p: Partial<typeof value>) => onChange({ ...value, ...p });

  return (
    <Stack spacing={1.25} sx={{ mt: 1 }}>
      <FormControl size="small">
        <InputLabel id="edge-routing-label">Routing</InputLabel>
        <Select
          labelId="edge-routing-label"
          label="Routing"
          value={value.routing ?? "orthogonal"}
          onChange={(e) => patch({ routing: e.target.value as any })}
        >
          <MenuItem value="orthogonal">Orthogonal</MenuItem>
          <MenuItem value="straight">Straight</MenuItem>
          <MenuItem value="bezier">Bezier</MenuItem>
        </Select>
      </FormControl>
      <TextField
        size="small"
        label="Color (CSS)"
        value={value.color ?? ""}
        onChange={(e) => patch({ color: e.target.value })}
      />
      <TextField
        size="small"
        label="Label"
        value={value.label ?? ""}
        onChange={(e) => patch({ label: e.target.value })}
      />
    </Stack>
  );
}
