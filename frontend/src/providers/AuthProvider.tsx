import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Claims } from "../definitions";
import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "jwt-decode";

interface AuthContextParams {
  token: string | null;
  decoded: JwtPayloadWithClaims | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextParams>({ token: null, decoded: null, setToken: () => {} });

interface JwtPayloadWithClaims extends JwtPayload {
  claims?: Claims;
}

interface AuthProviderParams {
  children: JSX.Element | JSX.Element[];
}

export const AuthProvider = ({ children }: AuthProviderParams) => {
  // State to hold the authentication token
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [decoded, setDecoded] = useState(token ? (jwtDecode(token) as JwtPayloadWithClaims) || null : null);

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token) as JwtPayloadWithClaims;
      localStorage.setItem("token", token);
      setDecoded(decoded || null);
    } else {
      localStorage.removeItem("token");
      setDecoded(null);
    }
  }, [token]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token,
      decoded,
      setToken,
    }),
    [token, decoded],
  );

  // Provide the authentication context to the children components
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
