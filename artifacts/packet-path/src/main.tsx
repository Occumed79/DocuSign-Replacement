import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./tahoe-green.css";

createRoot(document.getElementById("root")!).render(
  <>
    <div className="luminous-orb one" />
    <div className="luminous-orb two" />
    <div className="luminous-orb three" />
    <App />
  </>
);
