import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetCase, useGetCaseReview, useUpdateCase, getGetCaseReviewQueryKey, getGetCaseQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Download,
  Flag,
  GitBranch,
  Loader2,
  MessageSquareText,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewFollowUp {
  questionId: number;
  questionText: string;
  answer: string;
  depth: number;
  section: string;
}

interface ResponseGroup {
  sourceQuestionId: number;
  sourceQuestionText: string;
  sourceAnswer: string;
  section: string;
  required: boolean;
  followUps: ReviewFollowUp[];
}

interface ReviewAction {
  id: number;
  action: string;
  note: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  createdAt: string;
}

interface ReviewWorkspace {
  case: {
    id: number;
    patientName: string;
    patientDob: string | null;
    status: string;
    completionPercent: number;
    examTypeName: string;
  };
  responseGroups: ResponseGroup[];
  reviewActions: ReviewAction[];
  reviewSummary: {
    sourceQuestionCount: number;
    unansweredSourceQuestions: number;
    latestDisposition: string | null;
    latestDispositionNote: string | null;
  };
}

function formatAnswer(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Not answered";
  if (trimmed.toLowerCase() === "yes") return "Yes";
  if (trimmed.toLowerCase() === "no") return "No";
  return trimmed.replace(/\|\|/g, ", ");
}

function answerTone(answer: string) {
  const normalized = answer.trim().toLowerCase();
  if (normalized === "yes" || normalized === "unsure") return "border-amber-300/30 bg-amber-300/10 text-amber-700 dark:text-amber-200";
  if (normalized === "no") return "border-emerald-300/30 bg-emerald-300/10 text-emerald-700 dark:text-emerald-200";
  return "border-border bg-muted/30 text-foreground";
}

