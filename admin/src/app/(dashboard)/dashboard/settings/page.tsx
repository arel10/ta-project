"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Recycle, Trophy, Database, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSaveProfileAndPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let updatedSomething = false;

      // 1. Update nama / email jika berubah
      if (user && (name !== user.name || email !== user.email)) {
        if (!name.trim() || !email.trim()) {
          toast.error("Nama dan Email tidak boleh kosong");
          setSubmitting(false);
          return;
        }

        await api.put("/auth/me", {
          name: name.trim(),
          email: email.trim(),
        });
        await refreshUser();
        updatedSomething = true;
      }

      // 2. Ubah password jika field password diisi
      if (oldPassword || newPassword) {
        if (!oldPassword) {
          toast.error("Silakan masukkan password lama");
          setSubmitting(false);
          return;
        }
        if (!newPassword) {
          toast.error("Silakan masukkan password baru");
          setSubmitting(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error("Password baru minimal 6 karakter");
          setSubmitting(false);
          return;
        }

        await api.post("/auth/change-password", {
          current_password: oldPassword,
          new_password: newPassword,
        });

        setOldPassword("");
        setNewPassword("");
        updatedSomething = true;
      }

      if (updatedSomething) {
        toast.success("Perubahan berhasil disimpan!");
      } else {
        toast.info("Tidak ada perubahan data.");
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Gagal menyimpan perubahan";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan akun dan aplikasi.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfileAndPassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin-name">Nama</Label>
                <Input
                  id="admin-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Admin"
                />
              </div>
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Admin"
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label>Ubah Password</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kosongkan jika tidak ingin mengganti password.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <Input
                  type="password"
                  placeholder="Password lama"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <Input
                  type="password"
                  placeholder="Password baru (minimal 6 karakter)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Aplikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>API URL</Label>
            <Input defaultValue={process.env.NEXT_PUBLIC_API_URL} disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Versi aplikasi: Sirkula Admin v1.0.0
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5 text-green-700" />
              Pengaturan Sampah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Kelola kode jenis sampah, nama, poin per kilogram, dan status aktif.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
              <Link href="/dashboard/settings/waste">Buka Pengaturan Sampah</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-700" />
              Pengaturan Poin Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Atur threshold poin untuk level Bronze, Silver, Gold, dan Platinum.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
              <Link href="/dashboard/settings/points">Buka Pengaturan Poin</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-700" />
              Pengaturan Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Import data dari file Excel DLH, export data user/setoran, dan reset data operasional.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
              <Link href="/dashboard/settings/data">Buka Pengaturan Data</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
