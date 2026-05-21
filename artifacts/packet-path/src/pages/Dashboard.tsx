import { useGetDashboardStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText, CheckCircle, Clock, AlertCircle, Plus,
  PenTool, Send, BarChart2, ArrowRight, RefreshCw, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; badge: string; dot: string; icon: React.ElementType }> = {
  draft:            { label: "Draft",       badge: "badge-draft",     dot: "bg-slate-500",   icon: FileText },
  pending:          { label: "Pending",     badge: "badge-pending",   dot: "bg-amber-400",   icon: Clock },
  partially_signed: { label: "In Progress", badge: "badge-progress",  dot: "bg-sky-400",     icon: Clock },
  in_progress:      { label: "In Progress", badge: "badge-progress",  dot: "bg-sky-400",     icon: Clock },
  completed:        { label: "Completed",   badge: "badge-complete",  dot: "bg-emerald-400", icon: CheckCircle },
  complete:         { label: "Complete",    badge: "badge-complete",  dot: "bg-emerald-400", icon: CheckCircle },
  submitted:        { label: "Submitted",   badge: "badge-complete",  dot: "bg-emerald-400", icon: CheckCircle },
  voided:           { label: "Voided",      badge: "badge-voided",    dot: "bg-red-400",     icon: AlertCircle },
  expired:          { label: "Expired",     badge: "badge-expired",   dot: "bg-slate-500",   icon: AlertCircle },
};

type SigRow = {
  id: number; title: string; status: string;
  recipientCount: number; signedCount: number;
  createdAt: string; completedAt: string | null; expiresAt: string | null;
};

function StatCard({ label, value, sub, color, icon: Icon, glow }: {
  label: string; value: number | string; sub?: string;
  color: string; icon: React.ElementType; glow: string;
}) {
  return (
    <div className="stat-card p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}
        style={{ boxShadow: glow }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white/90 leading-tight">{value}</p>
        <p className="text-xs font-semibold text-white/50 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading, refetch } = useGetDashboardStats();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "";

  const recentSigs: SigRow[] = (stats as Record<string,unknown>)?.recentSignatureRequests as SigRow[] ?? [];
  const totalCases    = Number((stats as Record<string,unknown>)?.totalCases ?? 0);
  const inProgress    = Number((stats as Record<string,unknown>)?.inProgressCases ?? 0);
  const completed     = Number((stats as Record<string,unknown>)?.completedCases ?? 0);
  const actionReq     = Number((stats as Record<string,unknown>)?.actionRequired ?? 0);
  const waitingOthers = Number((stats as Record<string,unknown>)?.waitingForOthers ?? 0);
  const expiringSoon  = Number((stats as Record<string,unknown>)?.expiringSoon ?? 0);
  const totalCompleted= Number((stats as Record<string,unknown>)?.totalCompleted ?? 0);

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">
            {greeting}{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="text-sm text-white/40 mt-1">Here's your workflow overview</p>
        </motion.div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/40 text-xs hover:text-white/70 hover:bg-white/[0.08] transition-all">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
          <Link href="/cases/new">
            <button className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold">
              <Plus className="w-4 h-4" />New Case
            </button>
          </Link>
        </div>
      </div>

      {/* Primary stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <StatCard label="Total Cases"     value={isLoading ? "—" : totalCases}    color="bg-sky-500/15 text-sky-300"     glow="0 0 12px rgba(56,160,255,0.2)"  icon={FileText}    />
        <StatCard label="In Progress"     value={isLoading ? "—" : inProgress}    color="bg-amber-500/15 text-amber-300"  glow="0 0 12px rgba(251,191,36,0.2)"  icon={Clock}       />
        <StatCard label="Completed"       value={isLoading ? "—" : completed}     color="bg-emerald-500/15 text-emerald-300" glow="0 0 12px rgba(52,211,153,0.2)" icon={CheckCircle} sub={`${totalCompleted} submitted`} />
        <StatCard label="Action Required" value={isLoading ? "—" : actionReq}     color="bg-red-500/15 text-red-300"     glow="0 0 12px rgba(248,113,113,0.2)" icon={AlertCircle} />
      </motion.div>

      {/* Secondary stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        {[
          { label: "Action Required",    value: actionReq,     color: "text-amber-400" },
          { label: "Waiting for Others", value: waitingOthers, color: "text-sky-400" },
          { label: "Expiring Soon",      value: expiringSoon,  color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <p className={cn("text-2xl font-bold", s.color)}>{isLoading ? "—" : s.value}</p>
            <p className="text-xs text-white/40 leading-snug">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Recent activity + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent signature requests */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
          className="lg:col-span-2 glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white/80">Recent Activity</h2>
              <p className="text-[10px] text-white/35 mt-0.5">Latest signature requests</p>
            </div>
            <Link href="/agreements">
              <button className="text-[10px] text-sky-400/70 hover:text-sky-400 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse"/>
              ))}
            </div>
          ) : recentSigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <PenTool className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-sm text-white/30">No signature requests yet</p>
              <Link href="/esignatures">
                <button className="text-xs text-sky-400/70 hover:text-sky-400 transition-colors flex items-center gap-1">
                  Create your first <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentSigs.slice(0, 6).map(sig => {
                const cfg = statusConfig[sig.status] ?? statusConfig.draft;
                const Icon = cfg.icon;
                return (
                  <Link key={sig.id} href={`/esignatures/${sig.id}`}>
                    <div className="glass-table-row flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/[0.04] transition-all">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{sig.title}</p>
                        <p className="text-[10px] text-white/35">
                          {sig.signedCount}/{sig.recipientCount} signed ·{" "}
                          {new Date(sig.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                        </p>
                      </div>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", cfg.badge)}>
                        {cfg.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick actions + Get started */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-col gap-4"
        >
          {/* Get started checklist */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white/80">Get started</h2>
              <span className="text-[10px] text-white/30 bg-white/[0.06] px-2 py-0.5 rounded-full">
                {[totalCases > 0, true, totalCompleted > 0].filter(Boolean).length}/3
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: "Create your first case",     done: totalCases > 0,      href: "/cases/new" },
                { label: "Set up a template",          done: false,               href: "/signature-templates" },
                { label: "Send a signature request",   done: totalCompleted > 0,  href: "/esignatures" },
              ].map(item => (
                <Link key={item.label} href={item.href}>
                  <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group">
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                      item.done
                        ? "bg-emerald-500/20 border-emerald-500/40"
                        : "border-white/20 group-hover:border-sky-400/40"
                    )}>
                      {item.done && <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                    <span className={cn(
                      "text-xs transition-colors",
                      item.done ? "text-white/30 line-through" : "text-white/60 group-hover:text-white/80"
                    )}>
                      {item.label}
                    </span>
                    {!item.done && <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-sky-400/60 ml-auto transition-colors" />}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/80 mb-3">Quick actions</h2>
            <div className="space-y-1">
              {[
                { label: "New signature request", icon: Send,          href: "/esignatures" },
                { label: "View all agreements",   icon: FileText,      href: "/agreements" },
                { label: "Manage templates",      icon: PenTool,       href: "/signature-templates" },
                { label: "Analytics",             icon: BarChart2,     href: "/analytics" },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <Link key={a.label} href={a.href}>
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-all group">
                      <Icon className="w-3.5 h-3.5 text-sky-400/50 group-hover:text-sky-400 transition-colors" />
                      {a.label}
                      <ChevronRight className="w-3 h-3 ml-auto text-white/15 group-hover:text-white/35 transition-colors" />
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
