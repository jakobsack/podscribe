import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export const LogoutPage = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  setTimeout(() => {
    setToken(null);
    navigate("/", { replace: true });
  }, 0);

  return <>Logout Page</>;
};