export default function CaseReviewPage({ caseId }: { caseId: number }) {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { data: caseData } = useGetCase(caseId, { query: { enabled: !!caseId, queryKey: getGetCaseQueryKey(caseId) } });
  const { data: review, isLoading } = useGetCaseReview(caseId, { query: { enabled: !!caseId, queryKey: getGetCaseReviewQueryKey(caseId) } });
  const updateCase = useUpdateCase();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<ReviewWorkspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/review-workspace`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Unable to load review details");
      setWorkspace(payload);
    } catch (err: any) {
      toast({ title: err?.message || "Unable to load review details", variant: "destructive" });
    } finally {
      setWorkspaceLoading(false);
    }
  }, [caseId, token, toast]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  const handleSubmit = () => {
    if (!confirm("Submit this case for ExamQA review? The status will be updated to Submitted.")) return;
    updateCase.mutate({ id: caseId, data: { status: "submitted" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
        toast({ title: "Case submitted", description: "The case is now in ExamQA review." });
        void loadWorkspace();
      },
    });
  };

  const saveReviewAction = async (action: "note" | "flag" | "approved") => {
    if ((action === "note" || action === "flag") && !reviewNote.trim()) {
      toast({ title: action === "flag" ? "Add the reason for the flag" : "Enter a review note" });
      return;
    }
    setReviewSaving(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/review-actions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: reviewNote.trim() || null }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Unable to save review action");
      toast({
        title: action === "approved" ? "Medical history approved" : action === "flag" ? "Review flag recorded" : "Review note added",
      });
      setReviewNote("");
      await loadWorkspace();
    } catch (err: any) {
      toast({ title: err?.message || "Unable to save review action", variant: "destructive" });
    } finally {
      setReviewSaving(false);
    }
  };

  const downloadResponseRecord = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/medical-history-response.pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Unable to create response record");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medical-history-response-${caseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: err?.message || "Download failed", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const completionPct = review?.completionPercent ?? 0;
  const circumference = 2 * Math.PI * 36;
  const latestDisposition = workspace?.reviewSummary.latestDisposition;

  return (
    <div className="mx-auto max-w-6xl p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <button
          data-testid="btn-back"
          onClick={() => setLocation(`/cases/${caseId}`)}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} /> Back to Questionnaire
        </button>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">ExamQA Medical History Review</h1>
              {latestDisposition && (
                <span className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                  latestDisposition === "approved" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-700 dark:text-emerald-200" : "border-amber-300/30 bg-amber-300/10 text-amber-700 dark:text-amber-200",
                )}>{latestDisposition}</span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{caseData?.patientName} &mdash; {caseData?.examTypeName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void downloadResponseRecord()}
              disabled={downloading}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
            >
              {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Response PDF
            </button>
            {caseData?.status !== "submitted" && (
              <button
                data-testid="btn-submit-case"
                onClick={handleSubmit}
                disabled={updateCase.isPending || (review?.requiredMissing?.length ?? 0) > 0}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Send size={15} /> Submit for Review
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-5 text-center">
            <div className="relative mb-3 h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
                <motion.circle
                  cx="40" cy="40" r="36" fill="none"
                  stroke={completionPct === 100 ? "hsl(var(--chart-3))" : "hsl(var(--primary))"}
                  strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference}
                  animate={{ strokeDashoffset: circumference - (circumference * completionPct) / 100 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold text-foreground">{completionPct}%</span></div>
            </div>
            <p className="text-sm font-semibold text-foreground">Questionnaire completion</p>
            <p className="mt-1 text-xs text-muted-foreground">{review?.answeredQuestions ?? 0} of {review?.totalQuestions ?? 0} applicable questions</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Section status</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {(review?.sections ?? []).map(section => (
                <div key={section.name} data-testid={`section-status-${section.name}`} className="rounded-xl border border-border p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {section.complete ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-amber-500" />}
                      <span className="text-xs font-medium text-foreground">{section.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{section.answered}/{section.total}</span>
                  </div>
                  <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", section.complete ? "bg-emerald-500" : "bg-primary")} style={{ width: `${section.total > 0 ? (section.answered / section.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(review?.requiredMissing?.length ?? 0) > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <div className="mb-3 flex items-center gap-2"><XCircle size={16} className="text-amber-600" /><h2 className="text-sm font-semibold text-amber-900">Incomplete required responses</h2></div>
            <div className="grid gap-2 md:grid-cols-2">
              {review?.requiredMissing.map(item => (
                <div key={item.questionId} className="rounded-xl bg-white/60 p-3 text-xs text-amber-800"><span className="font-semibold">{item.section}: </span>{item.questionText}</div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Questionnaire responses</h2>
                <p className="mt-1 text-sm text-muted-foreground">Original source question wording is shown first. Adaptive details stay attached underneath the question that triggered them.</p>
              </div>
              {workspace && <span className="text-xs text-muted-foreground">{workspace.reviewSummary.sourceQuestionCount} source questions</span>}
            </div>

            {workspaceLoading ? (
              <div className="glass-card flex items-center justify-center rounded-2xl p-10 text-sm text-muted-foreground"><Loader2 className="mr-2 animate-spin" size={17} /> Loading responses...</div>
            ) : (
              <div className="space-y-4">
                {(workspace?.responseGroups ?? []).map(group => (
                  <div key={group.sourceQuestionId} className="glass-card rounded-2xl border border-border/70 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.section}</p>
                        <h3 className="mt-1 text-sm font-semibold leading-6 text-foreground">{group.sourceQuestionText}</h3>
                      </div>
                      <div className={cn("max-w-[260px] rounded-xl border px-3 py-2 text-sm font-medium", answerTone(group.sourceAnswer))}>{formatAnswer(group.sourceAnswer)}</div>
                    </div>

                    {group.followUps.length > 0 && (
                      <div className="mt-4 space-y-2 border-l-2 border-primary/20 pl-4">
                        {group.followUps.map(followUp => (
                          <div key={followUp.questionId} className="rounded-xl border border-border/70 bg-muted/20 p-3" style={{ marginLeft: `${Math.min((followUp.depth - 1) * 12, 36)}px` }}>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"><GitBranch size={11} /> Additional detail</div>
                            <p className="text-xs font-medium leading-5 text-foreground">{followUp.questionText}</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/85">{formatAnswer(followUp.answer)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="glass-card rounded-2xl p-5 xl:sticky xl:top-6">
              <div className="flex items-center gap-2"><ShieldCheck size={17} className="text-primary" /><h2 className="text-sm font-semibold text-foreground">ExamQA review</h2></div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Reviewer notes and dispositions are internal records. They do not alter the source questionnaire answers.</p>
              <textarea
                value={reviewNote}
                onChange={event => setReviewNote(event.target.value)}
                rows={5}
                placeholder="Add an internal review note or explain a flag..."
                className="mt-4 w-full resize-y rounded-xl border border-border bg-background/60 p-3 text-sm leading-6 text-foreground outline-none focus:border-primary/60"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => void saveReviewAction("note")} disabled={reviewSaving} className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50"><MessageSquareText size={13} /> Add note</button>
                <button onClick={() => void saveReviewAction("flag")} disabled={reviewSaving} className="flex items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-200 disabled:opacity-50"><Flag size={13} /> Flag</button>
              </div>
              <button onClick={() => void saveReviewAction("approved")} disabled={reviewSaving || completionPct < 100} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"><CheckCircle size={14} /> Approve medical history</button>

              <div className="mt-5 border-t border-border pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Review history</h3>
                <div className="mt-3 space-y-3">
                  {(workspace?.reviewActions ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No reviewer actions yet.</p>
                  ) : [...(workspace?.reviewActions ?? [])].reverse().map(action => (
                    <div key={action.id} className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wide text-primary">{action.action}</span><span className="text-[10px] text-muted-foreground">{new Date(action.createdAt).toLocaleString()}</span></div>
                      {action.note && <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-foreground">{action.note}</p>}
                      <p className="mt-1 text-[10px] text-muted-foreground">{action.reviewerName || action.reviewerEmail || "Reviewer"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}
