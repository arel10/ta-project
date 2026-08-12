"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, UserPlus, Loader2, Trash2 } from "lucide-react";

import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { getInitials, formatNumber, formatDate, getWasteTypeLabel } from "@/lib/utils";
import type { User, MemberDetail } from "@/types";

const riskColors: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

const avatarRiskColors: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

const levelBadgeColors: Record<string, string> = {
  Pemula: "border-orange-300 text-orange-700",
  Bronze: "border-orange-400 text-orange-700",
  Silver: "border-gray-400 text-gray-600",
  Gold: "border-yellow-500 text-yellow-700",
  Platinum: "border-purple-400 text-purple-700",
};

interface MemberRow extends User {
  risk_level?: string | null;
}

function formatRecencyLabel(days?: number | null): string {
  const safeDays = Math.max(0, days ?? 0);
  if (safeDays == 0) {
    return "Hari ini";
  }
  return `${safeDays} hari lalu`;
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [sortBy, setSortBy] = useState("created_at");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detail sheet
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    account_number: "",
    gender: "",
    nik: "",
    address: "",
    department: "",
  });

  // Add member dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addData, setAddData] = useState({
    name: "",
    email: "",
    password: "",
    account_number: "",
    gender: "",
    nik: "",
    address: "",
    department: "",
  });
  const [adding, setAdding] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<MemberRow | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 10, search };
      if (riskFilter !== "all") {
        params.churn_filter = riskFilter;
        params.risk_level = riskFilter;
      }
      params.status_filter = statusFilter;
      params.sort_by = sortBy;

      const res = await api.get("/admin/members", { params });
      setMembers(res.data.members || []);
      setTotalCount(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch {
      toast.error("Gagal memuat data anggota");
    } finally {
      setLoading(false);
    }
  }, [page, search, riskFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openDetail = async (memberId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/members/${memberId}`);
      setDetail(res.data);
    } catch {
      toast.error("Gagal memuat detail anggota");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!addData.name || !addData.email || !addData.password) {
      toast.error("Nama, email, dan password wajib diisi");
      return;
    }
    setAdding(true);
    try {
      await api.post("/admin/members", addData);
      toast.success("Anggota berhasil ditambahkan!");
      setAddOpen(false);
      setAddData({
        name: "",
        email: "",
        password: "",
        account_number: "",
        gender: "",
        nik: "",
        address: "",
        department: "",
      });
      fetchMembers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Gagal menambahkan anggota");
    } finally {
      setAdding(false);
    }
  };

  const openDeleteMember = (member: MemberRow) => {
    setMemberToDelete(member);
    setDeleteOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/admin/members/${memberToDelete.id}`);
      toast.success("Anggota berhasil dihapus");
      setDeleteOpen(false);
      setMemberToDelete(null);

      if (detail?.member?.id === memberToDelete.id) {
        setDetailOpen(false);
        setDetail(null);
      }

      fetchMembers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Gagal menghapus anggota");
    } finally {
      setDeleting(false);
    }
  };

  const openEditProfile = () => {
    if (!detail?.member) {
      return;
    }
    setEditData({
      name: detail.member.name || "",
      email: detail.member.email || "",
      account_number: detail.member.account_number || "",
      gender: detail.member.gender || "",
      nik: detail.member.nik || "",
      address: detail.member.address || "",
      department: detail.member.department || "",
    });
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!detail?.member) {
      return;
    }

    if (!editData.name.trim() || !editData.email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    setEditSaving(true);
    try {
      const payload = {
        name: editData.name.trim(),
        email: editData.email.trim(),
        account_number: editData.account_number.trim(),
        gender: editData.gender.trim(),
        nik: editData.nik.trim(),
        address: editData.address.trim(),
        department: editData.department.trim(),
      };

      const res = await api.put(`/admin/members/${detail.member.id}`, payload);
      const updatedMember = res.data?.member;

      if (updatedMember) {
        setDetail((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            member: {
              ...prev.member,
              ...updatedMember,
            },
          };
        });

        setMembers((prev) =>
          prev.map((m) =>
            m.id === detail.member.id
              ? {
                ...m,
                name: updatedMember.name,
                email: updatedMember.email,
                account_number: updatedMember.account_number,
                gender: updatedMember.gender,
                nik: updatedMember.nik,
                address: updatedMember.address,
                department: updatedMember.department,
              }
              : m
          )
        );
      }

      toast.success("Profil anggota berhasil diperbarui");
      setEditOpen(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Gagal memperbarui profil anggota");
    } finally {
      setEditSaving(false);
    }
  };

  const getLevelProgress = (points: number) => {
    if (points >= 15000) return { level: "Platinum", progress: 100, next: "Max" };
    if (points >= 10000) return { level: "Gold", progress: ((points - 10000) / 5000) * 100, next: "Platinum" };
    if (points >= 5000) return { level: "Silver", progress: ((points - 5000) / 5000) * 100, next: "Gold" };
    return { level: "Bronze", progress: (points / 5000) * 100, next: "Silver" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Daftar Anggota</h1>
          <Badge variant="secondary" className="text-sm px-3 py-1 font-semibold">
            {formatNumber(totalCount)} Anggota
          </Badge>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" /> Tambah Anggota
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama atau nomor rekening..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status Akun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="approved">Status: Terverifikasi</SelectItem>
            <SelectItem value="pending">Status: Pending</SelectItem>
            <SelectItem value="rejected">Status: Ditolak</SelectItem>
            <SelectItem value="all">Semua Status Akun</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status Churn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="churn">Potensi Churn</SelectItem>
            <SelectItem value="not_churn">Tidak Churn</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Urutkan: Terbaru</SelectItem>
            <SelectItem value="total_points">Urutkan: Total Poin</SelectItem>
            <SelectItem value="name">Urutkan: Nama</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Anggota</TableHead>
                  <TableHead>No Rekening</TableHead>
                  <TableHead>Total Poin</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status Churn</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const isChurn = m.will_churn === true || m.risk_level === "high";
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={isChurn ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                              {getInitials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">{m.account_number || "-"}</span>
                      </TableCell>
                      <TableCell className="font-semibold">{formatNumber(m.total_points)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={levelBadgeColors[m.level] || "border-gray-300 text-gray-600"}>
                          {m.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(m.will_churn === true || m.risk_level === "high") ? (
                          <Badge variant="danger" className="uppercase text-xs font-bold">
                            Potensi Churn
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-green-600 font-semibold hover:text-green-700" onClick={() => openDetail(m.id)}>
                          Detail
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteMember(m)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Menampilkan {members.length} dari {formatNumber(totalCount)} anggota</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</Button>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => (
            <Button key={i} variant={page === i + 1 ? "default" : "outline"} size="sm" onClick={() => setPage(i + 1)} className={page === i + 1 ? "bg-green-600 hover:bg-green-700" : ""}>
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</Button>
        </div>
      </div>

      {/* Member Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detail Anggota</SheetTitle>
            <SheetDescription>Informasi lengkap anggota</SheetDescription>
          </SheetHeader>
          {detailLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-6 mt-6">
              {/* Profile */}
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto">
                  <AvatarFallback className="text-2xl bg-green-100 text-green-700">
                    {getInitials(detail.member.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold mt-3">{detail.member.name}</h3>
                <p className="text-muted-foreground text-sm">{detail.member.email}</p>
                <p className="text-xs text-green-600 font-semibold mt-1 uppercase">
                  Gabung: {formatDate(detail.member.created_at)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">No Rekening</p>
                  <p className="font-semibold">{detail.member.account_number || "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Jenis Kelamin</p>
                  <p className="font-semibold">{detail.member.gender || "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">NIK</p>
                  <p className="font-semibold break-all">{detail.member.nik || "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Bidang</p>
                  <p className="font-semibold">{detail.member.department || "-"}</p>
                </div>
              </div>

              <div className="rounded-lg border p-3 text-sm">
                <p className="text-xs text-muted-foreground">Alamat</p>
                <p className="font-medium mt-1">{detail.member.address || "-"}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Total Poin</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(detail.member.total_points)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Total Setoran</p>
                  <p className="text-2xl font-bold">{detail.stats.total_weight_kg} <span className="text-base font-normal">kg</span></p>
                </div>
              </div>

              {/* Level Progress */}
              {(() => {
                const lp = getLevelProgress(detail.member.total_points);
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-semibold">Level {lp.level}</span>
                      <span className="text-muted-foreground">{Math.round(lp.progress)}% Menuju {lp.next}</span>
                    </div>
                    <Progress value={lp.progress} className="h-3" />
                  </div>
                );
              })()}

              <Separator />

              {/* Churn Profile */}
              {(() => {
                const cp = detail.churn_profile || detail.risk_profile;
                if (!cp) return null;
                const isChurn = cp.will_churn === true || cp.risk_level === "high";
                const prob = cp.churn_probability !== undefined && cp.churn_probability !== null
                  ? Math.round(cp.churn_probability * 100)
                  : null;

                return (
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Prediksi Churn ML (60 Hari)</h4>
                      {isChurn && (
                        <Badge variant="danger" className="uppercase text-xs font-bold">
                          Potensi Churn
                        </Badge>
                      )}
                    </div>
                    {prob !== null && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Probabilitas Churn:</span>
                          <span className={`font-bold ${isChurn ? "text-red-600" : "text-green-600"}`}>{prob}%</span>
                        </div>
                        <Progress value={prob} className={`h-2 ${isChurn ? "[&>div]:bg-red-600" : "[&>div]:bg-green-600"}`} />
                      </div>
                    )}
                    <div className="space-y-1 text-xs text-muted-foreground pt-1">
                      <div className="flex justify-between"><span>Setoran Terakhir:</span><span className="font-semibold text-foreground">{formatRecencyLabel(cp.recency_days)}</span></div>
                      <div className="flex justify-between"><span>Frekuensi Total:</span><span className="font-semibold text-foreground">{cp.frequency}x</span></div>
                    </div>
                  </div>
                );
              })()}

              <Separator />

              {/* Recent Deposits */}
              <div>
                <h4 className="font-semibold mb-3">Setoran Terakhir</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead className="text-right">Berat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detail.recent_deposits || []).slice(0, 5).map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{d.created_at ? formatDate(d.created_at) : "-"}</TableCell>
                        <TableCell className="text-sm">{getWasteTypeLabel(d.waste_type)}</TableCell>
                        <TableCell className="text-sm text-right font-medium">{d.weight_kg} kg</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={openEditProfile}>Edit Profil</Button>
                <Button variant="destructive" className="flex-1" onClick={() => openDeleteMember(detail.member as MemberRow)}>Hapus</Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profil Anggota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama</Label><Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} /></div>
            <div><Label>No Rekening</Label><Input value={editData.account_number} onChange={(e) => setEditData({ ...editData, account_number: e.target.value })} /></div>
            <div><Label>Jenis Kelamin</Label><Input value={editData.gender} onChange={(e) => setEditData({ ...editData, gender: e.target.value })} /></div>
            <div><Label>NIK</Label><Input value={editData.nik} onChange={(e) => setEditData({ ...editData, nik: e.target.value })} /></div>
            <div><Label>Bidang</Label><Input value={editData.department} onChange={(e) => setEditData({ ...editData, department: e.target.value })} /></div>
            <div><Label>Alamat</Label><Input value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveProfile} disabled={editSaving}>
              {editSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Anggota Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama</Label><Input value={addData.name} onChange={(e) => setAddData({ ...addData, name: e.target.value })} placeholder="Nama lengkap" /></div>
            <div><Label>Email</Label><Input type="email" value={addData.email} onChange={(e) => setAddData({ ...addData, email: e.target.value })} placeholder="email@example.com" /></div>
            <div><Label>No Rekening</Label><Input value={addData.account_number} onChange={(e) => setAddData({ ...addData, account_number: e.target.value })} placeholder="Contoh: BSLH1234" /></div>
            <div><Label>Jenis Kelamin</Label><Input value={addData.gender} onChange={(e) => setAddData({ ...addData, gender: e.target.value })} placeholder="Laki-laki / Perempuan" /></div>
            <div><Label>NIK</Label><Input value={addData.nik} onChange={(e) => setAddData({ ...addData, nik: e.target.value })} placeholder="Nomor NIK" /></div>
            <div><Label>Bidang</Label><Input value={addData.department} onChange={(e) => setAddData({ ...addData, department: e.target.value })} placeholder="Nama bidang" /></div>
            <div><Label>Alamat</Label><Input value={addData.address} onChange={(e) => setAddData({ ...addData, address: e.target.value })} placeholder="Alamat lengkap" /></div>
            <div><Label>Password</Label><Input type="password" value={addData.password} onChange={(e) => setAddData({ ...addData, password: e.target.value })} placeholder="Min. 6 karakter" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAddMember} disabled={adding}>
              {adding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Anggota</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {`Yakin ingin menghapus anggota ${memberToDelete?.name || "ini"}? Semua data terkait anggota ini akan ikut terhapus.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteMember} disabled={deleting}>
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</> : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
