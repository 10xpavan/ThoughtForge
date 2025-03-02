import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure dark mode is applied
document.documentElement.classList.add('dark');

// Get the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Create the root and render the app
createRoot(rootElement).render(<App />);
