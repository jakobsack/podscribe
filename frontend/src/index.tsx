import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "./Root";
import { Speakers } from "./Speakers";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Episodes } from "./Episodes";
import { Episode, episodeLoader } from "./Episode";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No root element found");
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { path: "speakers", element: <Speakers /> },
      { path: "episodes", element: <Episodes /> },
      {
        path: "episodes/:episodeId",
        element: <Episode />,
        loader: episodeLoader,
      },
    ],
  },
]);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
