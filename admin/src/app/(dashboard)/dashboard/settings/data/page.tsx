"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function DataSettingsPage() {
  const [importingMembers, setImportingMembers] = useState(false);
  const [importingDeposits, setImportingDeposits] = useState(false);
  const [exportingUsers, setExportingUsers] = useState(false);
  const [exportingDeposits, setExportingDeposits] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [membersFile, setMembersFile] = useState<File | null>(null);
  const [depositsFile, setDepositsFile] = useState<File | null>(null);
  const [limit, setLimit] = useState("0");

  const importMembers = async () => {
    if (!membersFile) {
      toast.error("Pilih file anggota terlebih dahulu");
      return;
    }

    setImportingMembers(true);
    try {
      const form = new FormData();
      form.append("file", membersFile);
      const res = await api.post("/admin/data/import/members", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const stats = res.data?.stats;
      toast.success("Import data anggota berhasil");
      if (stats) {
        toast.message(
          `Rows: ${stats.rows_seen}, member baru: ${stats.members_created}, update: ${stats.members_updated}, skip: ${stats.rows_skipped}`
        );
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal import data anggota");
    } finally {
      setImportingMembers(false);
    }
  };

  const importDeposits = async () => {
    if (!depositsFile) {
      toast.error("Pilih file setoran terlebih dahulu");
      return;
    }

    setImportingDeposits(true);
    try {
      const form = new FormData();
      form.append("file", depositsFile);
      form.append("check_duplicates", "true");
      form.append("limit", String(Math.max(0, parseInt(limit || "0", 10))));

      const res = await api.post("/admin/data/import/deposits", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const stats = res.data?.import?.stats;
      toast.success("Import data setoran berhasil");
      if (stats) {
        toast.message(
          `Rows import: ${stats.rows_imported}, users baru: ${stats.users_created}, users update: ${stats.users_updated}, skip: ${stats.rows_skipped}`
        );
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal import data setoran");
    } finally {
      setImportingDeposits(false);
    }
  };

  const exportUsers = async () => {
    setExportingUsers(true);
    try {
      const res = await api.get("/admin/data/export/users", { responseType: "blob" });
      downloadBlob(res.data, `users_export_${Date.now()}.csv`);
      toast.success("Export data user berhasil");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal export data user");
    } finally {
      setExportingUsers(false);
    }
  };

  const exportDeposits = async () => {
    setExportingDeposits(true);
    try {
      const res = await api.get("/admin/data/export/deposits/xlsx", { responseType: "blob" });
      downloadBlob(res.data, `deposits_export_${Date.now()}.xlsx`);
      toast.success("Export data setoran (.xlsx) berhasil");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal export data setoran");
    } finally {
      setExportingDeposits(false);
    }
  };

  const resetData = async () => {
    const agreed = window.confirm(
      "Yakin reset data? Ini akan menghapus data anggota dan setoran (admin dan pengaturan tetap aman)."
    );
    if (!agreed) {
      return;
    }

    setResetting(true);
    try {
      const res = await api.post("/admin/data/reset");
      toast.success("Reset data berhasil");
      const deleted = res.data?.deleted;
      if (deleted) {
        toast.message(
          `Terhapus: members ${deleted.members}, deposits ${deleted.waste_deposits}, risk ${deleted.participation_risk}, redemptions ${deleted.reward_redemptions}`
        );
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal reset data");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Data</h1>
        <p className="text-muted-foreground">
          Kelola import, export, dan reset data operasional.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Data Anggota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Struktur minimal file anggota (.xlsx):
            <br />1. No Rekening (wajib)
            <br />2. Nama / Nama Lengkap (wajib)
            <br />3. Jenis Kelamin (opsional)
            <br />4. NIK (opsional)
            <br />5. Alamat (opsional)
            <br />6. Bidang (opsional)
          </p>

          <div className="max-w-md space-y-2">
            <Label>Pilih File Anggota</Label>
            <Input
              type="file"
              accept=".xlsx"
              onChange={(e) => setMembersFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={importMembers} disabled={importingMembers}>
            {importingMembers ? "Mengimport Anggota..." : "Import Data Anggota"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Data Setoran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Struktur minimal file setoran (.xlsx):
            <br />1. Timestamp (wajib)
            <br />2. Nomor Rekening / No Rekening (wajib)
            <br />3. Jenis (kode/jenis sampah) (wajib)
            <br />4. Berat (kg) (wajib)
            <br />5. Jenis Kegiatan (opsional)
            <br />6. Harga (Rp.) / Kg (opsional)
            <br />7. Total Tabungan (Rp.) (opsional)
          </p>

          <div className="max-w-md space-y-2">
            <Label>Pilih File Setoran</Label>
            <Input
              type="file"
              accept=".xlsx"
              onChange={(e) => setDepositsFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="max-w-xs space-y-2">
            <Label>Batas Baris Import (0 = semua)</Label>
            <Input type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>

          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={importDeposits} disabled={importingDeposits}>
            {importingDeposits ? "Mengimport Setoran..." : "Import Data Setoran"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportUsers} disabled={exportingUsers}>
            {exportingUsers ? "Mengexport User..." : "Export Data User"}
          </Button>
          <Button variant="outline" onClick={exportDeposits} disabled={exportingDeposits}>
            {exportingDeposits ? "Mengexport Setoran..." : "Export Data Setoran"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Reset akan menghapus data anggota dan data setoran. User admin dan konfigurasi sistem tetap dipertahankan.
          </p>
          <Button variant="destructive" onClick={resetData} disabled={resetting}>
            {resetting ? "Mereset Data..." : "Reset Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
