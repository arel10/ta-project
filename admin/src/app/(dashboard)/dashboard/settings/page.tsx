"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Recycle, Trophy, Database } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthContext();

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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nama</Label>
              <Input defaultValue={user?.name || ""} />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue={user?.email || ""} type="email" />
            </div>
          </div>
          <Separator />
          <div>
            <Label>Ubah Password</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input type="password" placeholder="Password lama" />
              <Input type="password" placeholder="Password baru" />
            </div>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Simpan Perubahan
          </Button>
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
