import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, BellRing, Ban, Eye, RefreshCw,
  CheckCircle2, Clock, AlertCircle, FileText, Users,
  ChevronRight, Plus, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  id: number;
  title: string;
  status: "draft" | "pending" | "partially_signed" | "completed" | "voided" | "expired";
  recipientCount: number;
  signedCount: number;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:            { label: "Draft",          color: "text-slate-400",   bg: "bg-slate-400/10",  dot: "bg-slate-400" },
  pending:          { label: "Pending",         color: "text-amber-400",   bg: "bg-amber-400/10",  dot: "bg-amber-400" },
  partially_signed: { label: "In Progress",     color: "text-[#8dbeb5]",   bg: "bg-[#8dbeb5]/10",  dot: "bg-[#8dbeb5]" },
  completed:        { label: "Completed",       color: "text-emerald-400", bg: "bg-emerald-400/10",dot: "bg-emerald-400" },
  voided:           { label: "Voided",          color: "text-red-400",     bg: "bg-red-400/10",    dot: "bg-red-400" },
  expired:          { label: "Expired",         color: "text-slate-500",   bg: "bg-slate-500/10",  dot: "bg-slate-500" },
};

const NAV_TABS = [
  { key: "",                label: "All",             icon: FileText },
  { key: "pending",         label: "Inbox",           icon: Clock },
  { key: "partially_signed",label: "In Progress",     icon: Users },
  { key: "completed",       label: "Completed",       icon: CheckCircle2 },
  { key: "voided,expired",  label: "Closed",          icon: AlertCircle },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", cfg.color, cfg.bg)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass rounded-2xl p-4 flex items-center gap-3 glass-highlight"
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

export default function AgreementsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      // Support multi-status filter for "Closed" tab
      if (activeTab && activeTab.includes(",")) {
        // Fetch both statuses separately and merge
        const statuses = activeTab.split(",");
        const allRows: Row[] = [];
        await Promise.all(
          statuses.map(async (s) => {
            const p = new URLSearchParams();
            if (search) p.set("search", search);
            p.set("status", s);
            const res = await fetch(`/api/signature-requests?${p.toString()}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              allRows.push(...(data.requests ?? []));
            }
          })
        );
        setRows(allRows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        if (activeTab) params.set("status", activeTab);
        const res = await fetch(`/api/signature-requests?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRows(data.requests ?? []);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, token]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchRows(), 300);
    return () => clearTimeout(t);
  }, [search]);

  const kpis = useMemo(() => {
    const all = rows;
    return {
      actionRequired: all.filter(r => r.status === "pending" || r.status === "partially_signed").length,
      waitingForOthers: all.filter(r => r.status === "partially_signed").length,
      expiringSoon: all.filter(r => {
        if (!r.expiresAt) return false;
        const diff = new Date(r.expiresAt).getTime() - Date.now();
        return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
      }).length,
      completed: all.filter(r => r.status === "completed").length,
    };
  }, [rows]);

  const remind = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/signature-requests/${id}/remind`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Reminder sent" });
      } else {
        toast({ title: "Failed to send reminder", variant: "destructive" });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const voidReq = async (id: number) => {
    const reason = prompt("Reason for voiding this request?");
    if (!reason) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/signature-requests/${id}/void`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        toast({ title: "Request voided" });
        fetchRows();
      } else {
        toast({ title: "Failed to void request", variant: "destructive" });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const renewReq = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/signature-requests/${id}/renew`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ expiryDays: 7 }),
      });
      if (res.ok) {
        toast({ title: "Request renewed — expiry extended 7 days" });
        fetchRows();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.error ?? "Failed to renew request", variant: "destructive" });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = async (id: number) => {
    try {
      const res = await fetch(`/api/signature-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const firstPending = data.recipients?.find((r: any) => r.status === "pending" || r.status === "viewed");
        if (firstPending?.signingLink) {
          await navigator.clipboard.writeText(firstPending.signingLink);
          toast({ title: "Signing link copied" });
        } else {
          toast({ title: "No pending signing link found", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Agreements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {kpis.actionRequired > 0
              ? `${kpis.actionRequired} waiting for action`
              : "All caught up"}
          </p>
        </div>
        <Link href="/esignatures">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-medium transition-all"
            style={{
              background: "linear-gradient(135deg, #8dbeb5, #527b78)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Plus size={15} /> New Agreement
          </button>
        </Link>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Action Required"    value={kpis.actionRequired}  icon={AlertCircle}   color="bg-amber-500/80" />
        <KpiCard label="Waiting for Others" value={kpis.waitingForOthers} icon={Clock}         color="bg-[#527b78]/80" />
        <KpiCard label="Expiring Soon"      value={kpis.expiringSoon}    icon={AlertCircle}   color="bg-rose-500/80" />
        <KpiCard label="Completed"          value={kpis.completed}       icon={CheckCircle2}  color="bg-emerald-600/80" />
      </div>

      {/* Left-nav style tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 liquid-glass rounded-2xl w-fit">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
              activeTab === tab.key
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80"
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agreements…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm bg-[#052a32]/65 text-[#f4f7f6] border-white/20 placeholder:text-white/30 focus:outline-none focus:border-white/40"
          />
        </div>
        <button
          onClick={fetchRows}
          className="p-2 rounded-xl border border-white/20 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="liquid-glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(5, 42, 50, 0.55)" }}>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Agreement</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Signers</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Expires</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[#8dbeb5] border-t-transparent animate-spin" />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FileText size={28} className="mx-auto text-white/20 mb-2" />
                    <p className="text-white/40 text-sm">No agreements found.</p>
                    <Link href="/esignatures">
                      <button className="mt-3 text-[#8dbeb5] text-xs hover:underline">
                        Create your first agreement →
                      </button>
                    </Link>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/signature-requests/${row.id}`}>
                        <span className="font-medium text-white/90 hover:text-white cursor-pointer flex items-center gap-1 group">
                          {row.title}
                          <ChevronRight size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">
                      {row.signedCount}/{row.recipientCount} signed
                      {row.recipientCount > 0 && (
                        <div className="mt-1 w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#8dbeb5]"
                            style={{ width: `${(row.signedCount / row.recipientCount) * 100}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {formatDate(row.completedAt ?? row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.expiresAt ? (
                        <span className={cn(
                          isExpiringSoon(row.expiresAt) ? "text-rose-400 font-medium" : "text-white/50"
                        )}>
                          {formatDate(row.expiresAt)}
                          {isExpiringSoon(row.expiresAt) && " ⚠️"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end items-center gap-1">
                        <Link href={`/signature-requests/${row.id}`}>
                          <button
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
                            title="View"
                          >
                            <Eye size={13} />
                          </button>
                        </Link>
                        {(row.status === "pending" || row.status === "partially_signed") && (
                          <>
                            <button
                              onClick={() => remind(row.id)}
                              disabled={actionLoading === row.id}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-all disabled:opacity-40"
                              title="Send reminder"
                            >
                              <BellRing size={13} />
                            </button>
                            <button
                              onClick={() => voidReq(row.id)}
                              disabled={actionLoading === row.id}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all disabled:opacity-40"
                              title="Void"
                            >
                              <Ban size={13} />
                            </button>
                          </>
                        )}
                        {row.status === "expired" && (
                          <button
                            onClick={() => renewReq(row.id)}
                            disabled={actionLoading === row.id}
                            className="p-1.5 rounded-lg hover:bg-[#8dbeb5]/20 text-white/40 hover:text-[#8dbeb5] transition-all disabled:opacity-40"
                            title="Renew (extend 7 days)"
                          >
                            <RefreshCw size={13} />
                          </button>
                        )}
                        {row.status === "completed" && (
                          <button
                            onClick={() =>
                              window.open(`/api/signature-requests/${row.id}/pdf`, "_blank")
                            }
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
                            title="Download PDF"
                          >
                            <Download size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
