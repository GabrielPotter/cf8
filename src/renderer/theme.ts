import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#1e1e1e", paper: "#252526" },
    primary: { main: "#3ea6ff" }
  },
  typography: {
    fontFamily: [
      "Inter",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "Noto Sans",
      "sans-serif"
    ].join(","),
    fontSize: 14
  }
});

export default theme;
