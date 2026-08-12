"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Download, Loader2 } from "lucide-react";

import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatRelativeTime, getWasteTypeLabel, getWasteCategory, formatNumber,
} from "@/lib/utils";
import type { WasteDeposit } from "@/types";

interface WastePointRate {
  id: number;
  code: string;
  name: string;
  points_per_kg: number;
  is_active: boolean;
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<WasteDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [pointRates, setPointRates] = useState<Record<string, number>>({});

  // Validation modal state
  const [validateOpen, setValidateOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<WasteDeposit | null>(null);
  const [validating, setValidating] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [exporting, setExporting] = useState(false);

  const exportDepositsXlsx = async () => {
    setExporting(true);
    try {
      const res = await api.get("/admin/data/export/deposits/xlsx", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `deposits_export_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export data setoran (.xlsx) berhasil");
    } catch {
      toast.error("Gagal export data setoran");
    } finally {
      setExporting(false);
    }
  };

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 10 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get("/admin/deposits", { params });
      const data = res.data.data;
      setDeposits(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);

      // Get pending count
      const pendingRes = await api.get("/admin/deposits", { params: { status: "pending", per_page: 1 } });
      setPendingCount(pendingRes.data.data?.total || 0);
    } catch {
      toast.error("Gagal memuat data setoran");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchPointRates = useCallback(async () => {
    try {
      const res = await api.get("/admin/waste-point-rates");
      const rates: WastePointRate[] = res.data.rates || [];
      const rateMap: Record<string, number> = {};
      rates.forEach((rate) => {
        if (rate.is_active) {
          rateMap[rate.code.toLowerCase()] = rate.points_per_kg;
        }
      });
      setPointRates(rateMap);
    } catch {
      // silent fallback: preview points will default to 0
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");
      if (status && ["all", "pending", "validated", "rejected"].includes(status)) {
        setStatusFilter(status);
      }
    }
  }, []);

  useEffect(() => {
    fetchDeposits();
    fetchPointRates();
  }, [fetchDeposits, fetchPointRates]);

  const calculatePoints = (weight: number, wasteType: string): number => {
    const rate = pointRates[(wasteType || "").toLowerCase()] || 0;
    return Math.round(weight * rate);
  };

  const handleValidate = async () => {
    if (!selectedDeposit) return;
    setValidating(true);
    try {
      await api.put(`/deposits/${selectedDeposit.id}/validate`, {
        actual_weight_kg: selectedDeposit.weight_kg,
      });

      toast.success("Setoran berhasil divalidasi!");

      // Optimistic update
      setDeposits((prev) =>
        prev.map((d) =>
          d.id === selectedDeposit.id
            ? { ...d, status: "validated" as const, points_earned: calculatePoints(d.weight_kg, d.waste_type) }
            : d
        )
      );

      setValidateOpen(false);
      setSelectedDeposit(null);
      fetchDeposits();
    } catch {
      toast.error("Gagal memvalidasi setoran");
    } finally {
      setValidating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit || !rejectionReason.trim()) return;
    setValidating(true);
    try {
      await api.put(`/deposits/${selectedDeposit.id}/reject`, {
        rejection_reason: rejectionReason.trim(),
      });

      toast.success("Setoran berhasil ditolak!");

      // Optimistic update
      setDeposits((prev) =>
        prev.map((d) =>
          d.id === selectedDeposit.id
            ? { ...d, status: "rejected" as const, rejection_reason: rejectionReason.trim() }
            : d
        )
      );

      setValidateOpen(false);
      setSelectedDeposit(null);
      setRejectionReason("");
      setShowRejectReason(false);
      fetchDeposits();
    } catch {
      toast.error("Gagal menolak setoran");
    } finally {
      setValidating(false);
    }
  };

  const openValidateModal = (deposit: WasteDeposit) => {
    setSelectedDeposit(deposit);
    setShowRejectReason(false);
    setRejectionReason("");
    setValidateOpen(true);
  };

  const previewPoints = selectedDeposit
    ? calculatePoints(selectedDeposit.weight_kg, selectedDeposit.waste_type)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Validasi Setoran</h1>
          <Badge variant="success" className="text-sm px-3 py-1">
            {pendingCount} pending
          </Badge>
        </div>
        <Button
          onClick={exportDepositsXlsx}
          disabled={exporting}
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export (.xlsx)
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="validated">Tervalidasi</TabsTrigger>
            <TabsTrigger value="rejected">Ditolak</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama anggota..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Pilih waktu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hari ini</SelectItem>
            <SelectItem value="7days">7 Hari</SelectItem>
            <SelectItem value="30days">30 Hari</SelectItem>
            <SelectItem value="all">Semua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Jenis Sampah</TableHead>
                  <TableHead>Berat Diinput</TableHead>
                  <TableHead>Berat Aktual</TableHead>
                  <TableHead>Poin</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      Tidak ada data setoran
                    </TableCell>
                  </TableRow>
                ) : (
                  deposits.map((deposit, idx) => (
                    <TableRow key={deposit.id} className={deposit.status === "pending" ? "bg-yellow-50/30" : ""}>
                      <TableCell className="text-muted-foreground">
                        {String((page - 1) * 10 + idx + 1).padStart(2, "0")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{deposit.user_name}</p>
                          <p className="text-xs text-muted-foreground">ID-{deposit.account_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getWasteCategory(deposit.waste_type) === "organik" ? "success" :
                              getWasteCategory(deposit.waste_type) === "b3" ? "danger" : "info"
                          }
                        >
                          {deposit.waste_label || getWasteTypeLabel(deposit.waste_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{deposit.weight_kg} kg</TableCell>
                      <TableCell>
                        {deposit.status === "validated" ? `${deposit.weight_kg} kg` : "-"}
                      </TableCell>
                      <TableCell>
                        {deposit.points_earned > 0 ? (
                          <span className="text-green-600 font-semibold">{deposit.points_earned} pts</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {deposit.created_at ? formatRelativeTime(deposit.created_at) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            deposit.status === "pending"
                              ? "warning"
                              : deposit.status === "rejected"
                                ? "danger"
                                : "success"
                          }
                        >
                          {deposit.status === "pending"
                            ? "● Pending"
                            : deposit.status === "rejected"
                              ? "● Ditolak"
                              : "● Tervalidasi"}
                        </Badge>
                        {deposit.status === "rejected" && deposit.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1 max-w-[150px] truncate" title={deposit.rejection_reason}>
                            Ket: {deposit.rejection_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {deposit.status === "pending" ? (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => openValidateModal(deposit)}
                          >
                            Validasi
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">⋮</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Menampilkan {deposits.length} dari {total} data</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            ‹
          </Button>
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
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            ›
          </Button>
        </div>
      </div>

      {/* Validation Modal */}
      <Dialog open={validateOpen} onOpenChange={setValidateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Validasi Setoran Sampah</DialogTitle>
            <DialogDescription>Verifikasi setoran sampah anggota</DialogDescription>
          </DialogHeader>

          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Anggota</p>
                  <p className="font-semibold mt-1">{selectedDeposit.user_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Berat Setoran</p>
                  <p className="font-semibold mt-1">{selectedDeposit.weight_kg} kg</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase font-medium">Jenis Sampah</p>
                <p className="font-semibold mt-1">
                  {getWasteTypeLabel(selectedDeposit.waste_type)} ({getWasteCategory(selectedDeposit.waste_type)})
                </p>
              </div>

              {!showRejectReason ? (
                previewPoints > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <span className="text-green-600 text-lg">⭐</span>
                    <p className="text-sm">
                      Poin yang akan diberikan:{" "}
                      <span className="font-bold text-lg text-green-700">{formatNumber(previewPoints)} poin</span>
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="rejection_reason" className="text-red-700 font-semibold">Alasan Penolakan</Label>
                  <Textarea
                    id="rejection_reason"
                    placeholder="Masukkan alasan penolakan (misal: sampah kotor, basah, tidak sesuai jenis)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="border-red-200 focus-visible:ring-red-500"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {!showRejectReason ? (
              <>
                <Button variant="outline" onClick={() => setValidateOpen(false)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectReason(true)}
                  disabled={validating}
                >
                  Tolak
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleValidate}
                  disabled={validating}
                >
                  {validating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Konfirmasi Validasi"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setShowRejectReason(false); setRejectionReason(""); }} disabled={validating}>
                  Kembali
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={validating || !rejectionReason.trim()}
                >
                  {validating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Tolak Setoran"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}