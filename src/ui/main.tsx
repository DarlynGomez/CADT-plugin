import { createRoot } from "react-dom/client";

import "./theme/global.css";
import { App } from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The UI root element is missing.");
}

createRoot(rootElement).render(<App />);
