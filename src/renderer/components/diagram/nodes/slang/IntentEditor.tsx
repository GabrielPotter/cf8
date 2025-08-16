import * as React from "react";
import { Stack, TextField, Divider, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import type { NodeTemplateEditorProps } from "../../types";

export default function IntentEditor(rawProps?: NodeTemplateEditorProps) {
  const props = rawProps ?? { value: {}, onChange: () => {} };
  const value = (props.value ?? {}) as {
    intentName?: string;
    trainingPhrases?: string[];
    confidenceThreshold?: number;
    locale?: string;
  };
  const onChange = props.onChange ?? (() => {});
  const patch = (p: Partial<typeof value>) => onChange({ ...value, ...p });

  const [inp, setInp] = React.useState("");
  const phrases = value.trainingPhrases ?? [];

  return (
    <Stack spacing={1.25} sx={{ mt: 1 }}>
      <TextField
        label="Intent name"
        size="small"
        value={value.intentName ?? ""}
        onChange={(e) => patch({ intentName: e.target.value })}
      />
      <FormControl size="small">
        <InputLabel id="slang-intent-locale-label">Locale</InputLabel>
        <Select
          labelId="slang-intent-locale-label"
          label="Locale"
          value={value.locale ?? "en"}
          onChange={(e) => patch({ locale: e.target.value as string })}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="de">Deutsch</MenuItem>
          <MenuItem value="hu">Magyar</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Confidence threshold"
        type="number"
        size="small"
        inputProps={{ step: 0.05, min: 0, max: 1 }}
        value={value.confidenceThreshold ?? 0.6}
        onChange={(e) => patch({ confidenceThreshold: Number(e.target.value) })}
      />
      <Divider flexItem sx={{ my: 0.5 }} />
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          label="Add training phrase"
          value={inp}
          onChange={(e) => setInp(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inp.trim()) {
              patch({ trainingPhrases: [...phrases, inp.trim()] });
              setInp("");
            }
          }}
        />
        <TextField
          size="small"
          label="Count"
          value={phrases.length}
          inputProps={{ readOnly: true }}
          sx={{ width: 90 }}
        />
      </Stack>
    </Stack>
  );
}
