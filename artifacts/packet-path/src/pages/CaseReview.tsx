import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetCase, useGetCaseReview, useUpdateCase, getGetCaseReviewQueryKey, getGetCaseQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Lightbulb, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CaseReviewPage({ caseId }: { caseId: number }) {
  const [, setLocation] = useLocation();
  const { data: caseData } = useGetCase(caseId, { query: { enabled: !!caseId, queryKey: getGetCaseQueryKey(caseId) } });
  const { data: review, isLoading } = useGetCaseReview(caseId, { query: { enabled: !!caseId, queryKey: getGetCaseReviewQueryKey(caseId) } });
  const updateCase = useUpdateCase();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!confirm("Submit this case for ExamQA review? The status will be updated to Submitted.")) return;
    updateCase.mutate({ id: caseId, data: { status: "submitted" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
        toast({ title: "Case submitted", description: "The case is now in ExamQA review." });
        setLocation("/cases");
      },
    });
  };

  const completionPct = review?.completionPercent ?? 0;
  const circumference = 2 * Math.PI * 36;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <button
          data-testid="btn-back"
          onClick={() => setLocation(`/cases/${caseId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to Interview
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Packet Review</h1>
            <p className="text-muted-foreground text-sm mt-1">{caseData?.patientName} &mdash; {caseData?.examTypeName}</p>
          </div>
          {caseData?.status !== "submitted" && (
            <button
              data-testid="btn-submit-case"
              onClick={handleSubmit}
              disabled={updateCase.isPending || (review?.requiredMissing?.length ?? 0) > 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
            >
              <Send size={15} /> Submit for Review
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="glass-card rounded-2xl p-8 animate-pulse">
            <div className="h-6 w-48 bg-muted rounded mb-4" />
            <div className="h-4 w-full bg-muted rounded mb-2" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Completion ring */}
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="relative w-24 h-24 mb-4">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
                  <motion.circle
                    cx="40" cy="40" r="36" fill="none"
                    stroke={completionPct === 100 ? "hsl(var(--chart-3))" : "hsl(var(--primary))"}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - (circumference * completionPct) / 100 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{completionPct}%</span>
                </div>
              </div>
              <p className="font-semibold text-foreground text-sm">Overall Completion</p>
              <p className="text-muted-foreground text-xs mt-1">
                {review?.answeredQuestions} of {review?.totalQuestions} questions answered
              </p>
              {completionPct === 100 && (
                <div className="mt-3 flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                  <CheckCircle size={13} /> Ready for submission
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Sections */}
              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-semibold text-foreground text-sm mb-4">Section Status</h2>
                <div className="flex flex-col gap-3">
                  {(review?.sections ?? []).map((section) => (
                    <div key={section.name} data-testid={`section-status-${section.name}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {section.complete ? (
                            <CheckCircle size={14} className="text-emerald-500" />
                          ) : (
                            <AlertCircle size={14} className="text-amber-500" />
                          )}
                          <span className="text-sm font-medium text-foreground">{section.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{section.answered}/{section.total}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-6">
                        <motion.div
                          className={cn("h-full rounded-full", section.complete ? "bg-emerald-500" : "bg-primary")}
                          initial={{ width: 0 }}
                          animate={{ width: `${section.total > 0 ? (section.answered / section.total) * 100 : 0}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing required */}
              {(review?.requiredMissing?.length ?? 0) > 0 && (
                <div className="glass-card rounded-2xl p-5 border border-amber-200 bg-amber-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle size={16} className="text-amber-600" />
                    <h2 className="font-semibold text-amber-800 text-sm">
                      {review?.requiredMissing.length} Required Field{review!.requiredMissing.length > 1 ? "s" : ""} Missing
                    </h2>
                  </div>
                  <div className="flex flex-col gap-2">
                    {review?.requiredMissing.map((item) => (
                      <div key={item.questionId} data-testid={`missing-item-${item.questionId}`}
                        className="flex items-start gap-2 text-xs text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="text-amber-500 font-medium">{item.section}: </span>
                          {item.questionText}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {(review?.recommendations?.length ?? 0) > 0 && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={16} className="text-primary" />
                    <h2 className="font-semibold text-foreground text-sm">Recommendations</h2>
                  </div>
                  <div className="flex flex-col gap-2">
                    {review?.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
