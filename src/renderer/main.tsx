import React from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import {App} from "./App";
import "./styles.css";
import { SnackbarProvider } from "notistack";

const root = createRoot(document.getElementById("root")!);
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider maxSnack={7}  autoHideDuration={5000} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <App />
            </SnackbarProvider>
        </ThemeProvider>
    </React.StrictMode>
);
