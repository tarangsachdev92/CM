import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

const theme = createTheme({
  typography: {
    fontFamily: "Segoe UI, system-ui, sans-serif",
  },
  palette: {
    primary: {
      main: "#0078d4",
      dark: "#106ebe",
    },
  },
});

export function UiKitProvider({ children }: Readonly<{ children: ReactNode }>) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
