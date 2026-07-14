import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: auto-attach Bearer token from cookie
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401 → clear cookie → redirect to /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      const isAlreadyOnLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";

      if (typeof window !== "undefined" && !isAlreadyOnLoginPage && !isLoginRequest) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
