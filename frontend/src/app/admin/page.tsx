"use client";

import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, Bell, BrainCircuit, Clock, RefreshCw,
  Send, ShieldCheck, TrendingUp, Users, Zap, BarChart3, Timer,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label, unit = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-dark px-4 py-3 rounded-xl border border-white/10 text-xs shadow-2xl min-w-[140px]">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.stroke || p.fill }} />
            <span className="text-gray-400">{p.name}</span>
          </span>
          <span className="text-white font-bold">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat card ───────────────────────────────────────────────────────────────
function KPICard({ title, value, sub, icon, color, delta }: {
  title: string; value: string | number; sub: string;
  icon: React.ReactNode; color: string; delta?: string;
}) {
  return (
    <Card className="glass-card stat-card border border-white/7 rounded-2xl overflow-hidden">
      <CardContent className="p-5 relative">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 ${color}`} />
        <div className="flex items-start justify-between mb-4 relative">
          <div className="p-2.5 rounded-xl bg-white/5">{icon}</div>
          {delta && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
              {delta}
            </span>
          )}
        </div>
        <div className="text-3xl font-black text-white tracking-tight mb-0.5 relative">{value}</div>
        <div className="text-sm font-semibold text-gray-400">{title}</div>
        <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}

// ─── Zone colors ─────────────────────────────────────────────────────────────
const ZONE_COLORS: Record<string, string> = {
  "Entry Gate":    "#7c3aed",
  "Main Stage":    "#06b6d4",
  "Food Court":    "#f59e0b",
  "Entertainment": "#10b981",
  "Restrooms":     "#6366f1",
  "VIP Lounge":    "#ec4899",
  "Exit Gate":     "#ef4444",
};

const SECTOR_ZONES: Record<string, string> = {
  A1: "Entry Gate", A2: "Entry Gate", A3: "Main Stage",  A4: "Main Stage",
  B1: "Food Court", B2: "Food Court", B3: "Entertainment", B4: "Entertainment",
  C1: "Restrooms",  C2: "Restrooms",  C3: "VIP Lounge",   C4: "Exit Gate",
};

// ─── Peak Data types ──────────────────────────────────────────────────────────
type PeakHour = {
  hour: string;
  expected: number;
  actual: number | null;
};

// Simulated peak-time data (deterministic — same shape each render)
const PEAK_DATA: PeakHour[] = [
  { hour: "06:00", expected: 15, actual: null },
  { hour: "08:00", expected: 28, actual: null },
  { hour: "10:00", expected: 45, actual: null },
  { hour: "12:00", expected: 65, actual: null },
  { hour: "13:00", expected: 80, actual: null },
  { hour: "14:00", expected: 88, actual: null },
  { hour: "15:00", expected: 92, actual: null },
  { hour: "16:00", expected: 87, actual: null },
  { hour: "18:00", expected: 78, actual: null },
  { hour: "20:00", expected: 60, actual: null },
  { hour: "21:00", expected: 45, actual: null },
  { hour: "23:00", expected: 20, actual: null },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { totalCrowd, heatmap, queues, socket, risk } = useSocket();
  const router = useRouter();
  const [alertText, setAlertText] = useState("");
  const [alertLog, setAlertLog] = useState<{ msg: string; time: string }[]>([]);

  // Rolling time-series history
  const [densityHistory, setDensityHistory] = useState<{ time: string; crowd: number }[]>([]);
  const histRef = useRef<{ time: string; crowd: number }[]>([]);

  // Zone bar chart data
  const [zoneData, setZoneData] = useState<{ zone: string; density: number; color: string }[]>([]);

  // Queue history for "avg wait time" chart
  const [queueHistory, setQueueHistory] = useState<{ time: string; [k: string]: string | number }[]>([]);
  const queueHistRef = useRef<typeof queueHistory>([]);

  // Peak data with live actuals patched in
  const [peakData, setPeakData] = useState(PEAK_DATA);

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) router.push("/dashboard");
  }, [user, isLoading, router]);

  // Update charts whenever socket data changes
  useEffect(() => {
    if (totalCrowd === 0) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // Density history
    const newPt = { time: now, crowd: totalCrowd };
    const updated = [...histRef.current, newPt].slice(-20);
    histRef.current = updated;
    setDensityHistory([...updated]);

    // Peak data: patch "actual" for the closest hour bucket
    const h = new Date().getHours();
    const hStr = `${String(h).padStart(2, "0")}:00`;
    setPeakData(prev => prev.map(p => {
      const ph = parseInt(p.hour);
      if (Math.abs(ph - h) <= 1) return { ...p, actual: Math.round(totalCrowd / 15) };
      return p;
    }));
  }, [totalCrowd]);

  useEffect(() => {
    if (!heatmap || Object.keys(heatmap).length === 0) return;

    // Aggregate zones
    const zoneMap: Record<string, number[]> = {};
    Object.entries(heatmap).forEach(([s, d]) => {
      const z = SECTOR_ZONES[s] || "Other";
      if (!zoneMap[z]) zoneMap[z] = [];
      zoneMap[z].push(d);
    });
    const zones = Object.entries(zoneMap).map(([zone, vals]) => ({
      zone,
      density: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      color: ZONE_COLORS[zone] || "#6b7280",
    })).sort((a, b) => b.density - a.density);
    setZoneData(zones);
  }, [heatmap]);

  useEffect(() => {
    if (!queues || queues.length === 0) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const pt: any = { time: now };
    queues.forEach(q => { pt[q.name] = q.waitTime; });
    const updated = [...queueHistRef.current, pt].slice(-15);
    queueHistRef.current = updated;
    setQueueHistory([...updated]);
  }, [queues]);

  const sendAlert = useCallback(() => {
    if (!alertText.trim() || !socket) return;
    socket.emit("push_alert", alertText);
    toast.success("Alert broadcasted to all users");
    setAlertLog(prev => [{ msg: alertText, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
    setAlertText("");
  }, [alertText, socket]);

  const avgWait = queues.length ? Math.round(queues.reduce((a, q) => a + q.waitTime, 0) / queues.length) : 0;
  const maxQueue = queues.length ? queues.reduce((a, b) => a.waitTime > b.waitTime ? a : b, queues[0]) : null;

  const riskColors = {
    normal:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    warning:  "text-amber-400  bg-amber-500/10  border-amber-500/20",
    critical: "text-red-400    bg-red-500/10    border-red-500/20",
  };
  const riskLabel = { normal: "Normal", warning: "Elevated", critical: "Critical" };

  const queueNames = queues.map(q => q.name);
  const queuePalette = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

  if (isLoading) return (
    <div className="flex min-h-screen bg-[#080b14]">
      <div className="w-64 bg-[#0a0d16] border-r border-white/5" />
      <div className="flex-1 p-8 space-y-6">
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />)}
      </div>
    </div>
  );
  if (!user?.isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-[#080b14]">
      <Sidebar />
      <div className="flex-1 ml-64">

        {/* Top Bar */}
        <div className="sticky top-0 z-20 glass-dark border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-white font-bold text-xl tracking-tight">Admin Analytics</h1>
              <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs">
                Admin Only
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">Real-time crowd analytics & broadcast center</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border font-semibold ${riskColors[risk]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Risk: {riskLabel[risk]}
            </span>
            <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Live Telemetry
            </span>
          </div>
        </div>

        <div className="p-8 space-y-8">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
            <KPICard
              title="Total Occupancy"
              value={totalCrowd.toLocaleString()}
              sub="Tracked entities right now"
              icon={<Users className="w-5 h-5 text-violet-400" />}
              color="bg-violet-500"
              delta="+12% vs avg"
            />
            <KPICard
              title="Avg Queue Wait"
              value={`${avgWait} min`}
              sub="Across all facilities"
              icon={<Timer className="w-5 h-5 text-amber-400" />}
              color="bg-amber-500"
              delta={avgWait > 20 ? "⚠ High" : "✓ Normal"}
            />
            <KPICard
              title="High-Risk Sectors"
              value={Object.values(heatmap).filter(v => v > 75).length}
              sub="Above 75% density threshold"
              icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
              color="bg-red-500"
            />
            <KPICard
              title="Busiest Facility"
              value={maxQueue?.name || "—"}
              sub={maxQueue ? `${maxQueue.waitTime} min wait` : "Calculating…"}
              icon={<Zap className="w-5 h-5 text-cyan-400" />}
              color="bg-cyan-500"
            />
          </div>

          {/* Row 1: Occupancy Flow + Zone Comparison */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* ── Live Occupancy Flow ───────────────────────────── */}
            <Card className="glass-card border border-white/7 rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  Live Crowd Density Flow
                  <span className="ml-auto text-[10px] text-gray-600 font-normal">Last 20 readings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <div className="h-[260px]">
                  {densityHistory.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={densityHistory}>
                        <defs>
                          <linearGradient id="crowdGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<GlassTooltip unit=" entities" />} />
                        <Area type="monotone" dataKey="crowd" name="Occupancy" stroke="#7c3aed" strokeWidth={2.5} fill="url(#crowdGrad)" dot={false} activeDot={{ r: 5, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 text-sm gap-2">
                      <Activity className="w-5 h-5 animate-pulse" /> Collecting telemetry…
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Zone-wise Traffic Comparison ──────────────────── */}
            <Card className="glass-card border border-white/7 rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Zone-wise Traffic Density
                  <span className="ml-auto text-[10px] text-gray-600 font-normal">% capacity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <div className="h-[260px]">
                  {zoneData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={zoneData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                        <YAxis type="category" dataKey="zone" tick={{ fill: "#9ca3af", fontSize: 11 }} width={100} tickLine={false} axisLine={false} />
                        <Tooltip content={<GlassTooltip unit="%" />} />
                        <ReferenceLine x={75} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "75% limit", fill: "#ef4444", fontSize: 10, position: "right" }} />
                        <Bar dataKey="density" name="Density" radius={[0, 6, 6, 0]} maxBarSize={28}>
                          {zoneData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} fillOpacity={entry.density > 75 ? 0.9 : 0.65} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 text-sm gap-2">
                      <BarChart3 className="w-5 h-5 animate-pulse" /> Processing zone data…
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Peak Time Prediction + Queue Wait Trends */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* ── Peak Time Prediction ──────────────────────────── */}
            <Card className="glass-card border border-white/7 rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Peak Time Prediction
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-px bg-violet-500 inline-block" />Expected</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-px bg-cyan-400 inline-block border-dashed border-b border-cyan-400" />Actual</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">Based on historical patterns & current data</p>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={peakData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip content={<GlassTooltip unit="%" />} />
                      <ReferenceLine y={80} stroke="#ef444480" strokeDasharray="4 3" label={{ value: "Peak threshold", fill: "#ef4444", fontSize: 10, position: "right" }} />
                      <Line type="monotone" dataKey="expected" name="Expected" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="actual" name="Actual" stroke="#06b6d4" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Peak insights strip */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Predicted Peak", value: "3:00 PM", color: "text-violet-400" },
                    { label: "Avg Intensity", value: "67%", color: "text-amber-400" },
                    { label: "Crowd Recedes", value: "9:00 PM", color: "text-emerald-400" },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2.5 rounded-xl bg-white/3 border border-white/5">
                      <div className={`font-black text-base ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Average Queue Wait Times ──────────────────────── */}
            <Card className="glass-card border border-white/7 rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Queue Wait Trends (per facility)
                  <span className="ml-auto text-[10px] text-gray-600 font-normal">minutes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <div className="h-[260px]">
                  {queueHistory.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={queueHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} unit="m" />
                        <Tooltip content={<GlassTooltip unit=" min" />} />
                        <Legend
                          iconType="circle"
                          iconSize={7}
                          formatter={(v) => <span style={{ color: "#9ca3af", fontSize: "11px" }}>{v}</span>}
                        />
                        {queueNames.map((name, i) => (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={queuePalette[i % queuePalette.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 text-sm gap-2">
                      <Timer className="w-5 h-5 animate-pulse" /> Warming up queue monitor…
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Current Queue Metrics table + Alert panel */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Queue Metrics Table ───────────────────────────── */}
            <Card className="xl:col-span-2 glass-card border border-white/7 rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-fuchsia-400" />
                  Facility Wait Time Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-5 text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 pb-1 border-b border-white/5">
                    <span className="col-span-2">Facility</span>
                    <span>Zone</span>
                    <span>Wait</span>
                    <span>Status</span>
                  </div>
                  {queues.length > 0 ? queues.map((q, i) => {
                    const isHigh = q.waitTime > 30;
                    const isMed  = q.waitTime > 10;
                    const pct    = Math.min((q.waitTime / 50) * 100, 100);
                    return (
                      <motion.div
                        key={q.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="grid grid-cols-5 items-center gap-2 px-2 py-3 rounded-xl hover:bg-white/3 transition-colors"
                      >
                        <span className="col-span-2 text-sm font-semibold text-gray-200">{q.name}</span>
                        <span className="text-xs text-gray-500">{q.zone}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden max-w-[60px]">
                            <div className={`h-full rounded-full transition-all duration-700 ${isHigh ? "bg-red-500" : isMed ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${isHigh ? "text-red-400" : isMed ? "text-amber-400" : "text-emerald-400"}`}>
                            {q.waitTime}m
                          </span>
                        </div>
                        <Badge className={`text-[10px] border w-fit ${isHigh ? "text-red-400 bg-red-500/10 border-red-500/30" : isMed ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"}`}>
                          {isHigh ? "Congested" : isMed ? "Moderate" : "Clear"}
                        </Badge>
                      </motion.div>
                    );
                  }) : Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-xl bg-white/5" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Emergency Broadcast ──────────────────────────── */}
            <Card className="glass-card border border-red-500/20 bg-red-950/5 rounded-2xl flex flex-col">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="text-red-400 flex items-center gap-3 text-base">
                  <div className="p-2 rounded-xl bg-red-500/15"><Bell className="w-4 h-4" /></div>
                  Emergency Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 flex-1 flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    value={alertText}
                    onChange={e => setAlertText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendAlert()}
                    placeholder="Type alert message…"
                    className="bg-black/30 border-red-500/20 text-white placeholder:text-gray-600 focus:border-red-500/50 rounded-xl text-sm"
                  />
                  <Button
                    onClick={sendAlert}
                    disabled={!alertText.trim()}
                    className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 gap-1.5 font-semibold disabled:opacity-40 flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {alertLog.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-gray-600 gap-2">
                      <Bell className="w-6 h-6" />
                      <p className="text-xs text-center">No alerts broadcasted yet</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {alertLog.map((a, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 p-3 rounded-xl bg-white/3 border border-white/5 text-xs"
                        >
                          <Bell className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 flex-1 leading-relaxed">{a.msg}</span>
                          <span className="text-gray-600 flex-shrink-0">{a.time}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
