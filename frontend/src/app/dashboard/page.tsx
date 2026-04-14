"use client";

import { useSocket, type Insight } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle, AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2,
  Clock, Info, Navigation2, RefreshCw, TrendingDown, TrendingUp, Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip
} from "recharts";

// ─── Sector grid ────────────────────────────────────────────────────────────
const SECTORS = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];

const getHeatStyle = (density: number) => {
  if (density > 75) return {
    bg: "bg-red-500/20", border: "border-red-500/50",
    shadow: "shadow-[0_0_20px_rgba(239,68,68,0.25)]",
    text: "text-red-300", dot: "bg-red-500", pulse: true,
    badge: "text-red-400 bg-red-500/10 border-red-500/20", label: "HIGH",
  };
  if (density > 45) return {
    bg: "bg-amber-500/15", border: "border-amber-500/40",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    text: "text-amber-300", dot: "bg-amber-500", pulse: false,
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "MED",
  };
  return {
    bg: "bg-emerald-500/10", border: "border-emerald-500/30",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    text: "text-emerald-300", dot: "bg-emerald-500", pulse: false,
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "LOW",
  };
};

// ─── Insight panel ──────────────────────────────────────────────────────────
const INSIGHT_STYLES = {
  critical: { icon: <AlertCircle className="w-4 h-4 text-red-400" />, bg: "bg-red-500/8", border: "border-red-500/20", text: "text-red-200" },
  warning:  { icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, bg: "bg-amber-500/8", border: "border-amber-500/20", text: "text-amber-200" },
  info:     { icon: <Info className="w-4 h-4 text-cyan-400" />, bg: "bg-cyan-500/8", border: "border-cyan-500/20", text: "text-cyan-200" },
  success:  { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, bg: "bg-emerald-500/8", border: "border-emerald-500/20", text: "text-emerald-200" },
};

