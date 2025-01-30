import { AuthProvider } from "./providers/AuthProvider";
import { Routes } from "./routes";

import "./App.css";

export const App = () => {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
};
