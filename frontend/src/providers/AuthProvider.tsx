import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextParams {
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextParams>({ token: null, setToken: () => {} });

interface AuthProviderParams {
  children: JSX.Element | JSX.Element[];
}

export const AuthProvider = ({ children }: AuthProviderParams) => {
  // State to hold the authentication token
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token,
      setToken,
    }),
    [token],
  );

  // Provide the authentication context to the children components
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
