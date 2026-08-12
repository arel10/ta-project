"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users, ClipboardCheck, AlertTriangle, Coins,
  TrendingUp, ArrowRight, UserX, UserCheck,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";

import api from "@/lib/axios";
import { useAuthContext } from "@/components/providers/auth-provider";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime, getWasteTypeLabel, getWasteCategory, formatNumber } from "@/lib/utils";
import type { DashboardKPIs, DepositTrend, WasteDeposit, ChurnUser } from "@/types";

const CHURN_COLORS = {
  churn: "#dc2626",      // Red
  not_churn: "#16a34a",  // Green
};

function formatRecencyLabel(days?: number | null): string {
  const safeDays = Math.max(0, days ?? 0);
  if (safeDays === 0) {
    return "Hari ini";
  }
  return `${safeDays} hari lalu`;
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [trend, setTrend] = useState<DepositTrend[]>([]);
  const [churnDist, setChurnDist] = useState({ churn: 0, not_churn: 0 });
  const [pendingDeposits, setPendingDeposits] = useState<WasteDeposit[]>([]);
  const [churnUsers, setChurnUsers] = useState<ChurnUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [kpiRes, trendRes, churnRes, pendingRes, churnSummaryRes] = await Promise.all([
        api.get("/admin/dashboard/kpis"),
        api.get("/admin/dashboard/trend?days=180"),
        api.get("/admin/dashboard/churn-distribution"),
        api.get("/admin/dashboard/recent-pending"),
        api.get("/ml/churn-summary"),
      ]);

      setKpis(kpiRes.data.data);
      setTrend(trendRes.data.data || []);
      setChurnDist(churnRes.data.data || { churn: 0, not_churn: 0 });
      setPendingDeposits(pendingRes.data.data || []);

      const summary = churnSummaryRes.data;
      const usersList = summary.churn_users || summary.high_risk_users || [];
      setChurnUsers(usersList.slice(0, 5));
    } catch {
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Auto-refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  const pieData = [
    { name: "Potensi Churn", value: churnDist.churn, color: CHURN_COLORS.churn },
    { name: "Aktif (Tidak Churn)", value: churnDist.not_churn, color: CHURN_COLORS.not_churn },
  ];

  const totalMembersAnalyzed = churnDist.churn + churnDist.not_churn;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Skeleton className="lg:col-span-3 h-80 rounded-xl" />
          <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const churnCountValue = kpis?.churn_count ?? kpis?.high_risk_count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">
          Selamat datang, {user?.name || "Admin"}. Berikut adalah ringkasan operasional dan analisis prediksi churn.
        </p>
      </div>

      {/* SECTION 1: Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Anggota"
          value={kpis?.total_members || 0}
          trend={`+${kpis?.active_members_this_month || 0} aktif bulan ini`}
          trendType="up"
          variant="blue"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Setoran Hari Ini"
          value={kpis?.total_deposits_today || 0}
          trend={`Total ${kpis?.total_weight_kg || 0} kg`}
          trendType="up"
          variant="green"
        />
        <StatCard
          icon={UserX}
          label="Potensi Churn (60 Hari)"
          value={churnCountValue}
          trend="Perlu Intervensi"
          trendType="down"
          variant="red"
        />
        <StatCard
          icon={Coins}
          label="Total Poin Tersebar"
          value={kpis?.total_points_distributed || 0}
          trend="Total Poin Ditukar"
          trendType="neutral"
          variant="green"
        />
      </div>

      {/* SECTION 2: Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Line Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg">Tren Berat Setoran Tervalidasi (6 Bulan)</CardTitle>
              <CardDescription>Akumulasi berat setoran tervalidasi per hari, dalam kilogram</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "short" })}`;
                  }}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}kg`}
                />
                <RechartsTooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                />
                <Line
                  type="monotone"
                  dataKey="total_weight_kg"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "#16a34a" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Distribusi Prediksi Churn</CardTitle>
            <CardDescription>Prediksi partisipasi anggota 60 hari ke depan (Random Forest)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center -mt-28 mb-16">
                <p className="text-3xl font-bold">{formatNumber(totalMembersAnalyzed)}</p>
                <p className="text-xs text-green-600 font-medium uppercase">Anggota</p>
              </div>
              <div className="w-full space-y-2 mt-2">
                {[
                  {
                    label: "Potensi Churn",
                    value: churnDist.churn,
                    color: "bg-red-500",
                    pct: totalMembersAnalyzed ? ((churnDist.churn / totalMembersAnalyzed) * 100).toFixed(1) : 0,
                  },
                  {
                    label: "Aktif (Tidak Churn)",
                    value: churnDist.not_churn,
                    color: "bg-green-500",
                    pct: totalMembersAnalyzed ? ((churnDist.not_churn / totalMembersAnalyzed) * 100).toFixed(1) : 0,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.pct}% ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: Two tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Deposits Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Setoran Pending</CardTitle>
            <Link href="/dashboard/deposits" className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Jenis Sampah</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDeposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Tidak ada setoran pending
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingDeposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell className="font-medium">{deposit.user_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getWasteCategory(deposit.waste_type) === "organik" ? "success" :
                              getWasteCategory(deposit.waste_type) === "b3" ? "danger" : "info"
                          }
                        >
                          {getWasteTypeLabel(deposit.waste_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {deposit.created_at ? formatRelativeTime(deposit.created_at) : "-"}
                      </TableCell>
                      <TableCell>
                        <Link href="/dashboard/deposits">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            Validasi
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Churn Members Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Anggota Berpotensi Churn</CardTitle>
            <Link href="/dashboard/risk" className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1">
              Monitor Churn <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Setoran Terakhir</TableHead>
                  <TableHead>Probabilitas Churn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {churnUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Tidak ada anggota berpotensi churn
                    </TableCell>
                  </TableRow>
                ) : (
                  churnUsers.map((member) => {
                    const prob = member.churn_probability !== undefined && member.churn_probability !== null
                      ? Math.round(member.churn_probability * 100)
                      : null;
                    return (
                      <TableRow key={member.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-semibold">
                              {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-medium block">{member.name}</span>
                              <span className="text-xs text-muted-foreground">{member.account_number}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRecencyLabel(member.recency_days)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="danger" className="text-xs font-semibold">
                            {prob !== null ? `${prob}% Churn` : "Potensi Churn"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
