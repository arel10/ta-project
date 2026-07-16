"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, IdCard, Shield, Calendar } from "lucide-react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/axios";
import { formatDate, getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { user, refreshUser } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nik: "",
    gender: "",
    address: "",
    department: "",
    account_number: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        nik: user.nik || "",
        gender: user.gender || "",
        address: user.address || "",
        department: user.department || "",
        account_number: user.account_number || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Nama dan Email wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      await api.put("/auth/me", {
        name: formData.name,
        email: formData.email,
        nik: formData.nik || null,
        gender: formData.gender || null,
        address: formData.address || null,
        department: formData.department || null,
        account_number: formData.account_number || null,
      });
      await refreshUser();
      toast.success("Profil berhasil diperbarui!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Profil Saya</h1>
        <p className="text-muted-foreground">Kelola informasi pribadi dan detail akun admin Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <Card className="md:col-span-1 h-fit">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-green-600 text-white text-2xl font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user.role} — {user.level || "Admin"}</p>
            </div>

            <div className="w-full border-t pt-4 space-y-3 text-left text-sm">
              <div className="flex items-center gap-2.5 text-gray-600">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <IdCard className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{user.account_number || "-"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Shield className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="capitalize">{user.role}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <span>Terdaftar: {user.created_at ? formatDate(user.created_at) : "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Profile Settings Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informasi Profil</CardTitle>
            <CardDescription>Perbarui data diri dan detail profil Anda di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama Lengkap"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@domain.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nik">NIK (Nomor Induk Kependudukan)</Label>
                  <Input
                    id="nik"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="317xxxxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="account_number">Nomor Rekening Admin</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="ADM-XXXXXX"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gender">Jenis Kelamin</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department">Departemen / Divisi</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="contoh: Pengelolaan Sampah"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Alamat Rumah</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat Lengkap"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
