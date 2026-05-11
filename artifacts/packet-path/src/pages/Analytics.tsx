import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Clock, AlertCircle, CheckCircle, RefreshCw, FileText, PenTool } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from "recharts";

interface TimeToComplete {
  examType: string;
  avgHours: number;
  minHours: number;
  maxHours: number;
  count: number;
}

interface SignatureFunnel {
  total: number;
  sent: number;
  viewed: number;
  signed: number;
  completed: number;
  voided: number;
  declined: number;
}

interface TrendPoint {
  date: string;
  casesCompleted: number;
  signaturesCompleted: number;
}

interface Bottleneck {
  id: number;
  patientName?: string;
  title?: string;
  status?: string;
  examType?: string;
  stuckForDays: number;
  createdAt: string;
}

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626"];

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [timeToComplete, setTimeToComplete] = useState<TimeToComplete[]>([]);
  const [funnel, setFunnel] = useState<SignatureFunnel | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [bottlenecks, setBottlenecks] = useState<{ stuckCases: Bottleneck[]; stuckSignatures: Bottleneck[]; thresholdDays: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(30);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    const [ttcRes, funnelRes, trendRes, bottleneckRes] = await Promise.all([
      fetch("/api/analytics/time-to-complete", { headers }),
      fetch("/api/analytics/signature-funnel", { headers }),
      fetch(`/api/analytics/completion-trend?days=${trendDays}`, { headers }),
      fetch("/api/analytics/bottlenecks", { headers }),
    ]);
    if (ttcRes.ok) setTimeToComplete(await ttcRes.json());
    if (funnelRes.ok) setFunnel(await funnelRes.json());
    if (trendRes.ok) setTrend(await trendRes.json());
    if (bottleneckRes.ok) setBottlenecks(await bottleneckRes.json());
    setLoading(false);
  }, [token, trendDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const funnelData = funnel ? [
    { name: "Total Created", value: funnel.total, color: "#64748b" },
    { name: "Sent to Signers", value: funnel.sent, color: "#2563eb" },
    { name: "Viewed by Signers", value: funnel.viewed, color: "#7c3aed" },
    { name: "Signatures Collected", value: funnel.signed, color: "#059669" },
    { name: "Fully Completed", value: funnel.completed, color: "#10b981" },
  ] : [];

  const completionRate = funnel && funnel.sent > 0
    ? Math.round((funnel.completed / funnel.sent) * 100)
    : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <BarChart2 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Analytics & Insights</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Workflow performance · Bottleneck detection · Completion trends</p>
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Completion Rate",
              value: `${completionRate}%`,
              sub: "Sent → Completed",
              icon: CheckCircle,
              gradient: "from-emerald-500 to-teal-600",
            },
            {
              label: "Total Packets",
              value: funnel?.total ?? 0,
              sub: `${funnel?.voided ?? 0} voided`,
              icon: FileText,
              gradient: "from-blue-500 to-indigo-600",
            },
            {
              label: "Declined",
              value: funnel?.declined ?? 0,
              sub: "Recipient declines",
              icon: AlertCircle,
              gradient: "from-red-500 to-rose-600",
            },
            {
              label: "Stuck Cases",
              value: (bottlenecks?.stuckCases?.length ?? 0) + (bottlenecks?.stuckSignatures?.length ?? 0),
              sub: `>${bottlenecks?.thresholdDays ?? 3} days inactive`,
              icon: Clock,
              gradient: "from-amber-500 to-orange-500",
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.label}</p>
                  <p className="text-foreground text-2xl font-semibold mt-1.5 tracking-tight">{card.value}</p>
                  {card.sub && <p className="text-muted-foreground text-xs mt-1">{card.sub}</p>}
                </div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", card.gradient)}>
                  <card.icon size={18} className="text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Time to Complete by Exam Type */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <Clock size={15} className="text-primary" /> Avg. Time to Complete (Hours)
            </h2>
            {loading ? (
              <div className="h-48 bg-muted/30 rounded-xl animate-pulse" />
            ) : timeToComplete.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No submitted cases yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={timeToComplete} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="examType" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: any) => [`${v}h`, "Avg Hours"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="avgHours" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Signature Funnel */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <PenTool size={15} className="text-primary" /> Signature Funnel
            </h2>
            {loading ? (
              <div className="h-48 bg-muted/30 rounded-xl animate-pulse" />
            ) : (
              <div className="space-y-2">
                {funnelData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-36 shrink-0">{item.name}</span>
                    <div className="flex-1 bg-muted/30 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: funnelData[0].value > 0 ? `${(item.value / funnelData[0].value) * 100}%` : "0%",
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-8 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Completion Trend */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <TrendingUp size={15} className="text-primary" /> Completion Trend
            </h2>
            <select
              value={trendDays}
              onChange={e => setTrendDays(Number(e.target.value))}
              className="text-xs px-2 py-1 rounded-lg border border-border bg-background text-foreground"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          {loading ? (
            <div className="h-48 bg-muted/30 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="casesCompleted" stroke="#2563eb" strokeWidth={2} dot={false} name="Cases Submitted" />
                <Line type="monotone" dataKey="signaturesCompleted" stroke="#7c3aed" strokeWidth={2} dot={false} name="Packets Signed" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottlenecks */}
        {bottlenecks && (bottlenecks.stuckCases.length > 0 || bottlenecks.stuckSignatures.length > 0) && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-500" />
                Bottlenecks — Items Inactive for {bottlenecks.thresholdDays}+ Days
              </h2>
            </div>
            <div className="divide-y divide-border">
              {bottlenecks.stuckCases.map(c => (
                <div key={`case-${c.id}`} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.patientName}</p>
                    <p className="text-xs text-muted-foreground">{c.examType} · {c.status}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {c.stuckForDays}d stuck
                  </span>
                </div>
              ))}
              {bottlenecks.stuckSignatures.map(s => (
                <div key={`sig-${s.id}`} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">Signature request · Awaiting signers</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {s.stuckForDays}d stuck
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
