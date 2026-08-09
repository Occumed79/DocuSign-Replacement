import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetCase,
  useListQuestions,
  useGetCaseAnswers,
  useUpsertCaseAnswers,
  getGetCaseQueryKey,
  getListQuestionsQueryKey,
  getGetCaseAnswersQueryKey,
  getGetCaseReviewQueryKey,
} from "@workspace/api-client-react";
import type { Question } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ClipboardCheck,
  GitBranch,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  getActivatedFollowUpCount,
  getInterviewSequence,
  getMissingRequiredQuestions,
  getQuestionDepth,
  isAnswered,
  pruneHiddenAnswers,
  type InterviewAnswers,
} from "@/lib/medical-history-engine";

function YesNoInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {["yes", "no"].map(option => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-2xl border px-5 py-5 text-left transition-all",
              selected
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-background/40 hover:border-primary/40 hover:bg-background/70",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold capitalize text-foreground">{option}</span>
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}>
                {selected && <Check size={14} />}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function QuestionInput({ question, value, onChange }: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  switch (question.answerType) {
    case "yes_no":
      return <YesNoInput value={value} onChange={onChange} />;

    case "dropdown":
      return (
        <select
          value={value}
          onChange={event => onChange(event.target.value)}
          className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-primary/60"
        >
          <option value="">Select an option...</option>
          {(question.options ?? []).map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      );

    case "multi_select": {
      const selected = value ? value.split("||").filter(Boolean) : [];
      return (
        <div className="flex flex-col gap-2.5">
          {(question.options ?? []).map(option => {
            const checked = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  const next = checked
                    ? selected.filter(item => item !== option)
                    : [...selected, option];
                  onChange(next.join("||"));
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all",
                  checked ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/40",
                )}
              >
                <span className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}>
                  {checked && <Check size={12} />}
                </span>
                <span className="text-foreground">{option}</span>
              </button>
            );
          })}
        </div>
      );
    }

    case "date":
      return (
        <input
          type="date"
          value={value}
          onChange={event => onChange(event.target.value)}
          className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-primary/60"
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="Enter a number..."
          className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-primary/60"
        />
      );

    default:
      return (
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          rows={5}
          placeholder="Enter the details requested above..."
          className="w-full resize-y rounded-2xl border border-border bg-background/70 px-4 py-3.5 text-sm leading-6 text-foreground outline-none transition focus:border-primary/60"
        />
      );
  }
}

