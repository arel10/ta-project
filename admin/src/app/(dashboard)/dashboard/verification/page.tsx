"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Loader2, Eye, ShieldAlert, Phone, MapPin, CreditCard } from "lucide-react";

import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInitials, formatNumber, formatDate } from "@/lib/utils";
import type { User } from "@/types";

export default function VerificationPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // KTP Preview Dialog
  const [previewKtpUrl, setPreviewKtpUrl] = useState<string | null>(null);
  const [previewMemberName, setPreviewMemberName] = useState<string>("");

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectDialogUser, setRejectDialogUser] = useState<User | null>(null);

  const fetchPendingMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        per_page: 10,
        search,
      };
      if (statusFilter !== "all") {
        params.status_filter = statusFilter;
      }

      const res = await api.get("/admin/members", { params });
      setMembers(res.data.members || []);
      setTotalCount(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch {
      toast.error("Gagal memuat data verifikasi nasabah");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPendingMembers();
  }, [fetchPendingMembers]);

  const handleApprove = async (user: User) => {
    setActionLoadingId(user.id);
    try {
      await api.put(`/admin/members/${user.id}/approve`);
      toast.success(`Akun nasabah ${user.name} berhasil disetujui & diaktifkan!`);
      fetchPendingMembers();
    } catch {
      toast.error(`Gagal menyetujui akun ${user.name}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialogUser) return;
    setActionLoadingId(rejectDialogUser.id);
    try {
      await api.put(`/admin/members/${rejectDialogUser.id}/reject`);
      toast.success(`Akun nasabah ${rejectDialogUser.name} telah ditolak.`);
      setRejectDialogUser(null);
      fetchPendingMembers();
    } catch {
      toast.error(`Gagal menolak akun ${rejectDialogUser.name}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-semibold border-green-200">Terverifikasi</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 font-semibold border-red-200">Ditolak</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-semibold border-amber-200">Menunggu Verifikasi</Badge>;
    }
  };

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const backendHost = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
      : "http://localhost:5000";
    return url.startsWith("/") ? `${backendHost}${url}` : `${backendHost}/${url}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verifikasi Pendaftar Nasabah</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola dan verifikasi akun nasabah baru yang mendaftar melalui aplikasi mobile Sirkula.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1 font-semibold">
          {formatNumber(totalCount)} {statusFilter === "pending" ? "Menunggu Verifikasi" : "Data"}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama, email, NIK, atau no telp..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Status Verifikasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
            <SelectItem value="approved">Terverifikasi (Disetujui)</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
            <SelectItem value="all">Semua Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldAlert className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-lg">Tidak ada pendaftar</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter === "pending"
                  ? "Tidak ada akun nasabah baru yang menunggu verifikasi saat ini."
                  : "Tidak ada data yang cocok dengan kriteria pencarian."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Nasabah</TableHead>
                  <TableHead>Kontak & NIK</TableHead>
                  <TableHead>Alamat Operasional</TableHead>
                  <TableHead>Foto KTP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead className="text-right">Aksi Verifikasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                            {getInitials(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                          {m.gender && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              {m.gender}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span>{m.phone || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-700 font-mono">
                          <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                          <span>NIK: {m.nik || "-"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1.5 text-xs text-gray-600 max-w-[200px]">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{m.address || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {m.ktp_image_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => {
                            setPreviewKtpUrl(resolveImageUrl(m.ktp_image_url));
                            setPreviewMemberName(m.name);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" /> Lihat KTP
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Tidak ada KTP</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(m.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(m.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {m.status !== "approved" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8 gap-1"
                            disabled={actionLoadingId === m.id}
                            onClick={() => handleApprove(m)}
                          >
                            {actionLoadingId === m.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Setujui
                          </Button>
                        )}
                        {m.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 gap-1"
                            disabled={actionLoadingId === m.id}
                            onClick={() => setRejectDialogUser(m)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Tolak
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Menampilkan {members.length} dari {formatNumber(totalCount)} data</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</Button>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(i + 1)}
              className={page === i + 1 ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</Button>
        </div>
      </div>

      {/* KTP Image Modal */}
      <Dialog open={!!previewKtpUrl} onOpenChange={() => setPreviewKtpUrl(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Foto KTP - {previewMemberName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 bg-gray-100 rounded-lg">
            {previewKtpUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewKtpUrl}
                alt={`KTP ${previewMemberName}`}
                className="max-h-[400px] object-contain rounded-md"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewKtpUrl(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={!!rejectDialogUser} onOpenChange={() => setRejectDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penolakan Pendaftaran</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menolak pendaftaran akun nasabah <strong>{rejectDialogUser?.name}</strong> ({rejectDialogUser?.email})?
            Nasabah tidak akan bisa login ke aplikasi jika akun ditolak.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogUser(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoadingId === rejectDialogUser?.id}>
              {actionLoadingId === rejectDialogUser?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ya, Tolak Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
