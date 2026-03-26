import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../services/api";
import { socketService } from "../services/socket";

interface User {
  id: string;
  email: string;
  role: string;
  companyId: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

interface RegisterData {
  email: string;
  password: string;
  companyName: string;
  companySlug: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        const res = await api.post("/auth/login", { email, password });
        const { user, tokens } = res.data;
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true });
        api.defaults.headers.common["Authorization"] = "Bearer " + tokens.accessToken;
        socketService.connect(tokens.accessToken);
      },

      register: async (data: RegisterData) => {
        const res = await api.post("/auth/register", data);
        const { user, tokens } = res.data;
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true });
        api.defaults.headers.common["Authorization"] = "Bearer " + tokens.accessToken;
        socketService.connect(tokens.accessToken);
      },

      logout: () => {
        socketService.disconnect();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        delete api.defaults.headers.common["Authorization"];
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        
        try {
          const res = await api.post("/auth/refresh", { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data;
          set({ accessToken, refreshToken: newRefreshToken });
          api.defaults.headers.common["Authorization"] = "Bearer " + accessToken;
          socketService.connect(accessToken);
          return true;
        } catch {
          get().logout();
          return false;
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
        api.defaults.headers.common["Authorization"] = "Bearer " + accessToken;
        socketService.connect(accessToken);
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
