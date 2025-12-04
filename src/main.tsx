import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { store } from "@store/gameStore";

const routerBase = import.meta.env.VITE_BASE_PATH?.replace(/\/+$/, "") || "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={routerBase}>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
