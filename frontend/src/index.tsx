import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "./components/Root";
import { SpeakersComponent, speakersAction, speakersLoader } from "./views/speakers/Speakers";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { EpisodesComponent } from "./views/episode/Episodes";
import { EpisodeComponent, episodeLoader } from "./views/episode/Episode";
import { Index } from "./components/Index";

const root = document.getElementById("root");

import "./index.css";
import { editSpeakerAction } from "./views/speakers/EditSpeaker";
import { EpisodeViewComponent, episodeViewLoader } from "./views/episode/EpisodeView";
import ErrorPage from "./components/ErrorPage";
import { editEpisodeSpeakerAction } from "./views/editEpisode/EditEpisodeSpeaker";
import { editPartAction } from "./views/editEpisode/EditPart";

if (!root) {
  throw new Error("No root element found");
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Index /> },
      {
        path: "speakers",
        element: <SpeakersComponent />,
        loader: speakersLoader,
        action: speakersAction,
        children: [{ path: ":speakerId/edit", action: editSpeakerAction }],
      },
      { path: "episodes", element: <EpisodesComponent /> },
      {
        path: "episodes/:episodeId",
        element: <EpisodeViewComponent />,
        loader: episodeViewLoader,
      },
      {
        path: "episodes/:episodeId/edit",
        element: <EpisodeComponent />,
        loader: episodeLoader,
        children: [
          {
            path: "episodeSpeakers/:episodeSpeakerId",
            action: editEpisodeSpeakerAction,
          },
          {
            path: "parts/:partId/update",
            action: editPartAction,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
