import { AuthProvider } from "./providers/AuthProvider";
import { Routes } from "./routes";

import "./App.css";

const mainHeader = document.querySelector("#header") as HTMLDivElement;
const menuBtn = document.querySelector("#menu-btn") as HTMLDivElement;

if (menuBtn && mainHeader && mainHeader.dataset)
  menuBtn.addEventListener("click", () => {
    mainHeader.dataset.state = mainHeader.dataset.state === "active" ? "closed" : "active";
  });

export const App = () => {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
};
