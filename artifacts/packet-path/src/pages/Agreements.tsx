import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  recipients?: { name: string; email: string; status: string }[];
};

type FilterKey = "all" | "pending" | "partially_signed" | "completed" | "closed" | "expiring";

const STATUS: Record<Row["status"], { label: string; dot: string; text: string }> = {
  draft: { label: "Draft", dot: "bg-slate-500", text: "text-slate-400" },
  pending: { label: "Pending", dot: "bg-amber-400", text: "text-amber-300" },
  partially_signed: { label: "In Progress", dot: "bg-sky-400", text: "text-sky-300" },
  completed: { label: "Completed", dot: "bg-emerald-400", text: "text-emerald-300" },
  voided: { label: "Voided", dot: "bg-red-400", text: "text-red-300" },
  expired: { label: "Expired", dot: "bg-slate-500", text: "text-slate-400" },
};

const TABS: Array<{ key: FilterKey; label: string; icon: typeof FileText }> = [
  { key: "all", label: "All", icon: FileText },
  { key: "pending", label: "Inbox", icon: Clock },
  { key: "partially_signed", label: "In Progress", icon: Users },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
  { key: "closed", label: "Closed", icon: AlertCircle },
];

const EXPIRING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function isExpiringSoon(row: Row, now = Date.now()): boolean {
  if (!row.expiresAt || row.status === "completed" || row.status === "voided" || row.status === "expired") return false;
  const expires = new Date(row.expiresAt).getTime();
  return Number.isFinite(expires) && expires >= now && expires <= now + EXPIRING_WINDOW_MS;
}

