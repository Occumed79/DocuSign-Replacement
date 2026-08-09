import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronLeft, ClipboardCheck, GitBranch, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { Question } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  getInterviewSequence,
  getMissingRequiredQuestions,
  getQuestionDepth,
  isAnswered,
  pruneHiddenAnswers,
  type InterviewAnswers,
} from "@/lib/medical-history-engine";

type Phase = "loading" | "verify" | "questionnaire" | "submitted" | "error";

interface Metadata {
  maskedName: string;
  examTypeName: string;
  requiresDob: boolean;
  expiresAt: string;
}

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
              selected ? "border-[#8dbeb5] bg-[#8dbeb5]/15" : "border-white/15 bg-white/[0.04] hover:border-white/30",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold capitalize text-white">{option}</span>
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border",
                selected ? "border-[#8dbeb5] bg-[#8dbeb5] text-[#031219]" : "border-white/25",
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

function QuestionInput({ question, value, onChange }: { question: Question; value: string; onChange: (value: string) => void }) {
  const inputClass = "w-full rounded-2xl border border-white/15 bg-[#052a32]/60 px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#8dbeb5]";
  switch (question.answerType) {
    case "yes_no":
      return <YesNoInput value={value} onChange={onChange} />;
    case "dropdown":
      return (
        <select value={value} onChange={event => onChange(event.target.value)} className={inputClass}>
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
                  const next = checked ? selected.filter(item => item !== option) : [...selected, option];
                  onChange(next.join("||"));
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all",
                  checked ? "border-[#8dbeb5] bg-[#8dbeb5]/15" : "border-white/15 bg-white/[0.04] hover:border-white/30",
                )}
              >
                <span className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                  checked ? "border-[#8dbeb5] bg-[#8dbeb5] text-[#031219]" : "border-white/25",
                )}>{checked && <Check size={12} />}</span>
                <span className="text-white">{option}</span>
              </button>
            );
          })}
        </div>
      );
    }
    case "date":
      return <input type="date" value={value} onChange={event => onChange(event.target.value)} className={inputClass} />;
    case "number":
      return <input type="number" value={value} onChange={event => onChange(event.target.value)} className={inputClass} />;
    default:
      return <textarea value={value} onChange={event => onChange(event.target.value)} rows={5} placeholder="Enter response..." className={`${inputClass} resize-y leading-6`} />;
  }
}

function MessageCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-h-screen luminous-gradient flex items-center justify-center p-6">
      <div className="tahoe-panel w-full max-w-lg rounded-[34px] p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10">
          <ClipboardCheck className="text-[#8dbeb5]" size={30} />
        </div>
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">{text}</p>
      </div>
    </div>
  );
}

