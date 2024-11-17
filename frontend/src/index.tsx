import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "./components/Root";
import {
  Speakers,
  speakersAction,
  speakersLoader,
} from "./components/Speakers";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Episodes } from "./components/Episodes";
import { Episode, episodeLoader } from "./components/Episode";
import { Index } from "./components/Index";

const root = document.getElementById("root");

import "./index.css";
import { editSpeakerAction } from "./components/EditSpeaker";

if (!root) {
  throw new Error("No root element found");
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Index /> },
      {
        path: "speakers",
        element: <Speakers />,
        loader: speakersLoader,
        action: speakersAction,
        children: [{ path: ":speakerId/edit", action: editSpeakerAction }],
      },
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
