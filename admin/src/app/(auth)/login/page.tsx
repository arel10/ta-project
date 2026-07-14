"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import sirkulaLogo from "@/../assets/img/Sirkula.png";
import ecoRobot3d from "@/../assets/img/eco_robot.png";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await api.post("/auth/login", data);
      const { access_token, refresh_token, user } = res.data;

      // Check if user is admin
      if (user.role !== "admin") {
        const errorMsg = "Akses ditolak. Hanya admin yang bisa login ke panel ini.";
        setAuthError(errorMsg);
        toast.error(errorMsg, { duration: 2000 });
        return;
      }

      Cookies.set("access_token", access_token, { expires: 1 });
      Cookies.set("refresh_token", refresh_token, { expires: 7 });

      toast.success(`Selamat datang kembali, ${user.name}!`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMsg = error.response?.data?.message || "Email atau password salah";
      setAuthError(errorMsg);
      toast.error(errorMsg, { duration: 2000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-[2.5rem] shadow-[0_24px_80px_rgba(16,94,54,0.06)] border border-zinc-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-stretch min-h-[580px]">
      {/* Floating animation keyframes inside the component */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* Left Column - Form Container */}
      <div className="w-full md:w-[48%] flex flex-col justify-center p-2 md:p-6">
        <div className="w-full max-w-sm mx-auto space-y-6">

          {/* Welcome Text */}
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              Continue with email and password options
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-zinc-800 tracking-wide">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  className={`h-11 rounded-lg border-zinc-200 bg-white text-xs focus-visible:ring-emerald-500 focus-visible:border-emerald-500 shadow-sm transition-colors ${errors.email ? "border-red-400 focus-visible:ring-red-400" : "hover:border-zinc-300"}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-zinc-800 tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password 8-16 character"
                  className={`h-11 rounded-lg border-zinc-200 bg-white text-xs focus-visible:ring-emerald-500 focus-visible:border-emerald-500 shadow-sm transition-colors pr-10 ${errors.password ? "border-red-400 focus-visible:ring-red-400" : "hover:border-zinc-300"}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Checkbox and Forgot Password */}
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer h-3.5 w-3.5"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => toast.info("Silakan hubungi administrator pusat untuk melakukan reset password.")}
                className="text-zinc-800 font-bold hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-600 text-xs rounded-lg p-3 border border-red-100 flex items-center gap-2 font-medium">
                <span>⚠</span>
                <span>{authError}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* SSO / Google Button */}
            {/* <button
              type="button"
              onClick={() => toast.info("Sign in dengan Google saat ini dinonaktifkan untuk akun administrator.")}
              className="w-full h-11 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.74 14.96 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.8 2.95C6.12 7.53 8.83 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.92 3.41-8.6z" />
                <path fill="#FBBC05" d="M5.19 10.51c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.39 2.98C.5 4.77 0 6.78 0 8.9s.5 4.13 1.39 5.92l3.8-2.31z" />
                <path fill="#34A853" d="M12 18.96c-3.17 0-5.88-2.49-6.81-5.47l-3.8 2.31c1.98 3.89 5.96 6.56 10.61 6.56 2.96 0 5.67-1 7.76-2.73l-3.7-2.87c-1.07.72-2.42 1.2-4.06 1.2z" />
              </svg>
              Continue with Google
            </button> */}
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-100 flex flex-col gap-1">
            <p className="text-[10px] text-zinc-300">
              Authorized DLH admin access only
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Floating Mascot Illustration */}
      <div className="w-full md:w-[52%] bg-gradient-to-br from-green-50/60 via-emerald-50/30 to-teal-50/40 rounded-[2rem] border border-zinc-200/40 p-8 flex items-center justify-center relative overflow-hidden min-h-[380px] md:min-h-0 select-none">

        {/* Colorful fluid blobs matching the style in the mockup but customized to green/teal colors */}
        <div className="absolute top-[10%] right-[10%] w-60 h-60 bg-emerald-200/60 rounded-full filter blur-[50px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[10%] w-60 h-60 bg-green-200/50 rounded-full filter blur-[50px] pointer-events-none" />
        <div className="absolute top-[35%] left-[25%] w-64 h-64 bg-teal-100/50 rounded-full filter blur-[60px] pointer-events-none" />

        {/* 3D Eco Mascot Robot floating */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <Image
            src={ecoRobot3d}
            alt="Sirkula 3D Eco Mascot"
            priority
            className="h-75 w-75 md:h-76 md:w-76 object-contain z-10 animate-float pointer-events-none drop-shadow-[0_10px_25px_rgba(16,185,129,0.15)]"
          />
        </div>
      </div>
    </div>
  );
}
