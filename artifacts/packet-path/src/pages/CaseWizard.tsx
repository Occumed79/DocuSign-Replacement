import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetCase, useListQuestions, useGetCaseAnswers, useUpsertCaseAnswers, useUpdateCase,
  getGetCaseQueryKey, getListQuestionsQueryKey, getGetCaseAnswersQueryKey, getGetCaseReviewQueryKey
} from "@workspace/api-client-react";
import type { Question } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ClipboardCheck, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type AnswerMap = Record<number, string>;

function YesNoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      {["yes", "no"].map((opt) => (
        <button
          key={opt}
          type="button"
          data-testid={`yn-${opt}`}
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 py-3 rounded-2xl border-2 text-sm font-semibold capitalize transition-all",
            value === opt
              ? opt === "yes"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-red-400 bg-red-50 text-red-700"
              : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
          )}
        >
          {opt === "yes" ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

function QuestionInput({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  switch (q.answerType) {
    case "yes_no":
      return <YesNoInput value={value} onChange={onChange} />;

    case "dropdown":
      return (
        <select
          data-testid="input-dropdown"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/50 text-sm outline-none focus:border-primary/50 transition-all text-foreground backdrop-blur-sm"
        >
          <option value="">Select an option...</option>
          {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );

    case "multi_select": {
      const selected = value ? value.split("||") : [];
      return (
        <div className="flex flex-col gap-2">
          {q.options.map(opt => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                data-testid={`multi-${opt}`}
                onClick={() => {
                  const next = checked ? selected.filter(s => s !== opt) : [...selected, opt];
                  onChange(next.join("||"));
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm text-left transition-all",
                  checked
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                  checked ? "border-primary bg-primary" : "border-border"
                )}>
                  {checked && <Check size={12} className="text-white" />}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    case "date":
      return (
        <input
          data-testid="input-date"
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/50 text-sm outline-none focus:border-primary/50 transition-all text-foreground backdrop-blur-sm"
        />
      );

    case "number":
      return (
        <input
          data-testid="input-number"
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/50 text-sm outline-none focus:border-primary/50 transition-all backdrop-blur-sm"
          placeholder="Enter a number..."
        />
      );

    default:
      return (
        <textarea
          data-testid="input-text"
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/50 text-sm outline-none focus:border-primary/50 transition-all resize-none backdrop-blur-sm"
          placeholder="Type your answer..."
        />
      );
  }
}

export default function CaseWizardPage({ caseId }: { caseId: number }) {
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: caseData, isLoading: caseLoading } = useGetCase(caseId, {
    query: { enabled: !!caseId, queryKey: getGetCaseQueryKey(caseId) }
  });
  const { data: allQuestions = [], isLoading: qLoading } = useListQuestions(
    { exam_type_id: caseData?.examTypeId },
    { query: { enabled: !!caseData?.examTypeId, queryKey: getListQuestionsQueryKey({ exam_type_id: caseData?.examTypeId }) } }
  );
  const { data: savedAnswers = [] } = useGetCaseAnswers(caseId, {
    query: { enabled: !!caseId, queryKey: getGetCaseAnswersQueryKey(caseId) }
  });
  const upsertAnswers = useUpsertCaseAnswers();
  const updateCase = useUpdateCase();

  // Load saved answers into local state
  useEffect(() => {
    if (savedAnswers.length > 0) {
      const map: AnswerMap = {};
      savedAnswers.forEach(a => { map[a.questionId] = a.value; });
      setAnswers(map);
    }
  }, [savedAnswers]);

  // Group questions by section
  const sections = (() => {
    const map = new Map<string, Question[]>();
    allQuestions.forEach(q => {
      if (!map.has(q.section)) map.set(q.section, []);
      map.get(q.section)!.push(q);
    });
    return Array.from(map.entries()).map(([name, questions]) => ({ name, questions }));
  })();

  const currentSection = sections[currentSectionIdx];
  const totalSections = sections.length;

  // Get visible questions for current section (respecting follow-up logic)
  const getVisibleQuestions = useCallback((sectionQuestions: Question[]): Question[] => {
    const allFollowUpIds = new Set(sectionQuestions.flatMap(q => q.followUpIds ?? []));
    const result: Question[] = [];
    for (const q of sectionQuestions) {
      // If this question is a follow-up, only show if its parent triggered it
      if (allFollowUpIds.has(q.id)) {
        const parent = sectionQuestions.find(p => (p.followUpIds ?? []).includes(q.id));
        if (!parent) continue;
        const parentAnswer = answers[parent.id] ?? "";
        if (parent.triggerValue && parentAnswer.toLowerCase() !== parent.triggerValue.toLowerCase()) continue;
      }
      result.push(q);
    }
    return result;
  }, [answers]);

  const visibleQuestions = currentSection ? getVisibleQuestions(currentSection.questions) : [];

  // Check if all required visible questions in current section are answered
  const sectionComplete = visibleQuestions
    .filter(q => q.required)
    .every(q => {
      const v = answers[q.id] ?? "";
      return v.trim() !== "";
    });

  const overallProgress = (() => {
    if (allQuestions.length === 0) return 0;
    const allVisible: Question[] = [];
    sections.forEach(s => allVisible.push(...getVisibleQuestions(s.questions)));
    const answered = allVisible.filter(q => (answers[q.id] ?? "").trim() !== "").length;
    return Math.round((answered / allVisible.length) * 100);
  })();

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const saveAnswers = async () => {
    const answerList = Object.entries(answers)
      .filter(([, v]) => v.trim() !== "")
      .map(([qId, value]) => ({ questionId: Number(qId), value }));

    if (answerList.length === 0) return;

    setIsSaving(true);
    try {
      await new Promise<void>((resolve, reject) => {
        upsertAnswers.mutate({ id: caseId, data: { answers: answerList } }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetCaseAnswersQueryKey(caseId) });
            queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
            queryClient.invalidateQueries({ queryKey: getGetCaseReviewQueryKey(caseId) });
            resolve();
          },
          onError: reject,
        });
      });
    } catch {
      toast({ title: "Failed to save answers", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    await saveAnswers();
    if (currentSectionIdx < totalSections - 1) {
      setCurrentSectionIdx(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast({ title: "All sections complete!", description: "Redirecting to review..." });
      setLocation(`/cases/${caseId}/review`);
    }
  };

  const handlePrev = async () => {
    await saveAnswers();
    setCurrentSectionIdx(prev => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (caseLoading || qLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-8 animate-pulse">
          <div className="h-5 w-48 bg-muted rounded mb-6" />
          {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl mb-4" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          data-testid="btn-back"
          onClick={() => setLocation("/cases")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          data-testid="btn-view-review"
          onClick={() => setLocation(`/cases/${caseId}/review`)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ClipboardCheck size={15} /> View Review
        </button>
      </div>

      {/* Case header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">{caseData?.patientName}</h1>
        <p className="text-muted-foreground text-sm">{caseData?.examTypeName} &mdash; Interview</p>
      </motion.div>

      {/* Overall progress */}
      <div className="liquid-glass rounded-3xl p-4 mb-6 relative glass-highlight">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground font-medium">Overall Progress</span>
          <span className="text-foreground font-semibold">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {/* Section breadcrumb */}
        <div className="flex items-center gap-1 mt-3 flex-wrap">
          {sections.map((s, i) => {
            const sectionAnswered = getVisibleQuestions(s.questions).filter(q => q.required).every(q => (answers[q.id] ?? "").trim() !== "");
            return (
              <div key={s.name} className="flex items-center gap-1">
                <button
                  data-testid={`section-tab-${i}`}
                  onClick={async () => { await saveAnswers(); setCurrentSectionIdx(i); }}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full transition-all font-medium",
                    i === currentSectionIdx
                      ? "bg-primary text-primary-foreground"
                      : sectionAnswered
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {i === currentSectionIdx && <span className="mr-1">{i + 1}.</span>}{s.name}
                </button>
                {i < sections.length - 1 && <ChevronRight size={10} className="text-muted-foreground" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current section questions */}
      {currentSection && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSectionIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="liquid-glass rounded-3xl p-6 relative glass-highlight">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                    Section {currentSectionIdx + 1} of {totalSections}
                  </p>
                  <h2 className="text-lg font-semibold text-foreground">{currentSection.name}</h2>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {visibleQuestions.filter(q => (answers[q.id] ?? "").trim() !== "").length}/{visibleQuestions.length} answered
                </span>
              </div>

              <div className="flex flex-col gap-6">
                {visibleQuestions.map((q, qi) => {
                  const isFollowUp = currentSection.questions.some(
                    p => (p.followUpIds ?? []).includes(q.id)
                  );
                  return (
                    <motion.div
                      key={q.id}
                      data-testid={`question-${q.id}`}
                      initial={isFollowUp ? { opacity: 0, height: 0 } : false}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex flex-col gap-3",
                        isFollowUp && "pl-4 border-l-2 border-primary/20 ml-2"
                      )}
                    >
                      <div>
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground text-xs mt-0.5 shrink-0 font-medium">
                            {qi + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                              {q.text}
                              {q.required && <span className="text-destructive ml-1 text-xs">*</span>}
                            </p>
                            {q.helpText && (
                              <p className="text-xs text-muted-foreground mt-1">{q.helpText}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={isFollowUp ? "ml-5" : "ml-5"}>
                        <QuestionInput
                          q={q}
                          value={answers[q.id] ?? ""}
                          onChange={(v) => handleAnswer(q.id, v)}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              {currentSectionIdx > 0 && (
                <button
                  data-testid="btn-prev-section"
                  onClick={handlePrev}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-foreground transition-all disabled:opacity-50"
                  style={{
                    background: "rgba(255,255,255,0.50)",
                    border: "1px solid rgba(255,255,255,0.50)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)",
                  }}
                >
                  <ArrowLeft size={15} /> Previous
                </button>
              )}
              <button
                data-testid="btn-next-section"
                onClick={handleNext}
                disabled={isSaving}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all",
                  sectionComplete
                    ? "text-white"
                    : "bg-muted text-muted-foreground"
                )}
                style={sectionComplete ? {
                  background: "linear-gradient(135deg, hsl(210, 100%, 52%), hsl(250, 80%, 60%))",
                  boxShadow: "0 4px 16px rgba(56, 140, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.12)",
                } : undefined}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                ) : currentSectionIdx < totalSections - 1 ? (
                  <>{sectionComplete ? "Next Section" : "Save & Continue"} <ArrowRight size={15} /></>
                ) : (
                  <>Finish & Review <ClipboardCheck size={15} /></>
                )}
              </button>
            </div>

            {!sectionComplete && (
              <p className="text-xs text-muted-foreground text-center">
                Complete all required fields (*) before moving to the next section
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {sections.length === 0 && !qLoading && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No questions found for this exam type.</p>
        </div>
      )}
    </div>
  );
}
