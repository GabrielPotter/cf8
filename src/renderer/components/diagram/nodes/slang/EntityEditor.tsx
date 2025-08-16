import * as React from "react";
import { Stack, TextField, Divider, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import type { NodeTemplateEditorProps } from "../../types";

export default function EntityEditor(rawProps?: NodeTemplateEditorProps) {
  const props = rawProps ?? { value: {}, onChange: () => {} };
  const value = (props.value ?? {}) as { entityName?: string; patterns?: string[]; strategy?: string };
  const onChange = props.onChange ?? (() => {});
  const patch = (p: Partial<typeof value>) => onChange({ ...value, ...p });

  const [inp, setInp] = React.useState("");
  const patterns = value.patterns ?? [];

  return (
    <Stack spacing={1.25} sx={{ mt: 1 }}>
      <TextField
        label="Entity name"
        size="small"
        value={value.entityName ?? ""}
        onChange={(e) => patch({ entityName: e.target.value })}
      />
      <FormControl size="small">
        <InputLabel id="slang-entity-strategy-label">Strategy</InputLabel>
        <Select
          labelId="slang-entity-strategy-label"
          label="Strategy"
          value={value.strategy ?? "regex"}
          onChange={(e) => patch({ strategy: e.target.value as string })}
        >
          <MenuItem value="regex">RegExp</MenuItem>
          <MenuItem value="lookup">Lookup</MenuItem>
          <MenuItem value="llm">LLM</MenuItem>
        </Select>
      </FormControl>
      <Divider flexItem sx={{ my: 0.5 }} />
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          label="Add pattern (e.g. \\b(yes|ja)\\b)"
          value={inp}
          onChange={(e) => setInp(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inp.trim()) {
              patch({ patterns: [...patterns, inp.trim()] });
              setInp("");
            }
          }}
        />
        <TextField
          size="small"
          label="Count"
          value={patterns.length}
          inputProps={{ readOnly: true }}
          sx={{ width: 90 }}
        />
      </Stack>
    </Stack>
  );
}
