import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./reliability/ErrorBoundary";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary context="Application">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

