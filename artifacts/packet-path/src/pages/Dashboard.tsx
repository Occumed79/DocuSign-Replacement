import { useGetDashboardStats } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText, CheckCircle, Clock, AlertCircle, Plus, ArrowRight,
  PenTool, Sparkles, BellRing, Download, Eye, RefreshCw, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.ElementType }> = {
  draft:            { label: "Draft",       color: "text-slate-400",   bg: "bg-slate-400/10",  dot: "bg-slate-400",   icon: FileText },
  pending:          { label: "Pending",     color: "text-amber-400",   bg: "bg-amber-400/10",  dot: "bg-amber-400",   icon: Clock },
  partially_signed: { label: "In Progress", color: "text-[#8dbeb5]",   bg: "bg-[#8dbeb5]/10",  dot: "bg-[#8dbeb5]",   icon: Clock },
  completed:        { label: "Completed",   color: "text-emerald-400", bg: "bg-emerald-400/10",dot: "bg-emerald-400", icon: CheckCircle },
  voided:           { label: "Voided",      color: "text-red-400",     bg: "bg-red-400/10",    dot: "bg-red-400",     icon: AlertCircle },
  expired:          { label: "Expired",     color: "text-slate-500",   bg: "bg-slate-500/10",  dot: "bg-slate-500",   icon: AlertCircle },
  in_progress:      { label: "In Progress", color: "text-[#8dbeb5]",   bg: "bg-[#8dbeb5]/10",  dot: "bg-[#8dbeb5]",   icon: Clock },
  complete:         { label: "Complete",    color: "text-emerald-400", bg: "bg-emerald-400/10",dot: "bg-emerald-400", icon: CheckCircle },
  submitted:        { label: "Submitted",   color: "text-[#8dbeb5]",   bg: "bg-[#8dbeb5]/10",  dot: "bg-[#8dbeb5]",   icon: CheckCircle },
};

type SigRow = {
  id: number;
  title: string;
  status: string;
  recipientCount: number;
  signedCount: number;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
};