export default function ReactiveCaseWizardPage({ caseId }: { caseId: number }) {
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: caseData, isLoading: caseLoading } = useGetCase(caseId, {
    query: { enabled: Boolean(caseId), queryKey: getGetCaseQueryKey(caseId) },
  });
  const { data: allQuestions = [], isLoading: questionsLoading } = useListQuestions(
    { exam_type_id: caseData?.examTypeId },
    {
      query: {
        enabled: Boolean(caseData?.examTypeId),
        queryKey: getListQuestionsQueryKey({ exam_type_id: caseData?.examTypeId }),
      },
    },
  );
  const { data: savedAnswers = [], isLoading: answersLoading } = useGetCaseAnswers(caseId, {
    query: { enabled: Boolean(caseId), queryKey: getGetCaseAnswersQueryKey(caseId) },
  });
  const upsertAnswers = useUpsertCaseAnswers();

  useEffect(() => {
    if (allQuestions.length === 0 || answersLoading) return;
    const loaded: InterviewAnswers = {};
    savedAnswers.forEach(answer => { loaded[answer.questionId] = answer.value; });
    setAnswers(pruneHiddenAnswers(allQuestions, loaded));
  }, [allQuestions, answersLoading, savedAnswers]);

  const sequence = useMemo(
    () => getInterviewSequence(allQuestions, answers),
    [allQuestions, answers],
  );

  useEffect(() => {
    if (sequence.length === 0) return;
    if (currentQuestionId == null || !sequence.some(question => question.id === currentQuestionId)) {
      setCurrentQuestionId(sequence[0].id);
    }
  }, [currentQuestionId, sequence]);

  const currentIndex = Math.max(0, sequence.findIndex(question => question.id === currentQuestionId));
  const currentQuestion = sequence[currentIndex];
  const missingRequired = useMemo(
    () => getMissingRequiredQuestions(allQuestions, answers),
    [allQuestions, answers],
  );
  const requiredVisible = sequence.filter(question => question.required);
  const completedRequired = requiredVisible.filter(question => isAnswered(answers[question.id])).length;
  const progress = requiredVisible.length > 0
    ? Math.round((completedRequired / requiredVisible.length) * 100)
    : 100;

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(previous => pruneHiddenAnswers(allQuestions, {
      ...previous,
      [questionId]: value,
    }));
  };

  const saveAnswers = async (snapshot: InterviewAnswers = answers) => {
    const payload = Object.entries(snapshot).map(([questionId, value]) => ({
      questionId: Number(questionId),
      value,
    }));
    if (payload.length === 0) return true;

    setIsSaving(true);
    try {
      await new Promise<void>((resolve, reject) => {
        upsertAnswers.mutate(
          { id: caseId, data: { answers: payload } },
          { onSuccess: () => resolve(), onError: reject },
        );
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetCaseAnswersQueryKey(caseId) }),
        queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) }),
        queryClient.invalidateQueries({ queryKey: getGetCaseReviewQueryKey(caseId) }),
      ]);
      return true;
    } catch {
      toast({ title: "Could not save this answer", description: "Your response is still on screen. Try again.", variant: "destructive" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = async () => {
    if (!currentQuestion) return;
    const value = answers[currentQuestion.id] ?? "";
    if (currentQuestion.required && !isAnswered(value)) {
      toast({ title: "Answer required", description: "Complete this question before continuing." });
      return;
    }

    const saved = await saveAnswers();
    if (!saved) return;

    const freshSequence = getInterviewSequence(allQuestions, answers);
    const freshIndex = freshSequence.findIndex(question => question.id === currentQuestion.id);
    if (freshIndex >= 0 && freshIndex < freshSequence.length - 1) {
      setCurrentQuestionId(freshSequence[freshIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const missing = getMissingRequiredQuestions(allQuestions, answers);
    if (missing.length > 0) {
      setCurrentQuestionId(missing[0].id);
      toast({ title: "A little more detail is needed", description: `${missing.length} required question${missing.length === 1 ? " remains" : "s remain"}.` });
      return;
    }

    setLocation(`/cases/${caseId}/review`);
  };

  const goPrevious = async () => {
    if (!currentQuestion || currentIndex <= 0) return;
    await saveAnswers();
    const previous = sequence[currentIndex - 1];
    if (previous) {
      setCurrentQuestionId(previous.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (caseLoading || questionsLoading || answersLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" size={18} /> Preparing adaptive interview...
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="glass-card rounded-3xl p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">No interview questions are configured</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add questions for this exam type in the Admin panel.</p>
        </div>
      </div>
    );
  }

  const depth = getQuestionDepth(currentQuestion.id, allQuestions);
  const activatedFollowUps = getActivatedFollowUpCount(currentQuestion, answers);
  const currentAnswered = isAnswered(answers[currentQuestion.id]);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-7 flex items-center justify-between">
        <button
          onClick={() => setLocation("/cases")}
          className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={15} /> Cases
        </button>
        <button
          onClick={async () => { await saveAnswers(); setLocation(`/cases/${caseId}/review`); }}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ClipboardCheck size={15} /> Review answers
        </button>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Adaptive medical history</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{caseData?.patientName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{caseData?.examTypeName} · only applicable questions are shown</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-foreground">{progress}%</div>
            <div className="text-xs text-muted-foreground">required interview complete</div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{currentQuestion.section}</span>
        <span>Question {currentIndex + 1} of {sequence.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }}
          className="liquid-glass glass-highlight relative overflow-hidden rounded-[28px] border border-border/70 p-7 md:p-9"
        >
          {depth > 0 && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <GitBranch size={13} /> Follow-up detail {depth > 1 ? `· level ${depth}` : ""}
            </div>
          )}

          <div className="max-w-3xl">
            <div className="mb-2 flex items-start gap-2">
              <h2 className="text-xl font-semibold leading-8 text-foreground md:text-2xl">{currentQuestion.text}</h2>
              {currentQuestion.required && <span className="mt-1 text-sm text-primary">*</span>}
            </div>
            {currentQuestion.helpText && (
              <p className="mb-6 text-sm leading-6 text-muted-foreground">{currentQuestion.helpText}</p>
            )}

            <div className={cn(currentQuestion.helpText ? "" : "mt-6")}>
              <QuestionInput
                question={currentQuestion}
                value={answers[currentQuestion.id] ?? ""}
                onChange={value => handleAnswer(currentQuestion.id, value)}
              />
            </div>

            {activatedFollowUps > 0 && currentAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-foreground"
              >
                <GitBranch className="mt-0.5 shrink-0 text-primary" size={16} />
                <span>
                  This answer opens {activatedFollowUps} follow-up question{activatedFollowUps === 1 ? "" : "s"} so the medical history is complete enough for review without unnecessary back-and-forth.
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 flex items-center justify-between gap-4">
        <button
          onClick={goPrevious}
          disabled={currentIndex <= 0 || isSaving}
          className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <div className="hidden text-xs text-muted-foreground sm:block">
          {missingRequired.length === 0
            ? "All currently applicable required questions are complete"
            : `${missingRequired.length} applicable required question${missingRequired.length === 1 ? "" : "s"} remaining`}
        </div>

        <button
          onClick={goNext}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {isSaving ? <><Loader2 className="animate-spin" size={16} /> Saving</> : (
            <>{currentIndex === sequence.length - 1 ? "Finish interview" : "Continue"}<ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}
