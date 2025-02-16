import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { loginAction, LoginPage } from "../pages/LoginPage";
import { LogoutPage } from "../pages/LogoutPage";
import { MainLayout } from "../layouts/MainLayout";
import { GuestLayout } from "../layouts/GuestLayout";
import { ErrorPage } from "../pages/ErrorPage";
import { WelcomePage } from "../pages/WelcomePage";
import { speakersAction, SpeakersComponent, speakersLoader } from "../pages/speakers/SpeakersPage";
import { editSpeakerAction } from "../pages/speakers/EditSpeaker";
import { EpisodeViewComponent, episodeViewLoader } from "../pages/episodes/EpisodeView";
import { EpisodesComponent, episodesLoader } from "../pages/episodes/Episodes";
import { EpisodeComponent, episodeLoader } from "../pages/editEpisode/Episode";
import { editEpisodeSpeakerAction } from "../pages/editEpisode/EditEpisodeSpeaker";
import { editPartAction } from "../pages/editEpisode/EditPart";
import { searchAction, SearchComponent } from "../pages/search/Search";

export const Routes = () => {
  const { token } = useAuth();

  // Define public routes accessible to all users
  const routesForPublic = [
    {
      path: "/service",
      element: <div>Service Page</div>,
    },
    {
      path: "/about-us",
      element: <div>About Us</div>,
    },
  ];

  // Define routes accessible only to authenticated users
  const routesForAuthenticatedOnly = [
    {
      path: "/",
      element: <MainLayout />, // Wrap the component in ProtectedRoute
      errorElement: <ErrorPage />,
      children: [
        {
          path: "",
          element: <WelcomePage />,
        },
        {
          path: "speakers",
          element: <SpeakersComponent />,
          loader: speakersLoader,
          action: speakersAction,
          children: [{ path: ":speakerId/edit", action: editSpeakerAction }],
        },
        { path: "episodes", element: <EpisodesComponent />, loader: episodesLoader },
        { path: "search", element: <SearchComponent />, action: searchAction },
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
        {
          path: "/logout",
          element: <LogoutPage />,
        },
      ],
    },
  ];

  // Define routes accessible only to non-authenticated users
  const routesForNotAuthenticatedOnly = [
    {
      path: "/",
      element: <GuestLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "",
          element: <div>Welcome</div>,
        },
        {
          path: "/login",
          element: <LoginPage />,
          action: loginAction,
        },
      ],
    },
  ];

  // Combine and conditionally include routes based on authentication status
  const router = createBrowserRouter([
    ...routesForPublic,
    ...(token ? routesForAuthenticatedOnly : routesForNotAuthenticatedOnly),
  ]);

  // Provide the router configuration using RouterProvider
  return <RouterProvider router={router} />;
};