function StatCard({ label, value, sub, icon: Icon, iconBg }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; iconBg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass rounded-3xl p-5 relative overflow-hidden glass-highlight"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-foreground text-2xl font-semibold mt-1.5 tracking-tight">{value}</p>
          {sub && <p className="text-muted-foreground text-xs mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{
          background: iconBg,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", cfg.color, cfg.bg)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function ActivityFeed({
  rows,
  loading,
  onRemind,
  onRefresh,
  token,
}: {
  rows: SigRow[];
  loading: boolean;
  onRemind: (id: number) => void;
  onRefresh: () => void;
  token: string | null;
}) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="liquid-glass rounded-3xl glass-highlight overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <p className="text-sm font-semibold text-foreground">Recent Activity</p>
          <p className="text-xs text-muted-foreground mt-0.5">Latest signature requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
          <Link href="/agreements">
            <button className="flex items-center gap-1 text-[#8dbeb5] text-xs hover:underline">
              View all <ChevronRight size={11} />
            </button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-[#8dbeb5] border-t-transparent animate-spin" />
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center">
          <PenTool size={24} className="mx-auto text-white/20 mb-2" />
          <p className="text-white/40 text-sm">No signature requests yet.</p>
          <Link href="/esignatures">
            <button className="mt-2 text-[#8dbeb5] text-xs hover:underline">
              Create your first →
            </button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {rows.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
            >
              {/* Progress ring indicator */}
              <div className="shrink-0 relative w-8 h-8">
                <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle
                    cx="16" cy="16" r="12" fill="none"
                    stroke={row.status === "completed" ? "#34d399" : "#8dbeb5"}
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 12}`}
                    strokeDashoffset={`${2 * Math.PI * 12 * (1 - (row.recipientCount > 0 ? row.signedCount / row.recipientCount : 0))}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/60">
                  {row.recipientCount > 0 ? Math.round((row.signedCount / row.recipientCount) * 100) : 0}%
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/signature-requests/${row.id}`}>
                  <p className="text-sm font-medium text-white/90 truncate hover:text-white cursor-pointer">{row.title}</p>
                </Link>
                <p className="text-xs text-white/40 mt-0.5">
                  {row.signedCount}/{row.recipientCount} signed · {formatDate(row.completedAt ?? row.createdAt)}
                  {isExpiringSoon(row.expiresAt) && (
                    <span className="ml-2 text-rose-400">⚠ Expires soon</span>
                  )}
                </p>
              </div>

              <StatusBadge status={row.status} />

              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/signature-requests/${row.id}`}>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all" title="View">
                    <Eye size={12} />
                  </button>
                </Link>
                {(row.status === "pending" || row.status === "partially_signed") && (
                  <button
                    onClick={() => onRemind(row.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-[#8dbeb5] transition-all"
                    title="Resend reminder"
                  >
                    <BellRing size={12} />
                  </button>
                )}
                {row.status === "completed" && (
                  <button
                    onClick={() => window.open(`/api/signature-requests/${row.id}/pdf`, "_blank")}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all"
                    title="Download PDF"
                  >
                    <Download size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats();

  const statusCounts = stats?.casesByStatus ?? [];
  const inProgress = statusCounts.find((s: any) => s.status === "in_progress")?.count ?? 0;
  const complete = statusCounts.find((s: any) => s.status === "complete")?.count ?? 0;
  const submitted = statusCounts.find((s: any) => s.status === "submitted")?.count ?? 0;

  // Signature activity feed
  const [sigRows, setSigRows] = useState<SigRow[]>([]);
  const [sigLoading, setSigLoading] = useState(true);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchSignatureActivity = useCallback(async () => {
    if (!token) return;
    setSigLoading(true);
    try {
      const res = await fetch("/api/signature-requests?limit=8", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSigRows(data.requests ?? []);
      }
    } finally {
      setSigLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const loadOnboarding = async () => {
      if (!token) return;
      try {
        const tmplRes = await fetch("/api/signature-templates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tmplRes.ok) {
          const templates = await tmplRes.json();
          setHasTemplate(Array.isArray(templates) && templates.length > 0);
        }
      } catch {
        // non-fatal
      }
    };
    loadOnboarding();
    fetchSignatureActivity();
  }, [token, fetchSignatureActivity]);

  const handleRemind = async (id: number) => {
    if (!token) return;
    setActionLoading(id);
    try {
      await fetch(`/api/signature-requests/${id}/remind`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Sig KPIs from activity feed
  const sigKpis = {
    actionRequired: sigRows.filter(r => r.status === "pending" || r.status === "partially_signed").length,
    waitingForOthers: sigRows.filter(r => r.status === "partially_signed").length,
    expiringSoon: sigRows.filter(r => {
      if (!r.expiresAt) return false;
      const diff = new Date(r.expiresAt).getTime() - Date.now();
      return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
    }).length,
    completed: sigRows.filter(r => r.status === "completed").length,
  };

  const isEmptyWorkspace = (stats?.totalCases ?? 0) === 0;

  const checklistDone = [
    (stats?.totalCases ?? 0) > 0,
    hasTemplate,
    sigRows.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Good morning, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your workflow overview</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/cases/new">
            <button
              data-testid="btn-dashboard-new-case"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-medium transition-all"
              style={{
                background: "linear-gradient(135deg, #8dbeb5, #527b78)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Plus size={15} /> New Case
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Case stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="h-4 w-20 bg-muted rounded mb-3" />
              <div className="h-7 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Cases" value={stats?.totalCases ?? 0} icon={FileText} iconBg="linear-gradient(135deg,rgba(141,190,181,0.7),rgba(82,123,120,0.8))" />
          <StatCard label="In Progress" value={inProgress} icon={Clock} iconBg="linear-gradient(135deg,rgba(251,191,36,0.7),rgba(245,158,11,0.8))" />
          <StatCard label="Complete" value={complete} sub={`${submitted} submitted`} icon={CheckCircle} iconBg="linear-gradient(135deg,rgba(52,211,153,0.7),rgba(16,185,129,0.8))" />
          <StatCard label="Action Required" value={sigKpis.actionRequired} icon={AlertCircle} iconBg="linear-gradient(135deg,rgba(248,113,113,0.7),rgba(239,68,68,0.8))" />
        </div>
      )}

      {/* Signature KPI strip (last 6 months label) */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Action Required",    value: sigKpis.actionRequired,  color: "text-amber-400" },
          { label: "Waiting for Others", value: sigKpis.waitingForOthers, color: "text-[#8dbeb5]" },
          { label: "Expiring Soon",      value: sigKpis.expiringSoon,    color: "text-rose-400" },
          { label: "Completed",          value: sigKpis.completed,       color: "text-emerald-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="liquid-glass rounded-2xl px-4 py-3 glass-highlight">
            <p className={cn("text-xl font-semibold", kpi.color)}>{kpi.value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Main grid: activity feed + onboarding checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity feed — takes 2/3 width */}
        <div className="lg:col-span-2">
          <ActivityFeed
            rows={sigRows}
            loading={sigLoading}
            onRemind={handleRemind}
            onRefresh={fetchSignatureActivity}
            token={token}
          />
        </div>

        {/* Onboarding checklist / quick-start */}
        <div className="space-y-4">
          {isEmptyWorkspace && checklistDone < 3 && (
            <div className="liquid-glass rounded-3xl glass-highlight p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={15} className="text-[#8dbeb5]" />
                <p className="text-sm font-semibold text-foreground">Get started</p>
                <span className="ml-auto text-xs text-muted-foreground">{checklistDone}/3</span>
              </div>
              <div className="space-y-2">
                {[
                  { done: (stats?.totalCases ?? 0) > 0, label: "Create your first case", href: "/cases/new" },
                  { done: hasTemplate, label: "Set up a template",     href: "/signature-templates" },
                  { done: sigRows.length > 0, label: "Send a signature request", href: "/esignatures" },
                ].map((item, i) => (
                  <Link key={i} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer",
                      item.done ? "opacity-50" : "hover:bg-white/[0.05]"
                    )}>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        item.done
                          ? "border-emerald-400 bg-emerald-400"
                          : "border-white/20"
                      )}>
                        {item.done && <CheckCircle size={11} className="text-white" />}
                      </div>
                      <span className={cn("text-xs", item.done ? "text-white/40 line-through" : "text-white/70")}>
                        {item.label}
                      </span>
                      {!item.done && <ArrowRight size={11} className="ml-auto text-white/30" />}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="liquid-glass rounded-3xl glass-highlight p-5">
            <p className="text-sm font-semibold text-foreground mb-3">Quick actions</p>
            <div className="space-y-1">
              {[
                { label: "New signature request", href: "/esignatures", icon: PenTool },
                { label: "View all agreements",   href: "/agreements",  icon: FileText },
                { label: "Manage templates",      href: "/signature-templates", icon: FileText },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/60 hover:text-white/90 hover:bg-white/[0.05] transition-all text-left">
                    <item.icon size={13} />
                    {item.label}
                    <ChevronRight size={11} className="ml-auto opacity-40" />
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
