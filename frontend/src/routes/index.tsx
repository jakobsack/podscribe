import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { loginAction, LoginPage } from "../pages/LoginPage";
import { LogoutPage } from "../pages/LogoutPage";
import { ErrorPage } from "../pages/ErrorPage";
import { WelcomePage } from "../pages/WelcomePage";
import { speakersAction, SpeakersComponent, speakersLoader } from "../pages/speakers/SpeakersPage";
import { editSpeakerAction } from "../pages/speakers/EditSpeaker";
import { EpisodeViewComponent, episodeViewLoader } from "../pages/episodes/EpisodeView";
import { EpisodesComponent, episodesLoader } from "../pages/episodes/Episodes";
import { episodeAction, EpisodeComponent, episodeLoader } from "../pages/editEpisode/Episode";
import { searchAction, SearchComponent } from "../pages/search/Search";
import { Layout } from "../layouts/Layout";
import { WelcomeGuestPage } from "../pages/WelcomeGuestPage";
import { signUpAction, SignUpPage } from "../pages/SignUpPage";
import { verifyLoader, VerifyPage } from "../pages/VerifyPage";

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
      action: episodeAction,
      loader: episodeLoader,
    },
    {
      path: "/logout",
      element: <LogoutPage />,
    },
  ];

  // Define routes accessible only to non-authenticated users
  const routesForNotAuthenticatedOnly = [
    {
      path: "",
      element: <WelcomeGuestPage />,
    },
    {
      path: "/login",
      element: <LoginPage />,
      action: loginAction,
    },
    {
      path: "/signup",
      element: <SignUpPage />,
      action: signUpAction,
    },
    {
      path: "/verify/:verificationToken",
      element: <VerifyPage />,
      loader: verifyLoader,
    },
  ];

  // Combine and conditionally include routes based on authentication status
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />, // Wrap the component in ProtectedRoute
      errorElement: <ErrorPage />,
      children: [...routesForPublic, ...(token ? routesForAuthenticatedOnly : routesForNotAuthenticatedOnly)],
    },
  ]);

  // Provide the router configuration using RouterProvider
  return <RouterProvider router={router} />;
};
