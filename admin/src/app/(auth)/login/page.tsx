"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

import api from "@/lib/axios";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/login", data);
      const { access_token, refresh_token, user } = res.data;

      // Check if user is admin
      if (user.role !== "admin") {
        toast.error("Akses ditolak. Hanya admin yang bisa login ke panel ini.");
        return;
      }

      Cookies.set("access_token", access_token, { expires: 1 });
      Cookies.set("refresh_token", refresh_token, { expires: 7 });

      toast.success(`Selamat datang, ${user.name}!`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Email atau password salah");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <BrandLogo showSubtitle={false} imageClassName="h-20 w-20" textClassName="text-4xl" />
        </div>
        <h1 className="text-[30px] font-bold text-[#13321f] leading-tight tracking-tight">Masuk ke Admin Panel</h1>
      </div>

      <Card className="border border-emerald-100/80 bg-white/90 backdrop-blur shadow-[0_20px_60px_-28px_rgba(16,94,54,0.45)]">
        <CardContent className="pt-7 px-6 md:px-7 pb-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-[#2c4b39]">
                Email Admin
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-700/45" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@padang.go.id"
                  className={`pl-10 h-12 rounded-xl border-emerald-100 bg-emerald-50/40 focus-visible:ring-emerald-500 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  ⚠ {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-[#2c4b39]">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-700/45" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  className={`pl-10 pr-10 h-12 rounded-xl border-emerald-100 bg-emerald-50/40 focus-visible:ring-emerald-500 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-800/45 hover:text-emerald-800"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  ⚠ {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#355743]">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                Ingat saya
              </label>
              <button type="button" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Lupa password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-base font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
        <p className="text-sm text-emerald-900">
          <span className="font-medium">ℹ</span> Akses terbatas untuk admin Dinas Lingkungan Hidup Kota Padang
        </p>
      </div>
    </div>
  );
}
