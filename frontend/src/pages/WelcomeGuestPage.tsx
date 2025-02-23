import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useEffect } from "react";

export const WelcomeGuestPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto px-6 max-w-7xl md:px-12">
          <h1 className="podscribe">Podscribe</h1>
          <p>Welcome to this podscribe instance.</p>
        </div>
      </div>
    </section>
  );
};
