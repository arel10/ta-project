"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/axios";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getCurrentUser = useCallback(async () => {
    const token = Cookies.get("access_token");
    if (!token) {
      setIsLoading(false);
      return null;
    }
    try {
      const res = await api.get("/auth/me");
      const userData = res.data.user;
      setUser(userData);
      return userData;
    } catch {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return { user, isLoading, logout, getCurrentUser };
}
