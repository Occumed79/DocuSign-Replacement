import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  PenTool, Plus, Search, Clock, CheckCircle, XCircle, AlertCircle,
  Eye, FileText, Users, Send, MoreHorizontal, ChevronRight, Trash2,
  Shield, Copy, ExternalLink, Download
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import CreateRequestModal from "@/components/signatures/CreateRequestModal";

interface SignatureRequest {
  id: number;
  title: string;
  message: string | null;
  status: "draft" | "pending" | "partially_signed" | "completed" | "voided" | "expired";
  recipientCount: number;
  signedCount: number;
  caseId: number | null;
  patientName: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
  recipients: { name: string; email: string; status: string; role: string; token: string }[];
}

interface Stats {
  total: number;
  pending: number;
  completed: number;
  voided: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100", icon: FileText },
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  partially_signed: { label: "In Progress", color: "text-[#8dbeb5]", bg: "bg-[#8dbeb5]/15", icon: PenTool },
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
  voided: { label: "Voided", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
  expired: { label: "Expired", color: "text-slate-500", bg: "bg-slate-100", icon: AlertCircle },
};

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ESignaturesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, completed: 0, voided: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [actionOpen, setActionOpen] = useState<number | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/signature-requests?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests);
      setStats(data.stats);
    }
    setLoading(false);
  }, [token, statusFilter, search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const voidRequest = async (id: number) => {
    const reason = prompt("Reason for voiding this request?");
    if (!reason) return;
    const res = await fetch(`/api/signature-requests/${id}/void`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      toast({ title: "Request voided" });
      fetchRequests();
    }
    setActionOpen(null);
  };

  const copySigningLink = async (requestId: number, recipientToken: string) => {
    const link = `${window.location.origin}/sign/${recipientToken}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Signing link copied to clipboard" });
    setActionOpen(null);
  };

  const sendReminder = async (id: number) => {
    const res = await fetch(`/api/signature-requests/${id}/remind`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const payload = await res.json().catch(() => null);
      const failed = Array.isArray(payload?.perRecipient)
        ? payload.perRecipient.filter((r: { sent?: boolean }) => !r.sent).length
        : 0;
      toast({
        title: failed > 0 ? "Reminder sent with some failures" : "Reminder sent to pending signers",
        description: payload?.emailsTotal ? `${payload.emailsSent}/${payload.emailsTotal} email(s) sent` : undefined,
      });
    }
    setActionOpen(null);
  };

  const downloadPdf = async (id: number, title: string) => {
    setActionOpen(null);
    try {
      const res = await fetch(`/api/signature-requests/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ?? `PacketPath_${title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "PDF download failed", variant: "destructive" });
    }
  };

  const isEmptyWorkspace = stats.total === 0;

  const statCards = [
    { label: "Total Requests", value: stats.total, icon: FileText, iconBg: "linear-gradient(135deg, #527b78, #3f6461)" },
    { label: "Awaiting Signature", value: stats.pending, icon: Clock, iconBg: "linear-gradient(135deg, #8dbeb5, #527b78)" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, iconBg: "linear-gradient(135deg, #10b981, #14b8a6)" },
    { label: "Voided", value: stats.voided, icon: XCircle, iconBg: "linear-gradient(135deg, #64748b, #475569)" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{
              background: "linear-gradient(135deg, #8dbeb5, #527b78)",
              boxShadow: "0 4px 16px rgba(141,190,181,0.22), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}>
              <PenTool size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">E-Signatures</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Secure, HIPAA-compliant document signing. Build custom forms in Templates.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/signature-templates">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-foreground transition-all" style={{
                background: "rgba(255,255,255,0.50)",
                border: "1px solid rgba(255,255,255,0.50)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}>
                <FileText size={15} />
                Templates
              </button>
            </Link>
            <button
              data-testid="btn-new-request"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-medium transition-all"
              style={{
                background: "linear-gradient(135deg, #8dbeb5, #527b78)",
                boxShadow: "0 4px 16px rgba(141,190,181,0.22), inset 0 1px 0 rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Plus size={15} />
              New Request
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="liquid-glass rounded-3xl p-5 relative overflow-hidden glass-highlight"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{s.label}</p>
                  <p className="text-foreground text-2xl font-semibold mt-1.5 tracking-tight">{s.value}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{
                  background: s.iconBg,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3)",
                }}>
                  <s.icon size={18} className="text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#052a32]/65 border border-white/25 text-sm outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground transition-all backdrop-blur-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-[#052a32]/65 border border-white/25 text-sm outline-none focus:border-primary/50 text-foreground transition-all backdrop-blur-sm"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="partially_signed">In Progress</option>
            <option value="completed">Completed</option>
            <option value="voided">Voided</option>
            <option value="expired">Expired</option>
          </select>
        </div>


        {isEmptyWorkspace && !loading && (
          <div className="liquid-glass rounded-3xl p-4 mb-5 border border-white/20">
            <p className="text-sm text-foreground font-medium">No templates or requests yet. Start with a template, then send for signature.</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Link href="/signature-templates"><button className="px-3 py-2 text-xs rounded-xl bg-[#052a32]/70 border border-white/25 text-[#f4f7f6]">Create Template</button></Link>
              <button onClick={() => setShowCreate(true)} className="px-3 py-2 text-xs rounded-xl bg-[#8dbeb5] text-[#031219]">Quick Request</button>
            </div>
          </div>
        )}

        {/* Requests list */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                <div className="h-4 w-64 bg-muted rounded mb-3" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
            ))
          ) : requests.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <PenTool size={40} className="text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-foreground font-medium mb-1">No signature requests yet</p>
              <p className="text-muted-foreground text-sm mb-5">Create your first request to send documents for signing.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8dbeb5] to-[#527b78] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus size={14} /> Create Request
              </button>
            </div>
          ) : (
            requests.map((req, i) => {
              const cfg = statusConfig[req.status] ?? statusConfig.draft;
              const StatusIcon = cfg.icon;
              const progress = req.recipientCount > 0 ? Math.round((req.signedCount / req.recipientCount) * 100) : 0;
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="liquid-glass rounded-3xl p-5 hover:shadow-md transition-all relative overflow-hidden glass-highlight"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8dbeb5]/15 to-[#527b78]/15 flex items-center justify-center shrink-0 border border-white/20">
                      <PenTool size={16} className="text-[#8dbeb5]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground text-sm">{req.title}</h3>
                            <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
                              <StatusIcon size={10} />
                              {cfg.label}
                            </span>
                          </div>
                          {req.patientName && (
                            <p className="text-xs text-muted-foreground mt-0.5">Patient: {req.patientName}</p>
                          )}
                          {req.message && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{req.message}</p>
                          )}
                        </div>
                        {/* Action menu */}
                        <div className="relative shrink-0">
                          <button
                            onClick={() => setActionOpen(actionOpen === req.id ? null : req.id)}
                            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          <AnimatePresence>
                            {actionOpen === req.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                className="absolute right-0 top-8 w-52 glass-card rounded-xl shadow-xl z-20 py-1 border border-border"
                              >
                                <Link href={`/signature-requests/${req.id}`}>
                                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors text-left">
                                    <Eye size={13} /> View Details
                                  </button>
                                </Link>
                                <button
                                  onClick={() => downloadPdf(req.id, req.title)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8dbeb5] hover:bg-[#8dbeb5]/10 transition-colors text-left"
                                >
                                  <Download size={13} /> Download PDF
                                </button>
                                {req.status === "pending" || req.status === "partially_signed" ? (
                                  <button
                                    onClick={() => sendReminder(req.id)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors text-left"
                                  >
                                    <Send size={13} /> Send Reminder
                                  </button>
                                ) : null}
                                {req.recipients?.[0]?.token && (
                                  <button
                                    onClick={() => copySigningLink(req.id, req.recipients[0].token as string)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors text-left"
                                  >
                                    <Copy size={13} /> Copy Signing Link
                                  </button>
                                )}
                                {req.status !== "voided" && req.status !== "completed" && (
                                  <button
                                    onClick={() => voidRequest(req.id)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                  >
                                    <Trash2 size={13} /> Void Request
                                  </button>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Progress + recipients */}
                      <div className="mt-3 flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={cn(
                                "h-full rounded-full",
                                req.status === "completed" ? "bg-emerald-500" : "bg-gradient-to-r from-[#8dbeb5] to-[#527b78]"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {req.signedCount}/{req.recipientCount} signed
                          </span>
                        </div>

                        {/* Recipient avatars */}
                        <div className="flex items-center gap-1.5">
                          {req.recipients.slice(0, 4).map((r, j) => {
                            const rCfg = statusConfig[r.status] ?? statusConfig.pending;
                            return (
                              <div key={j} className="relative" title={`${r.name} (${r.status})`}>
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8dbeb5] to-[#527b78] flex items-center justify-center text-white text-xs font-bold border-2 border-background">
                                  {r.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={cn(
                                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-background flex items-center justify-center",
                                  r.status === "signed" ? "bg-emerald-500" : r.status === "viewed" ? "bg-[#8dbeb5]/150" : r.status === "declined" ? "bg-red-500" : "bg-slate-400"
                                )} />
                              </div>
                            );
                          })}
                          {req.recipients.length > 4 && (
                            <span className="text-xs text-muted-foreground">+{req.recipients.length - 4}</span>
                          )}
                        </div>

                        <span className="text-xs text-muted-foreground ml-auto">{timeSince(req.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* HIPAA notice */}
        <div className="mt-8 glass-card rounded-xl p-4 flex items-start gap-3 border border-white/20">
          <Shield size={15} className="text-[#8dbeb5] mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            All signatures are legally binding under the ESIGN Act (15 U.S.C. § 7001) and UETA. Each signature includes a tamper-evident
            document hash, signer IP address, timestamp, and user agent. Audit trail stored in compliance with HIPAA §164.312(b).
          </p>
        </div>
      </motion.div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateRequestModal
            token={token}
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); fetchRequests(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
