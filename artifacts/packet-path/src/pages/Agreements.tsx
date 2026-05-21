import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Search, Download, Send, Ban, Eye, RefreshCw,
  CheckCircle2, Clock, AlertCircle, FileText, Users,
  Plus, MoreHorizontal, ChevronRight, Copy, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  id: number; title: string;
  status: "draft"|"pending"|"partially_signed"|"completed"|"voided"|"expired";
  recipientCount: number; signedCount: number;
  createdAt: string; completedAt: string|null; expiresAt: string|null;
  recipients?: { name: string; email: string; status: string; token?: string }[];
};

const S: Record<string, { label:string; dot:string; text:string; badge:string }> = {
  draft:            { label:"Draft",       dot:"bg-slate-500",   text:"text-slate-400",   badge:"badge-draft" },
  pending:          { label:"Pending",     dot:"bg-amber-400",   text:"text-amber-300",   badge:"badge-pending" },
  partially_signed: { label:"In Progress", dot:"bg-sky-400",     text:"text-sky-300",     badge:"badge-progress" },
  completed:        { label:"Completed",   dot:"bg-emerald-400", text:"text-emerald-300", badge:"badge-complete" },
  voided:           { label:"Voided",      dot:"bg-red-400",     text:"text-red-300",     badge:"badge-voided" },
  expired:          { label:"Expired",     dot:"bg-slate-500",   text:"text-slate-400",   badge:"badge-expired" },
};

const TABS = [
  { key:"",                 label:"All",         icon:FileText },
  { key:"pending",          label:"Inbox",        icon:Clock },
  { key:"partially_signed", label:"In Progress",  icon:Users },
  { key:"completed",        label:"Completed",    icon:CheckCircle2 },
  { key:"voided,expired",   label:"Closed",       icon:AlertCircle },
];

