import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Auto-detect user's language preference
const userLanguage = (navigator.language || navigator.languages?.[0] || 'es').split('-')[0];
if (userLanguage === 'en') {
  localStorage.setItem('preferred_language', 'en');
} else if (userLanguage === 'es') {
  localStorage.setItem('preferred_language', 'es');
}

createRoot(document.getElementById("root")!).render(<App />);
