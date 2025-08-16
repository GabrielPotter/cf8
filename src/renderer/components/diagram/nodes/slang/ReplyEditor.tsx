import * as React from "react";
import { Stack, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import type { NodeTemplateEditorProps } from "../../types";

export default function ReplyEditor(rawProps?: NodeTemplateEditorProps) {
  const props = rawProps ?? { value: {}, onChange: () => {} };
  const value = (props.value ?? {}) as { text?: string; tone?: string; language?: string };
  const onChange = props.onChange ?? (() => {});
  const patch = (p: Partial<typeof value>) => onChange({ ...value, ...p });

  return (
    <Stack spacing={1.25} sx={{ mt: 1 }}>
      <TextField
        label="Reply text"
        size="small"
        multiline
        minRows={2}
        value={value.text ?? ""}
        onChange={(e) => patch({ text: e.target.value })}
      />
      <FormControl size="small">
        <InputLabel id="slang-reply-tone-label">Tone</InputLabel>
        <Select
          labelId="slang-reply-tone-label"
          label="Tone"
          value={value.tone ?? "neutral"}
          onChange={(e) => patch({ tone: e.target.value as string })}
        >
          <MenuItem value="neutral">Neutral</MenuItem>
          <MenuItem value="friendly">Friendly</MenuItem>
          <MenuItem value="formal">Formal</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small">
        <InputLabel id="slang-reply-lang-label">Language</InputLabel>
        <Select
          labelId="slang-reply-lang-label"
          label="Language"
          value={value.language ?? "en"}
          onChange={(e) => patch({ language: e.target.value as string })}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="de">Deutsch</MenuItem>
          <MenuItem value="hu">Magyar</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
