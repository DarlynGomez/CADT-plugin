import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The UI root element is missing.");
}

createRoot(rootElement).render(<p>CADT plugin scaffold</p>);
