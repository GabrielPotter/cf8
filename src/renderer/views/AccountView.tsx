import React from "react";
import { Box, Stack, TextField, Typography, Switch, FormControlLabel } from "@mui/material";

const AccountView: React.FC = () => {
  const [projectName, setProjectName] = React.useState("My Project");
  const [autoSave, setAutoSave] = React.useState(true);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="subtitle2" sx={{ px: 2, py: 1, borderBottom: "1px solid #2d2d2d" }}>
        Account
      </Typography>
      <Box sx={{ p: 2 }}>
        <Stack spacing={2} sx={{ maxWidth: 420 }}>
          <TextField
            label="Projekt neve"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={<Switch checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />}
            label="Auto-save"
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default AccountView;
