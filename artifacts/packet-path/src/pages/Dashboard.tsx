import { useGetDashboardStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  FileText, CheckCircle, Clock, AlertCircle, Plus,
  PenTool, Send, ChevronRight, Download, RefreshCw,
  Star, MoreHorizontal, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── types ─────────────────────────────────────────────────────────────────── */
type SigRow = {
  id: number; title: string; status: string;
  recipientCount: number; signedCount: number;
  createdAt: string; completedAt: string | null; expiresAt: string | null;
  recipients?: { name: string; email: string; status: string }[];
};
type Template = { id: number; name: string; category: string; usageCount?: number; updatedAt?: string };

/* ── helpers ────────────────────────────────────────────────────────────────── */
function timeSince(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const S: Record<string, { label: string; dot: string; text: string; badge: string }> = {
  draft:            { label: "Draft",       dot: "bg-slate-500",   text: "text-slate-400",   badge: "badge-draft" },
  pending:          { label: "Pending",     dot: "bg-amber-400",   text: "text-amber-300",   badge: "badge-pending" },
  partially_signed: { label: "In Progress", dot: "bg-sky-400",     text: "text-sky-300",     badge: "badge-progress" },
  in_progress:      { label: "In Progress", dot: "bg-sky-400",     text: "text-sky-300",     badge: "badge-progress" },
  completed:        { label: "Completed",   dot: "bg-emerald-400", text: "text-emerald-300", badge: "badge-complete" },
  complete:         { label: "Complete",    dot: "bg-emerald-400", text: "text-emerald-300", badge: "badge-complete" },
  voided:           { label: "Voided",      dot: "bg-red-400",     text: "text-red-300",     badge: "badge-voided" },
  expired:          { label: "Expired",     dot: "bg-slate-500",   text: "text-slate-400",   badge: "badge-expired" },
};

/* ── component ──────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading, refetch } = useGetDashboardStats();
  const [startOpen, setStartOpen] = useState(false);

  const d = stats as Record<string, unknown> | undefined;
  const actionReq     = Number(d?.actionRequired ?? 0);
  const waitingOthers = Number(d?.waitingForOthers ?? 0);
  const expiringSoon  = Number(d?.expiringSoon ?? 0);
  const totalCompleted= Number(d?.totalCompleted ?? 0);
  const recentSigs    = (d?.recentSignatureRequests as SigRow[]) ?? [];
  const templates     = (d?.recentTemplates as Template[]) ?? [];

  const firstName = user?.fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "";

  return (
    <div className="flex flex-col min-h-full">

      {/* ══ Hero banner — DocuSign-style stats strip ══ */}
      <div className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(14,30,80,0.95) 0%, rgba(40,16,90,0.95) 50%, rgba(10,20,70,0.95) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)"
        }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 30% 50%, rgba(56,160,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 80% 30%, rgba(120,60,255,0.10) 0%, transparent 50%)"
          }}/>

        <div className="relative max-w-screen-xl mx-auto px-8 py-8 flex items-center gap-12">
          {/* Welcome */}
          <div className="min-w-[200px]">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">Welcome back</p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(56,160,255,0.8), rgba(99,50,220,0.8))", border: "1px solid rgba(255,255,255,0.2)" }}>
                {firstName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <p className="text-lg font-bold text-white/90 leading-tight">{firstName || user?.email}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-14 bg-white/10" />

          {/* Stats — identical layout to DocuSign hero */}
          <div className="flex-1 grid grid-cols-4 gap-px">
            {[
              { label: "Action Required",    value: actionReq,      color: "text-amber-300",   glow: "rgba(251,191,36,0.3)" },
              { label: "Waiting for Others", value: waitingOthers,  color: "text-sky-300",     glow: "rgba(56,160,255,0.3)" },
              { label: "Expiring Soon",      value: expiringSoon,   color: "text-red-300",     glow: "rgba(248,113,113,0.3)" },
              { label: "Completed",          value: totalCompleted, color: "text-emerald-300", glow: "rgba(52,211,153,0.3)" },
            ].map((s, i) => (
              <div key={s.label} className={cn("text-center px-6", i > 0 && "border-l border-white/[0.07]")}>
                <p className="text-4xl font-bold leading-none mb-1.5"
                  style={{ color: s.color, textShadow: `0 0 20px ${s.glow}` }}>
                  {isLoading ? "—" : s.value}
                </p>
                <p className="text-[11px] text-white/45 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Last 6 months label */}
          <div className="text-right shrink-0">
            <p className="text-[10px] text-white/25 uppercase tracking-widest">Last 6 Months</p>
            <button onClick={() => refetch()} className="text-[10px] text-sky-400/50 hover:text-sky-400 mt-1 flex items-center gap-1 ml-auto transition-colors">
              <RefreshCw className="w-2.5 h-2.5" />refresh
            </button>
          </div>
        </div>
      </div>

      {/* ══ Body ══ */}
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-8 py-8 space-y-8">

        {/* ── Get Started / Templates section ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white/80">Get Started or Use Templates</h2>
            <Link href="/signature-templates">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-300 border border-sky-500/25 bg-sky-500/8 hover:bg-sky-500/15 transition-all">
                Go to Templates <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {/* Start CTA card */}
            <div className="glass-card rounded-2xl p-5 flex flex-col items-start justify-between relative">
              <div>
                <PenTool className="w-6 h-6 text-sky-400/60 mb-3" />
                <p className="text-sm font-semibold text-white/75 leading-snug">Sign or get<br/>signatures</p>
              </div>
              <div className="relative mt-4 w-full">
                <button
                  onClick={() => setStartOpen(!startOpen)}
                  className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold w-full justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />Start
                  <ChevronRight className={cn("w-3 h-3 transition-transform", startOpen && "rotate-90")} />
                </button>
                {startOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 glass-modal rounded-xl overflow-hidden z-50">
                    {[
                      { label: "Send an Envelope", href: "/esignatures?mode=send" },
                      { label: "Sign a Document",  href: "/esignatures?mode=self" },
                      { label: "Use a Template",   href: "/signature-templates" },
                    ].map(item => (
                      <Link key={item.label} href={item.href}>
                        <button onClick={() => setStartOpen(false)}
                          className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white/90 transition-all border-b border-white/[0.05] last:border-0">
                          {item.label}
                        </button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Template thumbnail cards */}
            {templates.length > 0
              ? templates.slice(0, 4).map(t => (
                <Link key={t.id} href={`/esignatures?templateId=${t.id}&from=template`}>
                  <div className="glass-card glass-card-hover rounded-2xl p-4 h-full cursor-pointer flex flex-col justify-between">
                    {/* Doc preview placeholder */}
                    <div className="flex-1 rounded-xl mb-3 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(56,160,255,0.06))", minHeight: 80, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <FileText className="w-8 h-8 text-sky-400/30" />
                    </div>
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-xs font-semibold text-white/75 leading-snug line-clamp-2">{t.name}</p>
                        <Star className="w-3 h-3 text-amber-400/60 shrink-0 mt-0.5" />
                      </div>
                      <p className="text-[10px] text-white/30">{t.category}</p>
                      {t.updatedAt && <p className="text-[9px] text-white/20 mt-0.5">Last used {timeSince(t.updatedAt)}</p>}
                    </div>
                  </div>
                </Link>
              ))
              : [
                "Authorization for Release of Information from Medical Records",
                "Medical History Questionnaire",
                "Exam Intake Page",
                "OSHA Respirator Questionnaire",
              ].slice(0, 4).map((name, i) => (
                <Link key={i} href="/signature-templates">
                  <div className="glass-card glass-card-hover rounded-2xl p-4 h-full cursor-pointer flex flex-col justify-between">
                    <div className="flex-1 rounded-xl mb-3 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(56,160,255,0.05))", minHeight: 80, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <FileText className="w-7 h-7 text-sky-400/25" />
                    </div>
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-xs font-semibold text-white/60 leading-snug line-clamp-2">{name}</p>
                        <Star className="w-3 h-3 text-amber-400/40 shrink-0 mt-0.5" />
                      </div>
                      <p className="text-[9px] text-white/20">Add template to activate</p>
                    </div>
                  </div>
                </Link>
              ))
            }
          </div>
        </section>

        {/* ── Agreement activity — DocuSign-style feed ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-white/80">Agreement activity</h2>
            <div className="w-4 h-4 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center">
              <span className="text-[9px] text-white/40">?</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_200px_140px_100px] gap-4 px-5 py-2.5 border-b border-white/[0.06]">
              {["Agreement", "Status", "Last Change", ""].map(h => (
                <p key={h} className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{h}</p>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-px">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-14 bg-white/[0.02] animate-pulse" />
                ))}
              </div>
            ) : recentSigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center">
                  <Send className="w-5 h-5 text-white/20" />
                </div>
                <p className="text-sm text-white/30">No agreements yet</p>
                <Link href="/esignatures">
                  <button className="text-xs text-sky-400/60 hover:text-sky-400 transition-colors flex items-center gap-1">
                    Create your first <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            ) : (
              recentSigs.slice(0, 8).map((sig, idx) => {
                const cfg = S[sig.status] ?? S.draft;
                const isComplete = sig.status === "completed" || sig.status === "complete";
                const isVoidedOrExpired = sig.status === "voided" || sig.status === "expired";
                const firstRecipient = sig.recipients?.[0];
                return (
                  <div key={sig.id}
                    className={cn(
                      "grid grid-cols-[1fr_200px_140px_100px] gap-4 items-center px-5 py-3.5",
                      "border-b border-white/[0.04] last:border-0",
                      "hover:bg-white/[0.025] transition-colors cursor-pointer group"
                    )}>
                    {/* Name + recipient */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate group-hover:text-white/95 transition-colors">
                        {sig.title}
                      </p>
                      {firstRecipient && (
                        <p className="text-[11px] text-white/35 mt-0.5 truncate">
                          To: {firstRecipient.name || firstRecipient.email}
                        </p>
                      )}
                    </div>

                    {/* Status — inline like DocuSign */}
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                      <span className={cn("text-xs font-medium", cfg.text)}>{cfg.label}</span>
                      {!isComplete && !isVoidedOrExpired && firstRecipient && (
                        <span className="text-[10px] text-white/25 truncate">· {firstRecipient.name?.split(" ")[0]}</span>
                      )}
                    </div>

                    {/* Date */}
                    <p className="text-xs text-white/40">
                      {timeSince(sig.completedAt ?? sig.createdAt)}
                    </p>

                    {/* Action button — exactly like DocuSign */}
                    <div className="flex justify-end">
                      {isComplete ? (
                        <button className="px-3 py-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] text-xs font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all flex items-center gap-1.5">
                          <Download className="w-3 h-3" />Download
                        </button>
                      ) : isVoidedOrExpired ? (
                        <button className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-transparent text-xs font-semibold text-white/30 cursor-default" disabled>
                          {sig.status === "voided" ? "Voided" : "Expired"}
                        </button>
                      ) : (
                        <button className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-xs font-semibold text-sky-300 hover:bg-sky-500/18 transition-all flex items-center gap-1.5">
                          <Send className="w-3 h-3" />Resend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {recentSigs.length > 0 && (
              <Link href="/agreements">
                <div className="flex items-center justify-center gap-1.5 py-3 border-t border-white/[0.05] text-xs text-sky-400/60 hover:text-sky-400 transition-colors cursor-pointer">
                  View all agreements <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
