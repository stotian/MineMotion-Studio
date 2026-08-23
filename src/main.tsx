import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./reliability/ErrorBoundary";
// theme.css owns the palette, layout and base widgets; styles.css adds
// component-specific rules on top, so it must load second.
import "./theme.css";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary context="Application">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

