import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

export interface ConfigDialogProps {
  open: boolean;
  initialData: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

const ConfigDialog: React.FC<ConfigDialogProps> = ({
  open,
  initialData,
  onClose,
  onSave,
}) => {
  const [localData, setLocalData] = useState(initialData || { param: "" });

  const handleSave = () => {
    onSave(localData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Configure Node</DialogTitle>
      <DialogContent>
        <TextField
          label="Param"
          fullWidth
          margin="dense"
          value={localData.param}
          onChange={(e) => setLocalData({ ...localData, param: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigDialog;
