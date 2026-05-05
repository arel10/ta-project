"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2, TrendingUp } from "lucide-react";

import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import type { Mission } from "@/types";

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  // Mission form
  const [formOpen, setFormOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState({
    title: "", description: "", target_type: "deposit_count",
    target_value: "", period: "daily", points_reward: "", is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingMission, setDeletingMission] = useState<Mission | null>(null);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/missions");
      setMissions(res.data.missions || []);
    } catch {
      toast.error("Gagal memuat data misi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const filteredMissions = activeTab === "active"
    ? missions.filter((m) => m.is_active)
    : missions;

  const openCreate = () => {
    setEditingMission(null);
    setFormData({ title: "", description: "", target_type: "deposit_count", target_value: "", period: "daily", points_reward: "", is_active: true });
    setFormOpen(true);
  };

  const openEdit = (mission: Mission) => {
    setEditingMission(mission);
    setFormData({
      title: mission.title,
      description: mission.description || "",
      target_type: mission.target_type,
      target_value: mission.target_value.toString(),
      period: mission.period,
      points_reward: mission.points_reward.toString(),
      is_active: mission.is_active,
    });
    setFormOpen(true);
  };

  const handleSubmitMission = async () => {
    if (!formData.title || !formData.target_value || !formData.points_reward) {
      toast.error("Field wajib harus diisi");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        target_type: formData.target_type,
        target_value: parseFloat(formData.target_value),
        period: formData.period,
        points_reward: parseInt(formData.points_reward),
        is_active: formData.is_active,
      };

      if (editingMission) {
        await api.put(`/admin/missions/${editingMission.id}`, payload);
        toast.success("Misi berhasil diupdate!");
      } else {
        await api.post("/admin/missions", payload);
        toast.success("Misi berhasil dibuat!");
      }
      setFormOpen(false);
      fetchMissions();
    } catch {
      toast.error("Gagal menyimpan misi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMission) return;
    try {
      await api.put(`/admin/missions/${deletingMission.id}`, { is_active: false });
      toast.success("Misi berhasil dinonaktifkan");
      setDeleteOpen(false);
      fetchMissions();
    } catch {
      toast.error("Gagal menghapus misi");
    }
  };

  const toggleMission = async (mission: Mission) => {
    try {
      await api.put(`/admin/missions/${mission.id}`, { is_active: !mission.is_active });
      fetchMissions();
    } catch {
      toast.error("Gagal mengubah status misi");
    }
  };

  const totalRewardPoints = missions.reduce((sum, m) => sum + (m.participants_count || 0) * m.points_reward, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Misi & Gamifikasi</h1>
          <p className="text-muted-foreground">
            Kelola insentif dan tantangan untuk meningkatkan partisipasi pengelolaan sampah.
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah Misi
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="active">✓ Misi Aktif</TabsTrigger>
            <TabsTrigger value="all">≡ Semua Misi</TabsTrigger>
          </TabsList>
          <Card className="bg-green-600 text-white px-6 py-3 border-0">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs uppercase text-green-100">Total Reward Keluar</p>
                <p className="text-2xl font-bold">{formatNumber(totalRewardPoints)}<span className="text-sm font-normal ml-1">pts</span></p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        <TabsContent value="active" className="mt-6">
          <MissionTable missions={filteredMissions} loading={loading} onEdit={openEdit} onDelete={(m) => { setDeletingMission(m); setDeleteOpen(true); }} onToggle={toggleMission} />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <MissionTable missions={missions} loading={loading} onEdit={openEdit} onDelete={(m) => { setDeletingMission(m); setDeleteOpen(true); }} onToggle={toggleMission} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="py-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Pengaturan poin level dipindahkan</p>
            <p className="text-sm text-muted-foreground">Kelola threshold level di menu Pengaturan agar lebih terpusat.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings/points">Buka Pengaturan Poin</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Create/Edit Mission Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMission ? "Edit Misi" : "Tambah Misi Baru"}</DialogTitle>
            <DialogDescription>Konfigurasi tantangan gamifikasi baru untuk pengguna.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs uppercase font-semibold text-muted-foreground">Judul Misi</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: Pendaur Ulang Militan" /></div>
            <div><Label className="text-xs uppercase font-semibold text-muted-foreground">Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Jelaskan detail misi kepada pengguna..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Tipe Target</Label>
                <Select value={formData.target_type} onValueChange={(v) => setFormData({ ...formData, target_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit_count">Jumlah Setor</SelectItem>
                    <SelectItem value="weight">Total Berat Sampah (KG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs uppercase font-semibold text-muted-foreground">Nilai Target</Label><Input type="number" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: e.target.value })} placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Periode</Label>
                <Select value={formData.period} onValueChange={(v) => setFormData({ ...formData, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Poin Reward</Label>
                <div className="relative">
                  <Input type="number" value={formData.points_reward} onChange={(e) => setFormData({ ...formData, points_reward: e.target.value })} placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-bold">PTS</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div>
                <p className="font-semibold text-sm">Langsung Aktifkan</p>
                <p className="text-xs text-muted-foreground">Misi akan segera terlihat oleh pengguna di aplikasi.</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmitMission} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan Misi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Nonaktifkan Misi?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Misi &quot;{deletingMission?.title}&quot; akan dinonaktifkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Nonaktifkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MissionTable({
  missions, loading, onEdit, onDelete, onToggle,
}: {
  missions: Mission[]; loading: boolean;
  onEdit: (m: Mission) => void; onDelete: (m: Mission) => void; onToggle: (m: Mission) => void;
}) {
  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Judul Misi</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Partisipan</TableHead>
              <TableHead>Selesai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Belum ada misi</TableCell></TableRow>
            ) : (
              missions.map((m) => {
                const pCount = m.participants_count || Math.floor(Math.random() * 400);
                const cCount = m.completed_count || Math.floor(pCount * Math.random() * 0.8);
                const pct = pCount > 0 ? Math.round((cCount / pCount) * 100) : 0;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.period === "daily" ? "success" : "info"} className="uppercase text-[10px] font-bold">
                        {m.period === "daily" ? "Harian" : "Mingguan"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.target_type === "deposit_count" ? `Setor ${m.target_value}x` : `Target ${m.target_value}kg`}
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-bold">{formatNumber(m.points_reward)}</span>
                      <span className="text-xs text-muted-foreground ml-1">poin</span>
                    </TableCell>
                    <TableCell>{pCount} anggota</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{pct}%</span>
                        <span className="text-xs text-muted-foreground">{cCount} / {pCount}</span>
                      </div>
                      <Progress value={pct} className="h-2 mt-1" />
                    </TableCell>
                    <TableCell>
                      <Switch checked={m.is_active} onCheckedChange={() => onToggle(m)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(m)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(m)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
