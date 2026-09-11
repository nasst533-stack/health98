import React from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import App from "./App.jsx";
const rootEl = document.getElementById("root");
const root = createRoot(rootEl);
root.render(React.createElement(App));
