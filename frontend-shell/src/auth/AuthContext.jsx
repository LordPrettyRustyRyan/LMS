import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, getMe } from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // INIT SESSION
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await getMe();
        setUser(me);
      } catch (err) {
        localStorage.removeItem("access_token");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // LOGIN
  const login = async (credentials) => {
    const data = await loginUser(credentials);

    localStorage.setItem("access_token", data.access_token);

    const me = await getMe();
    setUser(me);

    return me;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);