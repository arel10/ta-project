"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Loader2, Pencil, Trash2, Gift, Copy, CheckCheck, Search,
  AlertTriangle,
} from "lucide-react";

import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime, formatNumber, getInitials } from "@/lib/utils";
import type { Reward, RewardRedemption } from "@/types";

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("catalog");

  // Reward form
  const [formOpen, setFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    name: "", description: "", points_cost: "", stock: "", image_url: "", is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Confirm redemption modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<RewardRedemption | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const resolveImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("blob:")) {
      return imageUrl;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const backendOrigin = apiBase.replace(/\/api\/?$/, "");
    return `${backendOrigin}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  };

  const fetchRewards = useCallback(async () => {
    try {
      const res = await api.get("/admin/rewards");
      setRewards(res.data.rewards || []);
    } catch {
      toast.error("Gagal memuat data reward");
    }
  }, []);

  const fetchRedemptions = useCallback(async () => {
    try {
      const res = await api.get("/rewards/redemptions/pending");
      setRedemptions(res.data.redemptions || []);
    } catch {
      // silent fail for pending
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchRewards(), fetchRedemptions()]).finally(() => setLoading(false));
  }, [fetchRewards, fetchRedemptions]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const lowStockRewards = rewards.filter((r) => r.stock < 5 && r.is_active);

  const openCreate = () => {
    setEditingReward(null);
    setFormData({ name: "", description: "", points_cost: "", stock: "", image_url: "", is_active: true });
    setImageFile(null);
    setImagePreview("");
    setFormOpen(true);
  };

  const openEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name, description: reward.description || "",
      points_cost: reward.points_cost.toString(), stock: reward.stock.toString(),
      image_url: reward.image_url || "",
      is_active: reward.is_active,
    });
    setImageFile(null);
    setImagePreview(resolveImageUrl(reward.image_url || ""));
    setFormOpen(true);
  };

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(formData.image_url || "");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmitReward = async () => {
    if (!formData.name || !formData.points_cost) {
      toast.error("Nama dan poin wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = (formData.image_url || "").trim();

      if (imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("image", imageFile);
        const uploadRes = await api.post("/admin/reward-images", uploadForm, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data?.image_url || "";
      }

      const payload = {
        name: formData.name, description: formData.description,
        points_cost: parseInt(formData.points_cost), stock: parseInt(formData.stock) || 0,
        image_url: imageUrl,
        is_active: formData.is_active,
      };
      if (editingReward) {
        await api.put(`/admin/rewards/${editingReward.id}`, payload);
        toast.success("Reward berhasil diupdate!");
      } else {
        await api.post("/admin/rewards", payload);
        toast.success("Reward berhasil dibuat!");
      }
      setFormOpen(false);
      setImageFile(null);
      setImagePreview("");
      fetchRewards();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan reward");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Kode disalin!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmRedemption = async () => {
    if (!selectedRedemption) return;
    if (verificationCode !== selectedRedemption.redemption_code) {
      toast.error("Kode tidak sesuai, periksa kembali");
      return;
    }
    setConfirming(true);
    try {
      await api.put(`/rewards/redemptions/${selectedRedemption.id}/approve`);
      toast.success("Reward berhasil diserahkan!");
      setConfirmOpen(false);
      setSelectedRedemption(null);
      setVerificationCode("");
      fetchRedemptions();
    } catch {
      toast.error("Gagal mengkonfirmasi penukaran");
    } finally {
      setConfirming(false);
    }
  };

  const handleRejectRedemption = async () => {
    if (!selectedRedemption) return;
    setRejecting(true);
    try {
      await api.put(`/rewards/redemptions/${selectedRedemption.id}/reject`);
      toast.success("Penukaran berhasil ditolak, poin dikembalikan");
      setRejectOpen(false);
      setSelectedRedemption(null);
      setVerificationCode("");
      fetchRedemptions();
      fetchRewards();
    } catch {
      toast.error("Gagal menolak penukaran");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Katalog Reward</h1>
          <p className="text-muted-foreground">Kelola poin penukaran dan inventaris hadiah untuk pengguna.</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah Reward
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStockRewards.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">{lowStockRewards.length} reward</span> memiliki stok kurang dari 5 unit
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">
            Katalog <Badge variant="secondary" className="ml-2 text-xs">{rewards.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">Penukaran Pending</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>

        {/* TAB 1: Catalog Grid */}
        <TabsContent value="catalog" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <Card key={reward.id} className={`overflow-hidden transition-shadow hover:shadow-lg ${!reward.is_active ? "opacity-60" : ""} ${reward.stock < 5 && reward.is_active ? "ring-2 ring-yellow-300" : ""}`}>
                  <div className="h-40 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center relative">
                    {reward.image_url ? (
                      <img src={resolveImageUrl(reward.image_url)} alt={reward.name} className="h-full w-full object-cover" />
                    ) : (
                      <Gift className="h-16 w-16 text-gray-400" />
                    )}
                    <Badge variant={reward.is_active ? "success" : "secondary"} className="absolute top-3 left-3 text-xs uppercase">
                      {reward.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{reward.name}</h3>
                        <p className="text-2xl font-bold text-green-600">{formatNumber(reward.points_cost)} <span className="text-sm font-normal text-muted-foreground">poin</span></p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(reward)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className={`font-medium ${reward.stock < 5 ? "text-red-600" : "text-green-600"}`}>
                        Stok: {reward.stock}
                      </span>
                      <span className="text-muted-foreground">
                        {reward.created_at ? `Mupdate ${formatRelativeTime(reward.created_at)}` : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Pending Redemptions */}
        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Anggota</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            <div className="space-y-2">
                              <CheckCheck className="h-12 w-12 mx-auto text-green-300" />
                              <p>Tidak ada penukaran yang menunggu konfirmasi</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        redemptions.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                    {r.user_name ? getInitials(r.user_name) : "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{r.user_name || "-"}</p>
                                  <p className="text-xs text-muted-foreground">{r.user_account_number}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{r.reward?.name || "-"}</p>
                              <p className="text-xs text-muted-foreground">{formatNumber(r.points_spent)} poin</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{r.redemption_code}</code>
                                <button onClick={() => handleCopyCode(r.redemption_code, r.id)}>
                                  {copiedCode === r.id ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {r.created_at ? formatRelativeTime(r.created_at) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedRedemption(r); setVerificationCode(""); setConfirmOpen(true); }}>
                                  Setujui
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500"
                                  onClick={() => { setSelectedRedemption(r); setRejectOpen(true); }}
                                >
                                  ✕
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Right side summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase text-muted-foreground">Ringkasan Bulan Ini</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span>Total Penukaran</span><span className="font-bold">{redemptions.length}</span></div>
                  <div className="flex justify-between text-sm"><span>Poin Terpakai</span><span className="font-bold text-green-600">{formatNumber(redemptions.reduce((s, r) => s + r.points_spent, 0))}</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: History */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Riwayat penukaran akan ditampilkan di sini
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Reward Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Tambah Reward Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama reward" /></div>
            <div><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Gambar Reward (Maks. 5MB)</Label>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">Format yang didukung: PNG, JPG, WEBP</p>
              {imagePreview ? (
                <div className="w-full rounded-md border p-2">
                  <img src={imagePreview} alt="Preview reward" className="h-40 w-full rounded object-cover" />
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Poin Dibutuhkan</Label><Input type="number" value={formData.points_cost} onChange={(e) => setFormData({ ...formData, points_cost: e.target.value })} /></div>
              <div><Label>Stok</Label><Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} /></div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Status Aktif</Label>
              <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmitReward} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Redemption Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Penyerahan Reward</DialogTitle>
            <DialogDescription>Verifikasi kode penukaran dari anggota</DialogDescription>
          </DialogHeader>
          {selectedRedemption && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {selectedRedemption.user_name ? getInitials(selectedRedemption.user_name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedRedemption.user_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedRedemption.user_account_number}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Kode Penukaran</p>
                <p className="text-2xl font-mono font-bold text-green-700">{selectedRedemption.redemption_code}</p>
                <p className="text-xs text-green-600 mt-2">Minta anggota menunjukkan kode ini</p>
              </div>

              <div>
                <Label>Masukkan Kode untuk Verifikasi</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Masukkan kode"
                  className={`font-mono mt-1 ${
                    verificationCode && verificationCode === selectedRedemption.redemption_code
                      ? "border-green-500 focus-visible:ring-green-500"
                      : verificationCode ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                ⚠ Tindakan ini tidak dapat dibatalkan
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmRedemption}
              disabled={confirming || !verificationCode}
            >
              {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Redemption Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Penukaran Reward</DialogTitle>
            <DialogDescription>Poin anggota akan dikembalikan setelah penukaran ditolak</DialogDescription>
          </DialogHeader>
          {selectedRedemption && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {selectedRedemption.user_name ? getInitials(selectedRedemption.user_name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedRedemption.user_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedRedemption.user_account_number}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                ✕ Penukaran akan dibatalkan dan poin dikembalikan
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Batal</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectRedemption}
              disabled={rejecting}
            >
              {rejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tolak Penukaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
