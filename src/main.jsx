import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.onerror = function(message, source, lineno, colno) {
  console.error("Global error caught:", message, "at", source, ":", lineno, ":", colno);
};

console.log("main.jsx: starting render");
try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log("main.jsx: render called");
} catch (err) {
  console.error("main.jsx: render failed", err);
}
