import { createContext, useState, useContext } from "react";

interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[]; // Масив ролей
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const extractEmailFromToken = (token: string | null): string => {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (
      payload.email ||
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
      ""
    );
  } catch {
    return "";
  }
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (!storedUser) return null;
    try {
      const parsed = JSON.parse(storedUser);
      if (!parsed.email && storedToken) {
        parsed.email = extractEmailFromToken(storedToken);
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  const login = (token: string, user: User) => {
    const email = user.email || extractEmailFromToken(token);
    const fullUser = { ...user, email };
    setToken(token);
    setUser(fullUser);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(fullUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;