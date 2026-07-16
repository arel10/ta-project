"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users, ClipboardCheck, AlertTriangle, Coins,
  TrendingUp, ArrowRight,
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
import type { DashboardKPIs, DepositTrend, WasteDeposit } from "@/types";

const RISK_COLORS = { low: "#16a34a", medium: "#eab308", high: "#dc2626" };

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
  const [riskDist, setRiskDist] = useState({ low: 0, medium: 0, high: 0 });
  const [pendingDeposits, setPendingDeposits] = useState<WasteDeposit[]>([]);
  const [highRiskUsers, setHighRiskUsers] = useState<Array<{
    user_id: number; name: string; account_number: string;
    recency_days: number; risk_level: string; predicted_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [kpiRes, trendRes, riskRes, pendingRes, riskSummaryRes] = await Promise.all([
        api.get("/admin/dashboard/kpis"),
        api.get("/admin/dashboard/trend?days=30"),
        api.get("/admin/dashboard/risk-distribution"),
        api.get("/admin/dashboard/recent-pending"),
        api.get("/ml/risk-summary"),
      ]);

      setKpis(kpiRes.data.data);
      setTrend(trendRes.data.data || []);
      setRiskDist(riskRes.data.data || { low: 0, medium: 0, high: 0 });
      setPendingDeposits(pendingRes.data.data || []);

      const summary = riskSummaryRes.data;
      setHighRiskUsers(summary.high_risk_users?.slice(0, 5) || []);
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
    { name: "Low Risk", value: riskDist.low, color: RISK_COLORS.low },
    { name: "Medium Risk", value: riskDist.medium, color: RISK_COLORS.medium },
    { name: "High Risk", value: riskDist.high, color: RISK_COLORS.high },
  ];

  const totalRisk = riskDist.low + riskDist.medium + riskDist.high;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {user?.name || "Admin"}. Berikut adalah ringkasan pengelolaan sampah hari ini.
        </p>
      </div>

      {/* SECTION 1: Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Anggota"
          value={kpis?.total_members || 0}
          trend={`+${kpis?.active_members_this_month || 0} minggu ini`}
          trendType="up"
          variant="blue"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Setoran Hari Ini"
          value={kpis?.total_deposits_today || 0}
          trend={`+${kpis?.total_deposits_today || 0} dari kemarin`}
          trendType="up"
          variant="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Anggota High Risk"
          value={kpis?.high_risk_count || 0}
          trend="Perlu Tindakan"
          trendType="down"
          variant="red"
        />
        <StatCard
          icon={Coins}
          label="Total Poin Tersebar"
          value={kpis?.total_points_distributed || 0}
          trend="Total Terbit"
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
              <CardTitle className="text-lg">Tren Berat Setoran Tervalidasi 30 Hari</CardTitle>
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
            <CardTitle className="text-lg">Distribusi Risiko</CardTitle>
            <CardDescription>Berdasarkan kepatuhan pemilahan</CardDescription>
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
                <p className="text-3xl font-bold">{formatNumber(totalRisk)}</p>
                <p className="text-xs text-green-600 font-medium uppercase">Anggota</p>
              </div>
              <div className="w-full space-y-2 mt-2">
                {[
                  { label: "Low Risk", value: riskDist.low, color: "bg-green-500", pct: totalRisk ? ((riskDist.low / totalRisk) * 100).toFixed(0) : 0 },
                  { label: "Medium Risk", value: riskDist.medium, color: "bg-yellow-500", pct: totalRisk ? ((riskDist.medium / totalRisk) * 100).toFixed(0) : 0 },
                  { label: "High Risk", value: riskDist.high, color: "bg-red-500", pct: totalRisk ? ((riskDist.high / totalRisk) * 100).toFixed(0) : 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.pct}%</span>
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

        {/* High Risk Members Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Anggota High Risk</CardTitle>
            <Link href="/dashboard/risk" className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1">
              Monitor Semua <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Setoran Terakhir</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highRiskUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Tidak ada anggota high risk
                    </TableCell>
                  </TableRow>
                ) : (
                  highRiskUsers.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-semibold">
                            {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRecencyLabel(member.recency_days)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="danger" className="text-xs">
                          High Risk
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
