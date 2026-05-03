import { useGetDashboardStats, useListCases, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100", icon: FileText },
  in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", icon: Clock },
  complete: { label: "Complete", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
  submitted: { label: "Submitted", color: "text-violet-600", bg: "bg-violet-50", icon: CheckCircle },
};

function StatCard({ label, value, sub, icon: Icon, gradient }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-foreground text-2xl font-semibold mt-1.5 tracking-tight">{value}</p>
          {sub && <p className="text-muted-foreground text-xs mt-1">{sub}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", gradient)}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });

  const statusCounts = stats?.casesByStatus ?? [];
  const inProgress = statusCounts.find(s => s.status === "in_progress")?.count ?? 0;
  const complete = statusCounts.find(s => s.status === "complete")?.count ?? 0;
  const submitted = statusCounts.find(s => s.status === "submitted")?.count ?? 0;

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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
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
            gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatCard label="In Progress" value={inProgress} icon={Clock}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
          <StatCard label="Complete" value={complete + submitted}
            sub="Ready for review" icon={CheckCircle}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-500" />
          <StatCard label="Avg Completion" value={`${stats?.avgCompletionPercent ?? 0}%`}
            sub="Across all cases" icon={TrendingUp}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent cases */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground text-sm">Recent Cases</h2>
              <Link href="/cases">
                <button className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </button>
              </Link>
            </div>
            <div className="divide-y divide-border">
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
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
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
                          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
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
