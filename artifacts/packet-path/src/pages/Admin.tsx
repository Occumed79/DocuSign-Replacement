import { useState } from "react";
import { motion } from "framer-motion";
import {
  useListQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion,
  useListExamTypes, getListQuestionsQueryKey
} from "@workspace/api-client-react";
import type { Question } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Check, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ANSWER_TYPES = ["text", "yes_no", "dropdown", "date", "number", "multi_select"];
const SECTIONS = ["Demographics", "Medical History", "Mental Health", "Physical Exam", "Vision & Hearing", "Laboratory", "Dental", "Required Documents"];

interface QuestionFormData {
  text: string;
  answerType: string;
  required: boolean;
  section: string;
  orderIndex: number;
  examTypeIds: number[];
  options: string;
  triggerValue: string;
  followUpIds: string;
  helpText: string;
}

const defaultForm: QuestionFormData = {
  text: "",
  answerType: "text",
  required: true,
  section: "General",
  orderIndex: 0,
  examTypeIds: [],
  options: "",
  triggerValue: "",
  followUpIds: "",
  helpText: "",
};

function QuestionForm({
  initial,
  examTypes,
  onSave,
  onCancel,
  isLoading,
}: {
  initial: QuestionFormData;
  examTypes: { id: number; name: string }[];
  onSave: (data: QuestionFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<QuestionFormData>(initial);

  const toggleExamType = (id: number) => {
    setForm(prev => ({
      ...prev,
      examTypeIds: prev.examTypeIds.includes(id)
        ? prev.examTypeIds.filter(x => x !== id)
        : [...prev.examTypeIds, id],
    }));
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-primary/20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Question Text *</label>
          <textarea
            data-testid="input-question-text"
            value={form.text}
            onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary resize-none"
            placeholder="Enter the question..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Answer Type</label>
          <select
            data-testid="select-answer-type"
            value={form.answerType}
            onChange={e => setForm(p => ({ ...p, answerType: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary text-foreground"
          >
            {ANSWER_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Section</label>
          <input
            data-testid="input-section"
            list="sections-list"
            value={form.section}
            onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
          />
          <datalist id="sections-list">{SECTIONS.map(s => <option key={s} value={s} />)}</datalist>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Order Index</label>
          <input
            type="number"
            value={form.orderIndex}
            onChange={e => setForm(p => ({ ...p, orderIndex: Number(e.target.value) }))}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-3 pt-5">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
            <input
              data-testid="checkbox-required"
              type="checkbox"
              checked={form.required}
              onChange={e => setForm(p => ({ ...p, required: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary"
            />
            Required field
          </label>
        </div>

        {(form.answerType === "dropdown" || form.answerType === "multi_select") && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Options (comma-separated)</label>
            <input
              data-testid="input-options"
              value={form.options}
              onChange={e => setForm(p => ({ ...p, options: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
              placeholder="Option 1, Option 2, Option 3"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Trigger Value (shows follow-ups)</label>
          <input
            value={form.triggerValue}
            onChange={e => setForm(p => ({ ...p, triggerValue: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
            placeholder="e.g. yes"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Help Text</label>
          <input
            value={form.helpText}
            onChange={e => setForm(p => ({ ...p, helpText: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
            placeholder="Optional hint for staff..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Applies to Exam Types</label>
          <div className="flex flex-wrap gap-2">
            {examTypes.map(et => (
              <button
                key={et.id}
                type="button"
                onClick={() => toggleExamType(et.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all",
                  form.examTypeIds.includes(et.id)
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80"
                )}
              >
                {et.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <button
          data-testid="btn-save-question"
          onClick={() => onSave(form)}
          disabled={isLoading || !form.text.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
          Save Question
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<QuestionFormData | null>(null);
  const { data: questions = [], isLoading } = useListQuestions({}, { query: { queryKey: getListQuestionsQueryKey() } });
  const { data: examTypes = [] } = useListExamTypes();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refreshQuestions = () => queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });

  const handleCreate = (form: QuestionFormData) => {
    createQuestion.mutate({
      data: {
        text: form.text,
        answerType: form.answerType,
        required: form.required,
        section: form.section,
        orderIndex: form.orderIndex,
        examTypeIds: form.examTypeIds,
        options: form.options ? form.options.split(",").map(s => s.trim()).filter(Boolean) : [],
        triggerValue: form.triggerValue || null,
        followUpIds: form.followUpIds ? form.followUpIds.split(",").map(s => Number(s.trim())).filter(Boolean) : [],
        helpText: form.helpText || null,
      }
    }, {
      onSuccess: () => {
        refreshQuestions();
        setShowForm(false);
        toast({ title: "Question created" });
      }
    });
  };

  const handleUpdate = (form: QuestionFormData) => {
    if (editingId == null) return;
    updateQuestion.mutate({
      id: editingId,
      data: {
        text: form.text,
        answerType: form.answerType,
        required: form.required,
        section: form.section,
        orderIndex: form.orderIndex,
        examTypeIds: form.examTypeIds,
        options: form.options ? form.options.split(",").map(s => s.trim()).filter(Boolean) : [],
        triggerValue: form.triggerValue || null,
        followUpIds: form.followUpIds ? form.followUpIds.split(",").map(s => Number(s.trim())).filter(Boolean) : [],
        helpText: form.helpText || null,
      }
    }, {
      onSuccess: () => {
        refreshQuestions();
        setEditingId(null);
        setEditForm(null);
        toast({ title: "Question updated" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this question? It will be removed from all exam types.")) return;
    deleteQuestion.mutate({ id }, {
      onSuccess: () => {
        refreshQuestions();
        toast({ title: "Question deleted" });
      }
    });
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditForm({
      text: q.text,
      answerType: q.answerType,
      required: q.required,
      section: q.section,
      orderIndex: q.orderIndex,
      examTypeIds: q.examTypeIds,
      options: q.options.join(", "),
      triggerValue: q.triggerValue ?? "",
      followUpIds: (q.followUpIds ?? []).join(", "),
      helpText: q.helpText ?? "",
    });
    setShowForm(false);
  };

  // Group by section
  const grouped = questions.reduce((acc, q) => {
    if (!acc[q.section]) acc[q.section] = [];
    acc[q.section].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Admin Panel</h1>
              <p className="text-muted-foreground text-sm">{questions.length} question templates</p>
            </div>
          </div>
          <button
            data-testid="btn-add-question"
            onClick={() => { setShowForm(true); setEditingId(null); setEditForm(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={15} /> Add Question
          </button>
        </div>

        {showForm && (
          <div className="mb-6">
            <QuestionForm
              initial={defaultForm}
              examTypes={examTypes}
              onSave={handleCreate}
              onCancel={() => setShowForm(false)}
              isLoading={createQuestion.isPending}
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).map(([section, qs]) => (
              <div key={section}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section}</h2>
                <div className="flex flex-col gap-2">
                  {qs.sort((a, b) => a.orderIndex - b.orderIndex).map(q => (
                    <div key={q.id}>
                      {editingId === q.id && editForm ? (
                        <QuestionForm
                          initial={editForm}
                          examTypes={examTypes}
                          onSave={handleUpdate}
                          onCancel={() => { setEditingId(null); setEditForm(null); }}
                          isLoading={updateQuestion.isPending}
                        />
                      ) : (
                        <div
                          data-testid={`question-row-${q.id}`}
                          className="glass-card rounded-xl px-5 py-4 flex items-start gap-4 group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{q.text}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">
                                {q.answerType.replace("_", " ")}
                              </span>
                              {q.required && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-red-50 text-red-600">Required</span>
                              )}
                              {examTypes.filter(et => q.examTypeIds.includes(et.id)).map(et => (
                                <span key={et.id} className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">{et.name}</span>
                              ))}
                              {q.helpText && <span className="text-xs text-muted-foreground italic truncate max-w-48">{q.helpText}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              data-testid={`btn-edit-question-${q.id}`}
                              onClick={() => startEdit(q)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              data-testid={`btn-delete-question-${q.id}`}
                              onClick={() => handleDelete(q.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
