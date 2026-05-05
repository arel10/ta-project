"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/utils";
import api from "@/lib/axios";
import type { WastePointRate } from "@/types";

export default function WasteSettingsPage() {
  const [rates, setRates] = useState<WastePointRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [savingRates, setSavingRates] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingRate, setCreatingRate] = useState(false);
  const [newRate, setNewRate] = useState({
    code: "",
    name: "",
    category: "lainnya",
    points_per_kg: "0",
    is_active: true,
  });

  const fetchRates = useCallback(async () => {
    setLoadingRates(true);
    try {
      const res = await api.get("/admin/waste-point-rates");
      setRates(res.data.rates || []);
    } catch {
      toast.error("Gagal memuat pengaturan poin sampah");
    } finally {
      setLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const totalActiveRates = useMemo(
    () => rates.filter((r) => r.is_active).length,
    [rates]
  );

  const updateRateValue = (id: number, points: number) => {
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, points_per_kg: points } : r))
    );
  };

  const updateRateName = (id: number, name: string) => {
    setRates((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  };

  const toggleRate = (id: number, active: boolean) => {
    setRates((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: active } : r)));
  };

  const saveRates = async () => {
    setSavingRates(true);
    try {
      const payload = {
        rates: rates.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          category: r.category,
          points_per_kg: r.points_per_kg,
          is_active: r.is_active,
        })),
      };

      const res = await api.put("/admin/waste-point-rates", payload);
      setRates(res.data.rates || rates);
      toast.success("Pengaturan poin sampah berhasil disimpan");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan pengaturan poin sampah");
    } finally {
      setSavingRates(false);
    }
  };

  const handleCreateRate = async () => {
    if (!newRate.code.trim() || !newRate.name.trim()) {
      toast.error("Kode dan nama sampah wajib diisi");
      return;
    }

    setCreatingRate(true);
    try {
      await api.post("/admin/waste-point-rates", {
        code: newRate.code.trim().toUpperCase(),
        name: newRate.name.trim(),
        category: newRate.category.trim() || "lainnya",
        points_per_kg: Math.max(0, parseInt(newRate.points_per_kg || "0", 10)),
        is_active: newRate.is_active,
      });

      toast.success("Jenis sampah berhasil ditambahkan");
      setCreateOpen(false);
      setNewRate({ code: "", name: "", category: "lainnya", points_per_kg: "0", is_active: true });
      fetchRates();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menambah jenis sampah");
    } finally {
      setCreatingRate(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Sampah</h1>
        <p className="text-muted-foreground">
          Atur jenis sampah dan poin per kilogram yang dipakai di backend, mobile, dan admin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Ketentuan Sampah & Poin</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ubah nama jenis sampah, poin per kilogram, dan status aktif setiap kategori.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Jenis Aktif</p>
              <p className="text-2xl font-bold text-green-700">{formatNumber(totalActiveRates)}</p>
              <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => setCreateOpen(true)}>
                Tambah Jenis Sampah
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingRates ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-20">Kode</TableHead>
                  <TableHead>Nama Sampah</TableHead>
                  <TableHead className="w-52">Poin per Kg</TableHead>
                  <TableHead className="w-28">Aktif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-semibold">{rate.code}</TableCell>
                    <TableCell>
                      <Input
                        value={rate.name}
                        onChange={(e) => updateRateName(rate.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={rate.points_per_kg}
                        onChange={(e) => updateRateValue(rate.id, Math.max(0, parseInt(e.target.value || "0", 10)))}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={rate.is_active} onCheckedChange={(v) => toggleRate(rate.id, v)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={saveRates} disabled={savingRates || loadingRates}>
              {savingRates ? "Menyimpan..." : "Simpan Pengaturan Sampah"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Jenis Sampah</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Kode</Label>
              <Input value={newRate.code} onChange={(e) => setNewRate((prev) => ({ ...prev, code: e.target.value }))} placeholder="Contoh: P10" />
            </div>
            <div>
              <Label>Nama Sampah</Label>
              <Input value={newRate.name} onChange={(e) => setNewRate((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nama jenis sampah" />
            </div>
            <div>
              <Label>Kategori</Label>
              <Input value={newRate.category} onChange={(e) => setNewRate((prev) => ({ ...prev, category: e.target.value }))} placeholder="plastik / kertas / logam / lainnya" />
            </div>
            <div>
              <Label>Poin per Kg</Label>
              <Input type="number" min={0} value={newRate.points_per_kg} onChange={(e) => setNewRate((prev) => ({ ...prev, points_per_kg: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={newRate.is_active} onCheckedChange={(v) => setNewRate((prev) => ({ ...prev, is_active: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creatingRate}>Batal</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleCreateRate} disabled={creatingRate}>
              {creatingRate ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