function timeSince(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff/60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h/24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

export default function AgreementsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number|null>(null);
  const [menuOpen, setMenuOpen] = useState<number|null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/signatures?limit=100", { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      setRows(Array.isArray(data) ? data : data.requests ?? []);
    } catch { toast({ title:"Failed to load agreements", variant:"destructive" }); }
    finally { setLoading(false); }
  }, [token, toast]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search) r = r.filter(x => x.title.toLowerCase().includes(search.toLowerCase()));
    if (activeTab) {
      const keys = activeTab.split(",");
      r = r.filter(x => keys.includes(x.status));
    }
    return r;
  }, [rows, search, activeTab]);

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter(r => r.status==="pending").length,
    partial: rows.filter(r => r.status==="partially_signed").length,
    completed: rows.filter(r => r.status==="completed").length,
    closed: rows.filter(r => r.status==="voided"||r.status==="expired").length,
  }), [rows]);

  const handleResend = async (id: number) => {
    setActionLoading(id);
    try {
      await fetch(`/api/signatures/${id}/remind`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
      toast({ title:"Reminder sent" });
    } catch { toast({ title:"Failed to send reminder", variant:"destructive" }); }
    finally { setActionLoading(null); setMenuOpen(null); }
  };

  const handleVoid = async (id: number) => {
    if (!confirm("Void this signature request?")) return;
    setActionLoading(id);
    try {
      await fetch(`/api/signatures/${id}/void`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
      toast({ title:"Request voided" }); fetchRows();
    } catch { toast({ title:"Failed to void", variant:"destructive" }); }
    finally { setActionLoading(null); setMenuOpen(null); }
  };

  const handleDownload = async (id: number) => {
    try {
      const r = await fetch(`/api/signatures/${id}/download`, { headers:{ Authorization:`Bearer ${token}` } });
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download=`agreement-${id}.pdf`; a.click();
    } catch { toast({ title:"Download failed", variant:"destructive" }); }
  };

  const countForTab = (key: string) => {
    if (!key) return counts.all;
    if (key==="pending") return counts.pending;
    if (key==="partially_signed") return counts.partial;
    if (key==="completed") return counts.completed;
    if (key==="voided,expired") return counts.closed;
    return 0;
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Page header ── */}
      <div className="px-8 pt-7 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white/90 tracking-tight">Agreements</h1>
            <p className="text-sm text-white/35 mt-0.5">All caught up</p>
          </div>
          <Link href="/esignatures">
            <button className="btn-primary-glow flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold">
              <Plus className="w-4 h-4" />New Agreement
            </button>
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label:"Action Required",    value: counts.pending,   color:"text-amber-300",   dot:"bg-amber-400",   glow:"rgba(251,191,36,0.15)" },
            { label:"Waiting for Others", value: counts.partial,   color:"text-sky-300",     dot:"bg-sky-400",     glow:"rgba(56,160,255,0.15)" },
            { label:"Expiring Soon",      value: 0,                color:"text-red-300",     dot:"bg-red-400",     glow:"rgba(248,113,113,0.15)" },
            { label:"Completed",          value: counts.completed, color:"text-emerald-300", dot:"bg-emerald-400", glow:"rgba(52,211,153,0.15)" },
          ].map(s => (
            <motion.div key={s.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              className="stat-card p-4 flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveTab(s.label==="Action Required"?"pending":s.label==="Waiting for Others"?"partially_signed":s.label==="Completed"?"completed":"")}>
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", s.dot)}
                style={{ boxShadow: `0 0 8px ${s.glow}` }} />
              <div>
                <p className={cn("text-2xl font-bold leading-none", s.color)}>{s.value}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab bar + search */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-0">
          <div className="flex items-center gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const cnt = countForTab(tab.key);
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px",
                    active
                      ? "text-sky-300 border-sky-400"
                      : "text-white/40 border-transparent hover:text-white/65 hover:border-white/20"
                  )}>
                  <Icon className="w-3.5 h-3.5" />{tab.label}
                  {cnt > 0 && <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", active ? "bg-sky-500/20 text-sky-300" : "bg-white/[0.06] text-white/35")}>{cnt}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search agreements..."
                className="glass-input pl-9 pr-4 py-2 text-xs w-56 rounded-xl"
              />
            </div>
            <button onClick={fetchRows} className="p-2 rounded-xl glass-card text-white/40 hover:text-white/70 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 px-8 pt-0">
        <div className="glass-card rounded-b-2xl rounded-t-none overflow-hidden border-t-0">
          {/* Header */}
          <div className="grid grid-cols-[1fr_180px_140px_120px_80px] gap-4 px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            {["Agreement","Status","Signers","Last Change",""].map(h => (
              <p key={h} className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{h}</p>
            ))}
          </div>

          {loading ? (
            <div className="space-y-px">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-14 bg-white/[0.02] animate-pulse border-b border-white/[0.03]"/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FileText className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/30">No agreements found</p>
              <Link href="/esignatures">
                <button className="text-xs text-sky-400/60 hover:text-sky-400 transition-colors flex items-center gap-1">
                  Create your first <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
          ) : (
            filtered.map(row => {
              const cfg = S[row.status] ?? S.draft;
              const isComplete = row.status === "completed";
              const isVoided = row.status === "voided" || row.status === "expired";
              const pendingRecipient = row.recipients?.find(r => r.status !== "completed");
              return (
                <div key={row.id}
                  className="grid grid-cols-[1fr_180px_140px_120px_80px] gap-4 items-center px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors group">

                  {/* Name */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate group-hover:text-white/95 transition-colors">{row.title}</p>
                    {row.recipients?.[0] && (
                      <p className="text-[11px] text-white/30 mt-0.5 truncate">
                        To {row.recipients[0].name || row.recipients[0].email}
                        {row.recipients.length > 1 ? `, +${row.recipients.length - 1} more` : ""}
                      </p>
                    )}
                  </div>

                  {/* Status with inline signer name like DocuSign */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                      <span className={cn("text-xs font-medium", cfg.text)}>{cfg.label}</span>
                    </div>
                    {!isComplete && !isVoided && pendingRecipient && (
                      <p className="text-[10px] text-white/25 pl-3">
                        Waiting for {pendingRecipient.name?.split(" ")[0] ?? "signer"}
                      </p>
                    )}
                  </div>

                  {/* Signers progress */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/[0.06] rounded-full h-1">
                      <div className="h-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                        style={{ width: `${row.recipientCount ? (row.signedCount/row.recipientCount)*100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] text-white/35 shrink-0">{row.signedCount}/{row.recipientCount}</span>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-white/40">{timeSince(row.completedAt ?? row.createdAt)}</p>

                  {/* Action — exactly DocuSign pattern */}
                  <div className="flex items-center justify-end gap-1">
                    {isComplete ? (
                      <button onClick={() => handleDownload(row.id)}
                        className="px-3 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.04] text-xs font-semibold text-white/55 hover:bg-white/[0.08] hover:text-white/80 transition-all flex items-center gap-1.5">
                        <Download className="w-3 h-3" />Download
                      </button>
                    ) : isVoided ? (
                      <span className="text-[10px] text-white/25 px-2">{cfg.label}</span>
                    ) : (
                      <button onClick={() => handleResend(row.id)} disabled={actionLoading===row.id}
                        className="px-3 py-1.5 rounded-lg border border-sky-500/25 bg-sky-500/8 text-xs font-semibold text-sky-300 hover:bg-sky-500/15 transition-all flex items-center gap-1.5 disabled:opacity-50">
                        <Send className="w-3 h-3" />Resend
                      </button>
                    )}
                    <div className="relative">
                      <button onClick={() => setMenuOpen(menuOpen===row.id?null:row.id)}
                        className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                      {menuOpen === row.id && (
                        <div className="absolute right-0 top-full mt-1 glass-modal rounded-xl overflow-hidden z-50 min-w-[140px]">
                          <Link href={`/esignatures/${row.id}`}>
                            <button className="w-full text-left px-3.5 py-2.5 text-xs text-white/65 hover:bg-white/[0.06] hover:text-white/90 transition-all flex items-center gap-2 border-b border-white/[0.05]">
                              <Eye className="w-3 h-3" />View details
                            </button>
                          </Link>
                          {row.recipients?.[0]?.token && (
                            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${row.recipients![0].token}`); toast({title:"Link copied"}); setMenuOpen(null); }}
                              className="w-full text-left px-3.5 py-2.5 text-xs text-white/65 hover:bg-white/[0.06] hover:text-white/90 transition-all flex items-center gap-2 border-b border-white/[0.05]">
                              <Copy className="w-3 h-3" />Copy signing link
                            </button>
                          )}
                          {!isComplete && !isVoided && (
                            <button onClick={() => handleResend(row.id)}
                              className="w-full text-left px-3.5 py-2.5 text-xs text-white/65 hover:bg-white/[0.06] hover:text-white/90 transition-all flex items-center gap-2 border-b border-white/[0.05]">
                              <Send className="w-3 h-3" />Send reminder
                            </button>
                          )}
                          {isComplete && (
                            <button onClick={() => handleDownload(row.id)}
                              className="w-full text-left px-3.5 py-2.5 text-xs text-white/65 hover:bg-white/[0.06] hover:text-white/90 transition-all flex items-center gap-2 border-b border-white/[0.05]">
                              <Download className="w-3 h-3" />Download PDF
                            </button>
                          )}
                          {!isComplete && !isVoided && (
                            <button onClick={() => handleVoid(row.id)}
                              className="w-full text-left px-3.5 py-2.5 text-xs text-red-400/70 hover:bg-red-500/8 hover:text-red-300 transition-all flex items-center gap-2">
                              <Ban className="w-3 h-3" />Void
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