export default function PublicMedicalQuestionnaire({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [error, setError] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [patientName, setPatientName] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const res = await fetch(`/api/medical-questionnaire/${token}`, { cache: "no-store" });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(payload.error || "This questionnaire link is unavailable.");
          setPhase("error");
          return;
        }
        setMetadata(payload);
        setPhase("verify");
      } catch {
        setError("The secure questionnaire could not be opened. Please try again.");
        setPhase("error");
      }
    }
    void loadMetadata();
  }, [token]);

  const loadQuestionnaire = async (session: string) => {
    const res = await fetch(`/api/medical-questionnaire/${token}/questions`, {
      cache: "no-store",
      headers: { "X-Questionnaire-Session": session },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || "Unable to load questionnaire");
    const loadedQuestions = (payload.questions ?? []) as Question[];
    const loadedAnswers: InterviewAnswers = {};
    (payload.answers ?? []).forEach((answer: { questionId: number; value: string }) => { loadedAnswers[answer.questionId] = answer.value; });
    setQuestions(loadedQuestions);
    setAnswers(pruneHiddenAnswers(loadedQuestions, loadedAnswers));
    setPhase("questionnaire");
  };

  const verify = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/medical-questionnaire/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientDob: metadata?.requiresDob ? patientDob : undefined }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Verification failed");
      setSessionToken(payload.sessionToken);
      setPatientName(payload.patientName || "");
      await loadQuestionnaire(payload.sessionToken);
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    } finally {
      setSaving(false);
    }
  };

  const sequence = useMemo(() => getInterviewSequence(questions, answers), [questions, answers]);
  useEffect(() => {
    if (sequence.length === 0) return;
    if (currentQuestionId == null || !sequence.some(question => question.id === currentQuestionId)) {
      setCurrentQuestionId(sequence[0].id);
    }
  }, [currentQuestionId, sequence]);

  const currentIndex = Math.max(0, sequence.findIndex(question => question.id === currentQuestionId));
  const currentQuestion = sequence[currentIndex];
  const requiredVisible = sequence.filter(question => question.required);
  const completedRequired = requiredVisible.filter(question => isAnswered(answers[question.id])).length;
  const progress = requiredVisible.length ? Math.round((completedRequired / requiredVisible.length) * 100) : 100;

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(previous => pruneHiddenAnswers(questions, { ...previous, [questionId]: value }));
  };

  const saveAnswers = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/medical-questionnaire/${token}/answers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Questionnaire-Session": sessionToken },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, value]) => ({ questionId: Number(questionId), value })),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Unable to save responses");
      return true;
    } catch (err: any) {
      setError(err?.message || "Unable to save responses");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (!currentQuestion) return;
    if (currentQuestion.required && !isAnswered(answers[currentQuestion.id])) {
      setError("Please complete this question before continuing.");
      return;
    }
    setError("");
    if (!(await saveAnswers())) return;

    const freshSequence = getInterviewSequence(questions, answers);
    const index = freshSequence.findIndex(question => question.id === currentQuestion.id);
    if (index >= 0 && index < freshSequence.length - 1) {
      setCurrentQuestionId(freshSequence[index + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const missing = getMissingRequiredQuestions(questions, answers);
    if (missing.length > 0) {
      setCurrentQuestionId(missing[0].id);
      setError(`${missing.length} required question${missing.length === 1 ? " remains" : "s remain"}.`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/medical-questionnaire/${token}/submit`, {
        method: "POST",
        headers: { "X-Questionnaire-Session": sessionToken },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Unable to submit questionnaire");
      setPhase("submitted");
    } catch (err: any) {
      setError(err?.message || "Unable to submit questionnaire");
    } finally {
      setSaving(false);
    }
  };

  const goPrevious = async () => {
    if (currentIndex <= 0) return;
    setError("");
    await saveAnswers();
    setCurrentQuestionId(sequence[currentIndex - 1]?.id ?? currentQuestionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (phase === "loading") return <MessageCard title="Opening secure questionnaire" text="Please wait while the questionnaire is prepared." />;
  if (phase === "submitted") return <MessageCard title="Medical history complete" text="Your questionnaire has been securely submitted to Occu-Med for review. You may close this window." />;
  if (phase === "error") return <MessageCard title="Questionnaire unavailable" text={error || "This secure questionnaire cannot be opened."} />;

  if (phase === "verify") {
    return (
      <div className="min-h-screen luminous-gradient flex items-center justify-center p-6">
        <div className="tahoe-panel w-full max-w-lg rounded-[34px] p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-[#8dbeb5]/12"><Lock className="text-[#8dbeb5]" /></div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8dbeb5]/75">Occu-Med</div>
              <h1 className="text-2xl font-semibold text-white">Medical History Questionnaire</h1>
            </div>
          </div>
          <div className="mt-7 rounded-2xl border border-white/15 bg-white/[0.05] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Questionnaire</p>
            <p className="mt-1 font-medium text-white">{metadata?.examTypeName}</p>
            <p className="mt-2 text-xs text-white/50">For {metadata?.maskedName}</p>
          </div>
          {metadata?.requiresDob && (
            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Date of birth</label>
              <input type="date" value={patientDob} onChange={event => setPatientDob(event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#052a32]/65 px-4 py-3 text-white outline-none focus:border-[#8dbeb5]" />
            </div>
          )}
          {error && <p className="mt-4 rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}
          <button onClick={() => void verify()} disabled={saving || Boolean(metadata?.requiresDob && !patientDob)} className="tahoe-button mt-6 w-full rounded-2xl px-5 py-3 font-semibold disabled:opacity-50">
            {saving ? <><Loader2 className="mr-2 inline animate-spin" size={16} /> Verifying</> : "Continue securely"}
          </button>
          <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-white/45"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#8dbeb5]" /> This link is specific to this questionnaire. Your responses are transmitted directly to Occu-Med.</div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return <MessageCard title="Questionnaire complete" text="There are no additional questions to complete." />;

  const depth = getQuestionDepth(currentQuestion.id, questions);
  return (
    <div className="min-h-screen luminous-gradient p-4 md:p-8">
      <main className="mx-auto max-w-4xl">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8dbeb5]/75">Occu-Med · Medical History Questionnaire</div>
            <h1 className="mt-2 text-2xl font-semibold text-white">{patientName}</h1>
            <p className="mt-1 text-sm text-white/50">{metadata?.examTypeName}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-white">{progress}%</div>
            <div className="text-xs text-white/45">required responses complete</div>
          </div>
        </header>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-[#8dbeb5]" animate={{ width: `${progress}%` }} /></div>
        <div className="mb-4 flex items-center justify-between text-xs text-white/45"><span>{currentQuestion.section}</span><span>Question {currentIndex + 1} of {sequence.length}</span></div>

        <AnimatePresence mode="wait">
          <motion.section key={currentQuestion.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} className="tahoe-panel rounded-[30px] p-7 md:p-9">
            {depth > 0 && <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8dbeb5]/20 bg-[#8dbeb5]/10 px-3 py-1.5 text-xs font-semibold text-[#b7d8d2]"><GitBranch size={13} /> Additional detail</div>}
            <div className="mb-2 flex items-start gap-2"><h2 className="text-xl font-semibold leading-8 text-white md:text-2xl">{currentQuestion.text}</h2>{currentQuestion.required && <span className="mt-1 text-[#8dbeb5]">*</span>}</div>
            {currentQuestion.helpText && <p className="mb-6 text-sm leading-6 text-white/55">{currentQuestion.helpText}</p>}
            <div className={currentQuestion.helpText ? "" : "mt-6"}><QuestionInput question={currentQuestion} value={answers[currentQuestion.id] ?? ""} onChange={value => handleAnswer(currentQuestion.id, value)} /></div>
          </motion.section>
        </AnimatePresence>

        {error && <p className="mt-4 rounded-xl border border-amber-200/20 bg-amber-200/10 p-3 text-sm text-amber-100">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-3">
          <button onClick={() => void goPrevious()} disabled={currentIndex <= 0 || saving} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/60 disabled:opacity-35"><ChevronLeft size={16} /> Previous</button>
          <button onClick={() => void goNext()} disabled={saving} className="tahoe-button flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold disabled:opacity-50">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving</> : <>{currentIndex === sequence.length - 1 ? "Review and submit" : "Continue"}<ArrowRight size={16} /></>}
          </button>
        </div>
      </main>
    </div>
  );
}