function timeSince(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "—";
  const diff = Math.max(0, Date.now() - timestamp);
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function expiryLabel(row: Row): string | null {
  if (!row.expiresAt || row.status === "completed" || row.status === "voided" || row.status === "expired") return null;
  const expires = new Date(row.expiresAt).getTime();
  if (!Number.isFinite(expires)) return null;
  const remaining = expires - Date.now();
  if (remaining < 0) return "Past due";
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return days <= 7 ? `Expires in ${days}d` : null;
}

export default function AgreementsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/signatures?limit=100", { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to load agreements");
      setRows(Array.isArray(payload) ? payload : payload.requests ?? []);
    } catch (err: any) {
      toast({ title: err?.message || "Failed to load agreements", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter(row => row.status === "pending").length,
    partial: rows.filter(row => row.status === "partially_signed").length,
    completed: rows.filter(row => row.status === "completed").length,
    closed: rows.filter(row => row.status === "voided" || row.status === "expired").length,
    expiring: rows.filter(row => isExpiringSoon(row)).length,
  }), [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(row => {
      const searchText = `${row.title} ${(row.recipients ?? []).map(recipient => `${recipient.name} ${recipient.email}`).join(" ")}`.toLowerCase();
      if (term && !searchText.includes(term)) return false;
      if (activeFilter === "all") return true;
      if (activeFilter === "closed") return row.status === "voided" || row.status === "expired";
      if (activeFilter === "expiring") return isExpiringSoon(row);
      return row.status === activeFilter;
    });
  }, [activeFilter, rows, search]);

  const countForTab = (key: FilterKey) => {
    if (key === "all") return counts.all;
    if (key === "pending") return counts.pending;
    if (key === "partially_signed") return counts.partial;
    if (key === "completed") return counts.completed;
    if (key === "closed") return counts.closed;
    return counts.expiring;
  };

  const handleResend = async (id: number) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/signatures/${id}/remind`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to send reminder");
      toast({ title: payload.emailsSent > 0 ? "Reminder sent" : "Reminder logged", description: payload.message });
    } catch (err: any) {
      toast({ title: err?.message || "Failed to send reminder", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleVoid = async (id: number) => {
    if (!confirm("Void this signature request?")) return;
    setActionLoading(id);
    try {
      const response = await fetch(`/api/signatures/${id}/void`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to void request");
      toast({ title: "Request voided" });
      await fetchRows();
    } catch (err: any) {
      toast({ title: err?.message || "Failed to void request", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (id: number, title: string) => {
    try {
      const response = await fetch(`/api/signature-requests/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "agreement"}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: err?.message || "Download failed", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-8 pb-0 pt-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white/90">Agreements</h1>
            <p className="mt-0.5 text-sm text-white/35">Track signature requests, deadlines, and completed documents</p>
          </div>
          <Link href="/esignatures"><button className="btn-primary-glow flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> New Agreement</button></Link>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          {[
            { label: "Action Required", value: counts.pending, filter: "pending" as FilterKey, color: "text-amber-300", dot: "bg-amber-400" },
            { label: "Waiting for Others", value: counts.partial, filter: "partially_signed" as FilterKey, color: "text-sky-300", dot: "bg-sky-400" },
            { label: "Expiring Soon", value: counts.expiring, filter: "expiring" as FilterKey, color: "text-red-300", dot: "bg-red-400" },
            { label: "Completed", value: counts.completed, filter: "completed" as FilterKey, color: "text-emerald-300", dot: "bg-emerald-400" },
          ].map(stat => (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setActiveFilter(stat.filter)}
              className={cn("stat-card flex items-center gap-3 p-4 text-left", activeFilter === stat.filter && "ring-1 ring-white/20")}
            >
              <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", stat.dot)} />
              <div><p className={cn("text-2xl font-bold leading-none", stat.color)}>{stat.value}</p><p className="mt-1 text-[11px] text-white/40">{stat.label}</p></div>
            </motion.button>
          ))}
        </div>

        <div className="flex items-end justify-between gap-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeFilter === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveFilter(tab.key)} className={cn("-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition", active ? "border-sky-400 text-sky-300" : "border-transparent text-white/40 hover:text-white/65")}>
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                  {countForTab(tab.key) > 0 && <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px]">{countForTab(tab.key)}</span>}
                </button>
              );
            })}
            {activeFilter === "expiring" && <button onClick={() => setActiveFilter("all")} className="-mb-px border-b-2 border-red-400 px-3.5 py-2.5 text-xs font-semibold text-red-300">Expiring Soon <span className="ml-1 rounded-full bg-red-500/15 px-1.5 py-0.5">{counts.expiring}</span></button>}
          </div>
          <div className="flex items-center gap-2 pb-2">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title or recipient..." className="glass-input w-64 rounded-xl py-2 pl-9 pr-4 text-xs" /></div>
            <button onClick={() => void fetchRows()} className="glass-card rounded-xl p-2 text-white/40 transition hover:text-white/70"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8">
        <div className="glass-card overflow-hidden rounded-b-2xl rounded-t-none border-t-0">
          <div className="grid grid-cols-[1fr_180px_150px_130px_210px] gap-4 border-b border-white/[0.06] bg-white/[0.02] px-5 py-2.5">
            {["Agreement", "Status", "Signers", "Last Change", "Actions"].map(header => <p key={header} className="text-[10px] font-bold uppercase tracking-widest text-white/30">{header}</p>)}
          </div>

          {loading ? (
            <div className="space-y-px">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 animate-pulse border-b border-white/[0.03] bg-white/[0.02]" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20"><FileText className="h-10 w-10 text-white/10" /><p className="text-sm text-white/30">No agreements match this view</p><button onClick={() => { setSearch(""); setActiveFilter("all"); }} className="text-xs text-sky-400/70">Clear filters</button></div>
          ) : filtered.map(row => {
            const status = STATUS[row.status];
            const complete = row.status === "completed";
            const closed = row.status === "voided" || row.status === "expired";
            const pendingRecipient = row.recipients?.find(recipient => recipient.status !== "signed");
            const expiring = expiryLabel(row);
            return (
              <div key={row.id} className="group grid grid-cols-[1fr_180px_150px_130px_210px] items-center gap-4 border-b border-white/[0.04] px-5 py-3.5 transition last:border-0 hover:bg-white/[0.025]">
                <div className="min-w-0"><button onClick={() => setLocation(`/signature-requests/${row.id}`)} className="block max-w-full truncate text-left text-sm font-medium text-white/80 transition group-hover:text-white/95">{row.title}</button>{row.recipients?.[0] && <p className="mt-0.5 truncate text-[11px] text-white/30">To {row.recipients[0].name || row.recipients[0].email}{row.recipients.length > 1 ? `, +${row.recipients.length - 1} more` : ""}</p>}</div>
                <div><div className="flex items-center gap-1.5"><span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} /><span className={cn("text-xs font-medium", status.text)}>{status.label}</span></div>{expiring && <p className="mt-1 pl-3 text-[10px] font-medium text-red-300">{expiring}</p>}{!complete && !closed && !expiring && pendingRecipient && <p className="mt-1 pl-3 text-[10px] text-white/25">Waiting for {pendingRecipient.name?.split(" ")[0] || "signer"}</p>}</div>
                <div className="flex items-center gap-2"><div className="h-1 flex-1 rounded-full bg-white/[0.06]"><div className="h-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${row.recipientCount ? (row.signedCount / row.recipientCount) * 100 : 0}%` }} /></div><span className="shrink-0 text-[10px] text-white/35">{row.signedCount}/{row.recipientCount}</span></div>
                <p className="text-xs text-white/40">{timeSince(row.completedAt ?? row.createdAt)}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => setLocation(`/signature-requests/${row.id}`)} className="rounded-lg border border-white/[0.10] bg-white/[0.04] p-2 text-white/45 transition hover:text-white/80" title="Open details"><Eye className="h-3.5 w-3.5" /></button>
                  {complete && <button onClick={() => void handleDownload(row.id, row.title)} className="flex items-center gap-1.5 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/55 transition hover:text-white/80"><Download className="h-3 w-3" /> Download</button>}
                  {!complete && !closed && <><button onClick={() => void handleResend(row.id)} disabled={actionLoading === row.id} className="flex items-center gap-1.5 rounded-lg border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-300 disabled:opacity-50"><Send className="h-3 w-3" /> Remind</button><button onClick={() => void handleVoid(row.id)} disabled={actionLoading === row.id} className="rounded-lg border border-red-400/20 bg-red-400/10 p-2 text-red-300 disabled:opacity-50" title="Void request"><Ban className="h-3.5 w-3.5" /></button></>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
