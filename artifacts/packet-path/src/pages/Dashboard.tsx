import { useGetDashboardStats, useListCases, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Plus, ArrowRight, PenTool, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100", icon: FileText },
  in_progress: { label: "In Progress", color: "text-[#8dbeb5]", bg: "bg-[#8dbeb5]/15", icon: Clock },
  complete: { label: "Complete", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
  submitted: { label: "Submitted", color: "text-[#8dbeb5]", bg: "bg-[#8dbeb5]/15", icon: CheckCircle },
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

export default function DashboardPage() {
  const { user, token } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });

  const statusCounts = stats?.casesByStatus ?? [];
  const inProgress = statusCounts.find(s => s.status === "in_progress")?.count ?? 0;
  const complete = statusCounts.find(s => s.status === "complete")?.count ?? 0;
  const submitted = statusCounts.find(s => s.status === "submitted")?.count ?? 0;

  const isEmptyWorkspace = (stats?.totalCases ?? 0) === 0;
  const [hasTemplate, setHasTemplate] = useState(false);
  const [hasSignatureRequest, setHasSignatureRequest] = useState(false);

  useEffect(() => {
    const loadOnboardingSignals = async () => {
      try {
        const [tmplRes, reqRes] = await Promise.all([
          fetch("/api/signature-templates", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/signature-requests", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (tmplRes.ok) {
          const templates = await tmplRes.json();
          setHasTemplate(Array.isArray(templates) && templates.length > 0);
        }
        if (reqRes.ok) {
          const requestsPayload = await reqRes.json();
          const requests = Array.isArray(requestsPayload?.requests) ? requestsPayload.requests : [];
          setHasSignatureRequest(requests.length > 0);
        }
      } catch {
        // Ignore onboarding hint failures to keep dashboard resilient.
      }
    };
    if (token) loadOnboardingSignals();
  }, [token]);

  const checklistDone = [
    (stats?.totalCases ?? 0) > 0,
    hasTemplate,
    hasSignatureRequest,
  ].filter(Boolean).length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Good morning, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your exam workflow overview</p>
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
          <StatCard label="Total Cases" value={stats?.totalCases ?? 0} icon={FileText}
            iconBg="linear-gradient(135deg, #527b78, #3f6461)" />
          <StatCard label="In Progress" value={inProgress} icon={Clock}
            iconBg="linear-gradient(135deg, #8dbeb5, #527b78)" />
          <StatCard label="Complete" value={complete + submitted}
            sub="Ready for review" icon={CheckCircle}
            iconBg="linear-gradient(135deg, #10b981, #14b8a6)" />
          <StatCard label="Avg Completion" value={`${stats?.avgCompletionPercent ?? 0}%`}
            sub="Across all cases" icon={TrendingUp}
            iconBg="linear-gradient(135deg, #8dbeb5, #527b78)" />
        </div>
      )}


      {isEmptyWorkspace && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass rounded-3xl p-5 mb-6 border border-white/20">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8dbeb5] to-[#527b78] text-white flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Workspace is empty — here’s the fastest way to see the full DocuSign-style flow</p>
              <div className="grid sm:grid-cols-3 gap-2 mt-3 text-xs">
                <div className="rounded-xl bg-[#052a32]/65 border border-white/20 px-3 py-2">
                  <Link href="/cases/new"><button className="text-left hover:underline">1. Create a case</button></Link>
                  <p className="mt-2 text-[11px] text-muted-foreground">Status: {(stats?.totalCases ?? 0) > 0 ? "Complete" : "Not started"}</p>
                </div>
                <div className="rounded-xl bg-[#052a32]/65 border border-white/20 px-3 py-2">
                  <Link href="/signature-templates"><button className="text-left hover:underline">2. Create template</button></Link>
                  <p className="mt-2 text-[11px] text-muted-foreground">Status: {hasTemplate ? "Complete" : "Not started"}</p>
                </div>
                <div className="rounded-xl bg-[#052a32]/65 border border-white/20 px-3 py-2">
                  <Link href="/esignatures"><button className="text-left hover:underline flex items-center gap-1">3. Send signature request <PenTool size={12} /></button></Link>
                  <p className="mt-2 text-[11px] text-muted-foreground">Status: {hasSignatureRequest ? "Complete" : "Not started"}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Progress: {checklistDone}/3 complete (auto-tracked)</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent cases */}
        <div className="lg:col-span-2">
          <div className="liquid-glass rounded-3xl overflow-hidden relative glass-highlight">
            <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between">
              <h2 className="font-semibold text-foreground text-sm">Recent Cases</h2>
              <Link href="/cases">
                <button className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </button>
              </Link>
            </div>
            <div className="divide-y divide-white/15">
              {isLoading ? (
                Array.from({length: 4}).map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded ml-auto" />
                  </div>
                ))
              ) : stats?.recentCases?.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                  No cases yet. Create your first case to get started.
                </div>
              ) : (
                stats?.recentCases?.map((c) => {
                  const cfg = statusConfig[c.status] ?? statusConfig.draft;
                  return (
                    <Link key={c.id} href={`/cases/${c.id}`}>
                      <div
                        data-testid={`case-row-${c.id}`}
                        className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{c.patientName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.examTypeName}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-1.5 w-28">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${c.completionPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{c.completionPercent}%</span>
                          </div>
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", cfg.bg, cfg.color)}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* By exam type */}
        <div>
          <div className="liquid-glass rounded-3xl overflow-hidden relative glass-highlight">
            <div className="px-6 py-4 border-b border-white/20">
              <h2 className="font-semibold text-foreground text-sm">By Exam Type</h2>
            </div>
            <div className="p-6 flex flex-col gap-3">
              {isLoading ? (
                Array.from({length: 4}).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 w-24 bg-muted rounded mb-2" />
                    <div className="h-2 w-full bg-muted rounded" />
                  </div>
                ))
              ) : stats?.casesByExamType?.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>
              ) : (
                stats?.casesByExamType?.map((et) => {
                  const pct = stats.totalCases > 0 ? Math.round((et.count / stats.totalCases) * 100) : 0;
                  return (
                    <div key={et.examTypeName} data-testid={`exam-type-stat-${et.examTypeName}`}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-foreground font-medium">{et.examTypeName}</span>
                        <span className="text-muted-foreground">{et.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#8dbeb5] to-[#527b78] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
