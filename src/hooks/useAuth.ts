import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/config/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("auth_token");

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
  }, []);

  const verifyToken = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        logout();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        localStorage.setItem("auth_user", JSON.stringify(data.data));
      } else {
        logout();
      }
    } catch {
      // If server unreachable, use cached user
      const cached = localStorage.getItem("auth_user");
      if (cached) {
        setUser(JSON.parse(cached));
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  return { user, loading, logout, getToken, isAuthenticated: !!user };
};

// Helper to get auth header for API calls
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
