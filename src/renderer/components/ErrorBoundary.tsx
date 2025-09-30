import React from "react";
import { Box, Button, Typography } from "@mui/material";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can add logging/telemetry here if needed.
    // console.error("Renderer error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3, color: "#fff" }}>
          <Typography variant="h6" gutterBottom>Renderer hiba</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {this.state.error.message}
          </Typography>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Újratöltés
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
