"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import type { PointSetting } from "@/types";

export default function PointSettingsPage() {
  const [settings, setSettings] = useState<PointSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const sortedSettings = [...settings].sort((a, b) => a.sort_order - b.sort_order);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/point-settings");
      setSettings(res.data.settings || []);
    } catch {
      toast.error("Gagal memuat pengaturan level poin");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettingValue = (id: number, value: number) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
  };

  const saveSettings = async () => {
    const ordered = [...settings].sort((a, b) => a.sort_order - b.sort_order);
    for (let i = 1; i < ordered.length; i += 1) {
      if (ordered[i].value <= ordered[i - 1].value) {
        toast.error("Threshold level harus berurutan naik dan tidak boleh sama");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        settings: settings.map((s) => ({
          id: s.id,
          key: s.key,
          name: s.name,
          value: s.value,
          sort_order: s.sort_order,
        })),
      };

      const res = await api.put("/admin/point-settings", payload);
      setSettings(res.data.settings || settings);
      const sync = res.data?.sync;
      const levelBadges = res.data?.level_badges || [];
      toast.success("Pengaturan level poin berhasil disimpan");
      if (sync) {
        toast.success(
          `Sync selesai: ${sync.users_updated}/${sync.users_processed} user diperbarui, ${sync.badges_added} badge ditambahkan, ${sync.badges_removed} badge dihapus.`
        );
      }
      if (Array.isArray(levelBadges) && levelBadges.length > 0) {
        toast.message(`Badge level aktif: ${levelBadges.length}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan pengaturan level poin");
    } finally {
      setSaving(false);
    }
  };

  const syncGamification = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/admin/sync-gamification");
      const sync = res.data?.sync;
      const levelBadges = res.data?.level_badges || [];

      if (sync) {
        toast.success(
          `Sinkronisasi selesai: ${sync.users_updated}/${sync.users_processed} user diperbarui, level berubah ${sync.levels_changed}, badge +${sync.badges_added} / -${sync.badges_removed}.`
        );
      } else {
        toast.success("Sinkronisasi level & badge berhasil dijalankan");
      }

      if (Array.isArray(levelBadges) && levelBadges.length > 0) {
        toast.message(`Badge level aktif: ${levelBadges.length}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menjalankan sinkronisasi");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Poin Level</h1>
        <p className="text-muted-foreground">
          Atur batas poin untuk level gamifikasi pengguna. Perubahan ini langsung memengaruhi perhitungan level.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sinkronisasi Data Level & Badge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Jalankan sinkronisasi manual untuk menghitung ulang level user dan pemberian badge berdasarkan aturan poin terbaru.
          </p>
          <div className="flex justify-end">
            <Button onClick={syncGamification} disabled={syncing || loading}>
              {syncing ? "Menyinkronkan..." : "Sync Ulang Semua User"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Threshold Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((setting, index) => (
                  <div key={setting.id} className="space-y-2 rounded-lg border p-4">
                    <Label>{setting.name} (mulai dari)</Label>
                    <Input
                      type="number"
                      min={0}
                      disabled={index === 0}
                      value={setting.value}
                      onChange={(e) => updateSettingValue(setting.id, Math.max(0, parseInt(e.target.value || "0", 10)))}
                    />
                    {index === 0 ? (
                      <p className="text-xs text-muted-foreground">Level pertama wajib dimulai dari 0 poin.</p>
                    ) : null}
                  </div>
                ))}
            </div>
          )}

          {!loading && sortedSettings.length > 0 ? (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
              <p className="text-sm font-medium">Badge level otomatis dari poin</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {sortedSettings.map((setting) => (
                  <div key={`badge-preview-${setting.id}`} className="rounded border bg-background px-3 py-2">
                    <span className="font-medium">Badge Level {setting.name}</span>
                    <span className="text-muted-foreground"> {`(>= ${setting.value} poin)`}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={saveSettings} disabled={saving || loading}>
              {saving ? "Menyimpan..." : "Simpan Pengaturan Poin"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
