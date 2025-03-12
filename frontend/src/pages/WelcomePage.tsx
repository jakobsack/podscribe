import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export const WelcomePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <h1 className="podscribe">Podscribe</h1>
        </div>
      </div>
    </section>
  );
};
