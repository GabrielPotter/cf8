import React from "react";
import { Box } from "@mui/material";
import { DiagramEditor } from "../components/diagram";

const DiagramTestView: React.FC = () => {
  return (
    <Box sx={{ width: "100%", height: "100vh" }}>
      <DiagramEditor 
      templateSet="slang"
      defaultNodeExtra={{ projectId: "cf8", author: "you", createdAt: Date.now() }}
      />
    </Box>
  );
};

export default DiagramTestView;
