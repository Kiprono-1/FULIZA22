import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { SecurityProvider } from "./components/SecurityProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SecurityProvider>
      <App />
    </SecurityProvider>
  </StrictMode>
);
