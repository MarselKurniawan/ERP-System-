import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Client } from "~backend/client";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string }) => Promise<void>;
  isLoading: boolean;
  backend: Client;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backend, setBackend] = useState<Client>(() => 
    new Client(import.meta.env.VITE_CLIENT_TARGET, { 
      requestInit: { credentials: "include" } 
    })
  );

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      updateBackendWithToken(savedToken);
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const updateBackendWithToken = (tokenValue: string) => {
    const newBackend = new Client(import.meta.env.VITE_CLIENT_TARGET, {
      requestInit: { credentials: "include" },
      auth: () => ({
        authorization: `Bearer ${tokenValue}`
      })
    });
    setBackend(newBackend);
  };

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const tempBackend = new Client(import.meta.env.VITE_CLIENT_TARGET, {
        requestInit: { credentials: "include" }
      });
      const response = await tempBackend.auth.verifyToken({ token: tokenToVerify });
      setUser(response.user);
      setToken(tokenToVerify);
      localStorage.setItem("auth_token", tokenToVerify);
      updateBackendWithToken(tokenToVerify);
    } catch (error) {
      console.error("Token verification failed:", error);
      localStorage.removeItem("auth_token");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const tempBackend = new Client(import.meta.env.VITE_CLIENT_TARGET, {
        requestInit: { credentials: "include" }
      });
      const response = await tempBackend.auth.login({ email, password });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("auth_token", response.token);
      updateBackendWithToken(response.token);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await backend.auth.logout({ token });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("selectedCompany");
      const newBackend = new Client(import.meta.env.VITE_CLIENT_TARGET, {
        requestInit: { credentials: "include" }
      });
      setBackend(newBackend);
    }
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; email?: string }) => {
    if (!token) throw new Error("No authentication token");
    
    try {
      const response = await backend.auth.updateProfile({ token, ...data });
      setUser(response);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfile, isLoading, backend }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
