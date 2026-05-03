import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListCases, useListExamTypes, useDeleteCase, getListCasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Eye, ClipboardCheck, FileText, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-400" },
  in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
  complete: { label: "Complete", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  submitted: { label: "Submitted", color: "text-violet-600", bg: "bg-violet-50", dot: "bg-violet-500" },
};

export default function CasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("");
  const { data: cases, isLoading } = useListCases({}, { query: { queryKey: getListCasesQueryKey() } });
  const { data: examTypes } = useListExamTypes();
  const deleteCase = useDeleteCase();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = (cases ?? []).filter(c => {
    const matchSearch = !search || c.patientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchExamType = !examTypeFilter || c.examTypeId === Number(examTypeFilter);
    return matchSearch && matchStatus && matchExamType;
  });

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete case for ${name}? This cannot be undone.`)) return;
    deleteCase.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
        toast({ title: "Case deleted" });
      },
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">All Cases</h1>
          <p className="text-muted-foreground text-sm mt-1">{cases?.length ?? 0} total cases</p>
        </motion.div>
        <Link href="/cases/new">
          <button
            data-testid="btn-cases-new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={15} /> New Case
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            data-testid="input-search-cases"
            type="search"
            placeholder="Search patients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          data-testid="select-status-filter"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary text-foreground"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
          <option value="submitted">Submitted</option>
        </select>
        <select
          data-testid="select-exam-type-filter"
          value={examTypeFilter}
          onChange={e => setExamTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary text-foreground"
        >
          <option value="">All Exam Types</option>
          {(examTypes ?? []).map(et => (
            <option key={et.id} value={et.id}>{et.name}</option>
          ))}
        </select>
      </div>

      {/* Cases grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded mb-3" />
              <div className="h-3 w-20 bg-muted rounded mb-4" />
              <div className="h-2 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <FileText size={40} className="text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-foreground font-medium">No cases found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {search || statusFilter || examTypeFilter ? "Try adjusting your filters" : "Create your first case to get started"}
          </p>
          {!search && !statusFilter && !examTypeFilter && (
            <Link href="/cases/new">
              <button className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Create Case
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c, i) => {
            const cfg = statusConfig[c.status] ?? statusConfig.draft;
            return (
              <motion.div
                key={c.id}
                data-testid={`case-card-${c.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{c.patientName}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{c.examTypeName}</p>
                    {c.patientDob && <p className="text-muted-foreground text-xs">DOB: {c.patientDob}</p>}
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1.5 shrink-0 ml-2", cfg.bg, cfg.color)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="text-foreground font-medium">{c.completionPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        c.completionPercent === 100 ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${c.completionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/cases/${c.id}`}>
                    <button
                      data-testid={`btn-open-case-${c.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/8 hover:bg-primary/15 text-primary text-xs font-medium transition-colors"
                    >
                      <Eye size={13} /> Open
                    </button>
                  </Link>
                  {c.completionPercent > 0 && (
                    <Link href={`/cases/${c.id}/review`}>
                      <button
                        data-testid={`btn-review-case-${c.id}`}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-colors"
                      >
                        <ClipboardCheck size={13} /> Review
                      </button>
                    </Link>
                  )}
                  <button
                    data-testid={`btn-delete-case-${c.id}`}
                    onClick={() => handleDelete(c.id, c.patientName)}
                    className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <p className="text-muted-foreground text-xs mt-3">
                  Updated {new Date(c.updatedAt).toLocaleDateString()}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
