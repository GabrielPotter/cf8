import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

export interface MappingDialogProps {
  open: boolean;
  initialData: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

const MappingDialog: React.FC<MappingDialogProps> = ({
  open,
  initialData,
  onClose,
  onSave,
}) => {
  const [localData, setLocalData] = useState(initialData || { mapTo: "" });

  const handleSave = () => {
    onSave(localData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Mapping Editor</DialogTitle>
      <DialogContent>
        <TextField
          label="Map To"
          fullWidth
          margin="dense"
          value={localData.mapTo}
          onChange={(e) => setLocalData({ ...localData, mapTo: e.target.value })}
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

export default MappingDialog;