function InsightCard({ insight }: { insight: Insight }) {
  const style = INSIGHT_STYLES[insight.level];
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3.5 rounded-xl border ${style.bg} ${style.border}`}
    >
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <p className={`text-sm leading-relaxed ${style.text}`}>{insight.message}</p>
    </motion.div>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, sub, trend }: {
  title: string; value: string | number; icon: React.ReactNode; sub?: string; trend?: "up" | "down";
}) {
  return (
    <Card className="glass-card stat-card border border-white/7 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-white/5">{icon}</div>
          {trend === "up"   && <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3" />↑</span>}
          {trend === "down" && <span className="flex items-center gap-1 text-red-400 text-xs font-semibold bg-red-500/10 px-2 py-1 rounded-full"><TrendingDown className="w-3 h-3" />↓</span>}
        </div>
        <div className="text-3xl font-black text-white tracking-tight mb-0.5">{value}</div>
        <div className="text-sm font-semibold text-gray-400">{title}</div>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { heatmap, predictions, queues, insights, bestPath, liveAlert, totalCrowd, risk, timeMul, isConnected } = useSocket();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const ready = isConnected && Object.keys(heatmap).length > 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#080b14]">
        <div className="w-64 bg-[#0a0d16] border-r border-white/5" />
        <div className="flex-1 p-8 space-y-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />)}
        </div>
      </div>
    );
  }
  if (!user) return null;

  const riskColors = {
    normal:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    warning:  "text-amber-400  bg-amber-500/10  border-amber-500/20",
    critical: "text-red-400    bg-red-500/10    border-red-500/20",
  };
  const riskLabel = { normal: "Normal", warning: "Elevated", critical: "Critical" };

  // Radar chart data — current vs predicted
  const radarData = SECTORS.map(s => ({
    sector: s,
    Current: heatmap[s] || 0,
    Predicted: predictions[s] || 0,
  }));

  return (
    <div className="flex min-h-screen bg-[#080b14]">
      <Sidebar />
      <div className="flex-1 ml-64">

        {/* Top bar */}
        <div className="sticky top-0 z-20 glass-dark border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight">Live Crowd Overview</h1>
            <p className="text-gray-500 text-sm mt-0.5">AI-powered simulation • 3-second refresh</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${riskColors[risk]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Risk: {riskLabel[risk]}
            </span>
            <span className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${isConnected ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-gray-500 bg-white/5 border-white/10"}`}>
              <RefreshCw className={`w-3 h-3 ${isConnected ? "animate-spin" : ""}`} />
              {isConnected ? "Live" : "Disconnected"}
            </span>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/7">
              Activity: {timeMul}%
            </span>
          </div>
        </div>

        <div className="p-8 space-y-8">

          {/* Live Alert */}
          <AnimatePresence>
            {liveAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30"
              >
                <div className="p-2 rounded-xl bg-red-500/20"><AlertCircle className="w-5 h-5 text-red-400" /></div>
                <div className="flex-1">
                  <p className="text-red-300 font-semibold text-sm">Admin Alert</p>
                  <p className="text-red-300/70 text-sm">{liveAlert.message}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">LIVE</Badge>
                  <p className="text-gray-600 text-[10px] mt-1">{new Date(liveAlert.timestamp).toLocaleTimeString()}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard title="Total Occupancy"    value={ready ? totalCrowd.toLocaleString() : "—"} icon={<Users className="w-5 h-5 text-violet-400" />} sub="Tracked entities" trend="up" />
            <StatCard title="High-Risk Sectors"  value={ready ? Object.values(heatmap).filter(v => v > 75).length : "—"} icon={<AlertCircle className="w-5 h-5 text-red-400" />} sub="Above 75% density" trend="down" />
            <StatCard title="Avg Queue Wait"     value={ready && queues.length ? `${Math.round(queues.reduce((a, q) => a + q.waitTime, 0) / queues.length)} min` : "—"} icon={<Clock className="w-5 h-5 text-amber-400" />} sub="Across all facilities" />
            <StatCard title="Safest Route"       value={bestPath.join("→") || "—"} icon={<Navigation2 className="w-5 h-5 text-emerald-400" />} sub="Recommended path" />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Heatmap */}
            <Card className="xl:col-span-2 glass-card border border-white/7 rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    Sector Heatmap
                    <span className="text-xs font-normal text-gray-500 ml-1">• dashed = safe path</span>
                  </CardTitle>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Low</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Med</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> High</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!ready ? (
                  <div className="grid grid-cols-4 gap-3">
                    {SECTORS.map(s => <Skeleton key={s} className="aspect-square rounded-xl bg-white/5" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {SECTORS.map(sector => {
                      const density = heatmap[sector] || 0;
                      const predicted = predictions[sector] || density;
                      const style = getHeatStyle(density);
                      const isSafe = bestPath.includes(sector);
                      const trend = predicted > density + 5 ? "up" : predicted < density - 5 ? "down" : null;

                      return (
                        <motion.div
                          key={sector}
                          layout
                          transition={{ type: "spring", stiffness: 260, damping: 25 }}
                          className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative overflow-hidden cursor-default
                            ${style.bg} ${style.border} ${style.shadow}
                            ${style.pulse ? "heatmap-high" : ""}
                            transition-colors duration-700`}
                        >
                          {isSafe && (
                            <div className="absolute inset-0 border-2 border-dashed border-emerald-400/50 rounded-xl" />
                          )}
                          <span className={`text-xl font-black ${style.text}`}>{sector}</span>
                          <span className="text-[10px] font-bold text-white/50">{density}%</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-1 ${style.badge}`}>
                            {style.label}
                          </span>
                          {/* Predictive trend arrow */}
                          {trend && (
                            <div className={`absolute top-1.5 right-1.5 ${trend === "up" ? "text-red-400" : "text-emerald-400"}`}>
                              {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Heatmap footer: intensity bar */}
                <div className="mt-5 flex items-center gap-3">
                  <span className="text-[10px] text-gray-600 font-medium">LOW</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 opacity-50" />
                  <span className="text-[10px] text-gray-600 font-medium">HIGH</span>
                </div>
              </CardContent>
            </Card>

            {/* Insights panel */}
            <Card className="glass-card border border-white/7 rounded-2xl flex flex-col">
              <CardHeader className="px-6 pt-6 pb-0">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-violet-400" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 space-y-3 overflow-y-auto max-h-[420px]">
                {!ready ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />)
                ) : insights.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {insights.map((insight, i) => (
                      <InsightCard key={`${i}-${insight.message.slice(0, 20)}`} insight={insight} />
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-600 gap-2">
                    <BrainCircuit className="w-8 h-8 animate-pulse" />
                    <p className="text-sm">Analyzing patterns…</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Second row: Queue Predictions + Radar Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Queue Predictions */}
            <Card className="glass-card border border-white/7 rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-0">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Queue Predictions
                  <span className="text-[10px] text-gray-600 font-normal">M/M/1 queuing model</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {!ready
                  ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl bg-white/5" />)
                  : queues.map(q => {
                    const isHigh = q.waitTime > 30;
                    const isMed  = q.waitTime > 10;
                    const barW   = Math.min((q.waitTime / 50) * 100, 100);
                    return (
                      <motion.div key={q.name} layout className="p-4 rounded-xl bg-white/3 border border-white/6 hover:border-white/12 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-semibold text-gray-200">{q.name}</span>
                            <span className="ml-2 text-[10px] text-gray-600 font-medium">{q.zone}</span>
                          </div>
                          <Badge className={`text-xs border font-bold ${isHigh ? "text-red-400 bg-red-500/10 border-red-500/30" : isMed ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"}`}>
                            {q.waitTime} min
                          </Badge>
                        </div>
                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${isHigh ? "bg-red-500" : isMed ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${barW}%` }}
                            layout
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
              </CardContent>
            </Card>

            {/* Radar chart: Current vs 15-min prediction */}
            <Card className="glass-card border border-white/7 rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-0">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  15-Min Predictive Radar
                  <span className="text-[10px] text-gray-600 font-normal ml-auto">Current vs Forecast</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[320px]">
                  {ready ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="sector" tick={{ fill: "#6b7280", fontSize: 11 }} />
                        <Radar name="Current" dataKey="Current" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name="15-min Forecast" dataKey="Predicted" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                          itemStyle={{ color: "#e8eaf6" }}
                          formatter={(value) => [`${value}%`, ""]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-600">
                      <BrainCircuit className="w-8 h-8 animate-pulse" />
                      <p className="text-sm">Loading prediction model…</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-0.5 bg-violet-500 rounded-full inline-block" />Current density</span>
                  <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-0.5 bg-cyan-400 rounded-full inline-block border-b-2 border-dashed" />15-min forecast</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
