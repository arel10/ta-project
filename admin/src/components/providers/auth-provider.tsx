"use client";

import React, { createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, getCurrentUser } = useAuth();

  const refreshUser = async () => {
    await getCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
