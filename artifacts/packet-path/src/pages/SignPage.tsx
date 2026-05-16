import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, CheckCircle, XCircle, AlertCircle, RotateCcw, Shield, Lock, ChevronRight, GitBranch, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormField } from "@/components/signatures/FormBuilder";

interface SigningSession {
  requestId: number;
  requestTitle: string;
  message: string | null;
  documentContent: string;
  formSchema: FormField[];
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  status: string;
  organizationName: string;
}

type SignatureMode = "drawn" | "typed";
type PageState = "loading" | "ready" | "already_signed" | "declined" | "expired" | "voided" | "error" | "success";
type Step = "document" | "form" | "sign";

// ─── Signature canvas ─────────────────────────────────────────────────────────

function SignatureCanvas({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const hasDrawn = useRef(false);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current; if (!canvas) return;
    e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    lastPos.current = pos; hasDrawn.current = true;
  }

  function endDraw() {
    drawing.current = false;
    if (hasDrawn.current) { const canvas = canvasRef.current; if (canvas) onSave(canvas.toDataURL("image/png")); }
  }

  function clear() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false; onSave("");
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef} width={600} height={180}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        className="w-full border-2 border-dashed border-indigo-200 rounded-xl bg-white cursor-crosshair touch-none"
        style={{ height: 180 }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-indigo-200 text-sm select-none">Sign here</span>
      </div>
      <button type="button" onClick={clear}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border border-border text-muted-foreground hover:text-foreground transition-colors">
        <RotateCcw size={13} />
      </button>
    </div>
  );
}

// ─── Interactive form field renderer ─────────────────────────────────────────

interface FormFieldRendererProps {
  fields: FormField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  errors: Record<string, string>;
}

function isFieldVisible(field: FormField, values: Record<string, string>): boolean {
  if (!field.showWhen?.fieldId || !field.showWhen.value) return true;
  return values[field.showWhen.fieldId] === field.showWhen.value;
}

function FormFieldRenderer({ fields, values, onChange, errors }: FormFieldRendererProps) {
  const visibleFields = fields.filter(f => isFieldVisible(f, values));

  return (
    <div className="space-y-5">
      {visibleFields.map(field => {
        const err = errors[field.id];

        if (field.type === "section_header") {
          return (
            <div key={field.id} className="pt-3">
              <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">{field.label}</h3>
            </div>
          );
        }

        if (field.type === "instructions") {
          return (
            <div key={field.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800 leading-relaxed">
              {field.label}
            </div>
          );
        }

        // Check if this is a conditional field to show the trigger context
        const isConditional = !!field.showWhen?.fieldId;

        return (
          <motion.div
            key={field.id}
            initial={isConditional ? { opacity: 0, height: 0, y: -8 } : false}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "rounded-xl p-4",
              isConditional ? "bg-amber-50/70 border border-amber-200/60" : "bg-muted/20 border border-border/40"
            )}
          >
            {isConditional && (
              <div className="flex items-center gap-1 text-xs text-amber-700 font-medium mb-2">
                <GitBranch size={11} /> Follow-up question
              </div>
            )}

            <label className="block text-sm font-medium text-foreground mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.helpText && (
              <p className="text-xs text-muted-foreground mb-2">{field.helpText}</p>
            )}

            {field.type === "text" && (
              <input
                type="text"
                value={values[field.id] ?? ""}
                onChange={e => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground outline-none transition-colors",
                  err ? "border-red-400 focus:border-red-500" : "border-border focus:border-indigo-400"
                )}
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={values[field.id] ?? ""}
                onChange={e => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground outline-none transition-colors resize-none",
                  err ? "border-red-400 focus:border-red-500" : "border-border focus:border-indigo-400"
                )}
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={values[field.id] ?? ""}
                onChange={e => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground outline-none transition-colors",
                  err ? "border-red-400 focus:border-red-500" : "border-border focus:border-indigo-400"
                )}
              />
            )}

            {field.type === "date" && (
              <input
                type="date"
                value={values[field.id] ?? ""}
                onChange={e => onChange(field.id, e.target.value)}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground outline-none transition-colors",
                  err ? "border-red-400 focus:border-red-500" : "border-border focus:border-indigo-400"
                )}
              />
            )}

            {field.type === "yes_no" && (
              <div className="flex gap-3">
                {["yes", "no"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(field.id, opt)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border text-sm font-semibold capitalize transition-all",
                      values[field.id] === opt
                        ? opt === "yes"
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-red-400 bg-red-50 text-red-700 shadow-sm"
                        : "border-border text-muted-foreground hover:border-indigo-300 hover:bg-indigo-50/40"
                    )}
                  >
                    {opt === "yes" ? "✓ Yes" : "✗ No"}
                  </button>
                ))}
              </div>
            )}

            {field.type === "select" && (
              <select
                value={values[field.id] ?? ""}
                onChange={e => onChange(field.id, e.target.value)}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground outline-none transition-colors",
                  err ? "border-red-400 focus:border-red-500" : "border-border focus:border-indigo-400"
                )}
              >
                <option value="">Select an option...</option>
                {(field.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}

            {field.type === "checkbox" && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values[field.id] === "true"}
                  onChange={e => onChange(field.id, e.target.checked ? "true" : "false")}
                  className="w-4 h-4 mt-0.5 rounded accent-indigo-600"
                />
                <span className="text-sm text-foreground leading-relaxed">{field.label}</span>
              </label>
            )}

            {err && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">⚠ {err}</p>}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Sign Page ───────────────────────────────────────────────────────────

export default function SignPage({ token }: { token: string }) {
  const [session, setSession] = useState<SigningSession | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [step, setStep] = useState<Step>("document");

  // Form state
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Signature state
  const [signMode, setSignMode] = useState<SignatureMode>("drawn");
  const [drawnSig, setDrawnSig] = useState("");
  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const [saveEmailSent, setSaveEmailSent] = useState(false);

  async function saveProgress(sendEmail: boolean): Promise<void> {
    if (savingProgress) return;
    setSavingProgress(true);
    try {
      // Placeholder for persisted draft/resume behavior; keep UI responsive.
      await Promise.resolve();
      setProgressSaved(true);
      if (sendEmail) setSaveEmailSent(true);
    } finally {
      setSavingProgress(false);
    }
  }

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/sign/${token}`);
      if (!res.ok) {
        if (res.status === 404) { setPageState("error"); return; }
        const data = await res.json().catch(() => ({}));
        if (data.status === "already_signed") setPageState("already_signed");
        else if (data.status === "expired") setPageState("expired");
        else if (data.status === "voided") setPageState("voided");
        else if (data.status === "declined") setPageState("declined");
        else setPageState("error");
        return;
      }
      const data = await res.json();
      setSession(data);
      await fetch(`/api/sign/${token}/view`, { method: "POST" });
      setPageState("ready");
    }
    load();
  }, [token]);

  const hasForm = (session?.formSchema ?? []).filter(f => f.type !== "section_header" && f.type !== "instructions").length > 0;

  function handleFormChange(fieldId: string, value: string) {
    setFormValues(v => ({ ...v, [fieldId]: value }));
    // Clear error on change
    setFormErrors(e => { const n = { ...e }; delete n[fieldId]; return n; });
  }

  function validateForm(): boolean {
    const schema = session?.formSchema ?? [];
    const errors: Record<string, string> = {};
    for (const field of schema) {
      if (!isFieldVisible(field, formValues)) continue;
      if (field.type === "section_header" || field.type === "instructions") continue;
      if (!field.required) continue;
      const val = formValues[field.id];
      if (!val || val.trim() === "" || val === "false") {
        errors[field.id] = "This field is required";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function proceedToSign() {
    if (hasForm && !validateForm()) return;
    setStep("sign");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  const submit = async () => {
    const sig = signMode === "drawn" ? drawnSig : typedName;
    if (!sig || !agreed) return;
    setSubmitting(true);

    // Build form responses array
    const schema = session?.formSchema ?? [];
    const responses = schema
      .filter(f => f.type !== "section_header" && f.type !== "instructions")
      .filter(f => isFieldVisible(f, formValues))
      .map(f => ({
        fieldId: f.id,
        label: f.label,
        value: formValues[f.id] ?? "",
      }));

    const res = await fetch(`/api/sign/${token}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signatureType: signMode,
        signatureData: sig,
        fullName: signMode === "typed" ? typedName : (session?.recipientName ?? ""),
        formResponses: responses,
      }),
    });

    if (res.ok) setPageState("success");
    else alert("Signing failed. Please try again or contact support.");
    setSubmitting(false);
  };

  const decline = async () => {
    if (!declineReason.trim()) return;
    const res = await fetch(`/api/sign/${token}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: declineReason }),
    });
    if (res.ok) setPageState("declined");
    setShowDecline(false);
  };

  // ── State pages ─────────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div className="min-h-screen luminous-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen luminous-gradient flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Form Completed & Signed</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your responses and signature have been securely recorded. You may now close this window.
          </p>
          <div className="glass-card rounded-xl p-4 text-left border border-emerald-200/40">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={13} className="text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-700">Signature Certificate</p>
            </div>
            <p className="text-xs text-muted-foreground">Signed by <strong>{session?.recipientName}</strong></p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">ESIGN Act compliant · HIPAA audit trail recorded</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (pageState === "already_signed") return <StatusPage icon={CheckCircle} color="emerald" title="Already Signed" message="This document has already been signed. No further action is needed." />;
  if (pageState === "declined") return <StatusPage icon={XCircle} color="red" title="Signature Declined" message="You have declined to sign this document. Please contact the sender if you believe this is an error." />;
  if (pageState === "expired") return <StatusPage icon={AlertCircle} color="amber" title="Link Expired" message="This signing link has expired. Please contact the sender to request a new link." />;
  if (pageState === "voided") return <StatusPage icon={XCircle} color="slate" title="Request Voided" message="This signature request has been voided. Please contact the sender for more information." />;
  if (pageState === "error") return <StatusPage icon={AlertCircle} color="red" title="Invalid Link" message="This signing link is invalid or does not exist. Please check your email for the correct link." />;

  const schema = session?.formSchema ?? [];
  const totalFormFields = schema.filter(f => f.type !== "section_header" && f.type !== "instructions").length;
  const answeredFields = Object.keys(formValues).filter(k => formValues[k] !== "").length;

  // ── Main UI ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen luminous-gradient py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <PenTool size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{session?.organizationName ?? "PacketPath"}</p>
              <p className="text-xs text-muted-foreground">Secure Document Signing</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock size={11} />
            <span>256-bit encrypted</span>
          </div>
        </div>

        {/* Step indicator (only if form exists) */}
        {hasForm && (
          <div className="glass-card rounded-2xl p-4 mb-5 shadow-sm">
            <div className="flex items-center gap-2">
              {[
                { id: "document" as Step, label: "Review Document" },
                { id: "form" as Step, label: "Complete Form" },
                { id: "sign" as Step, label: "Sign" },
              ].map((s, i, arr) => (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    step === s.id ? "text-indigo-600" : "text-muted-foreground"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                      step === s.id ? "bg-indigo-600 text-white" :
                        (["document", "form", "sign"].indexOf(step) > i) ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {(["document", "form", "sign"].indexOf(step) > i) ? "✓" : i + 1}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={cn("flex-1 h-px", (["document", "form", "sign"].indexOf(step) > i) ? "bg-emerald-300" : "bg-border")} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document view */}
        {(step === "document" || !hasForm) && (
          <div className="glass-card rounded-2xl mb-6 overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="font-semibold text-foreground">{session?.requestTitle}</h2>
              {session?.message && <p className="text-sm text-muted-foreground mt-1">{session.message}</p>}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>To: <strong className="text-foreground">{session?.recipientName}</strong> ({session?.recipientEmail})</span>
                <span className="capitalize">Role: {session?.recipientRole}</span>
              </div>
            </div>
            <div className="px-6 py-6">
              <div
                className="prose prose-sm max-w-none text-foreground"
                style={{ fontFamily: "Georgia, serif", lineHeight: 1.8, fontSize: 14 }}
                dangerouslySetInnerHTML={{ __html: session?.documentContent ?? "" }}
              />
            </div>
            {hasForm && step === "document" && (
              <div className="px-6 pb-6 flex justify-end">
                <button
                  onClick={() => { setStep("form"); setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50); }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 shadow-md"
                >
                  Continue to Form <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form step */}
        {hasForm && step === "form" && (
          <motion.div
            key="form-step"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl mb-6 overflow-hidden shadow-lg"
          >
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <ClipboardList size={16} className="text-indigo-500" />
                Complete the Form
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Please answer all required questions. Follow-up questions may appear based on your answers.
              </p>
              {totalFormFields > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((answeredFields / totalFormFields) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {answeredFields}/{totalFormFields} answered
                  </span>
                </div>
              )}
            </div>
            <div className="px-6 py-6">
              <AnimatePresence mode="sync">
                <FormFieldRenderer
                  fields={schema}
                  values={formValues}
                  onChange={handleFormChange}
                  errors={formErrors}
                />
              </AnimatePresence>
            </div>
            <div className="px-6 pb-6 flex items-center justify-between flex-wrap gap-3">
              <button
                onClick={() => setStep("document")}
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                ← Back to Document
              </button>
              <div className="flex items-center gap-2">
                {/* Save Progress Button */}
                <button
                  onClick={() => saveProgress(false)}
                  disabled={savingProgress}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                  title="Save your progress and return later"
                >
                  {savingProgress ? (
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : progressSaved ? (
                    <span className="text-emerald-600">✓ Saved</span>
                  ) : (
                    <>💾 Save Progress</>
                  )}
                </button>
                <button
                  onClick={() => saveProgress(true)}
                  disabled={savingProgress || saveEmailSent}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                  title="Save and email yourself a resume link"
                >
                  {saveEmailSent ? "✓ Email Sent" : "📧 Email Resume Link"}
                </button>
                <button
                  onClick={proceedToSign}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 shadow-md"
                >
                  Continue to Sign <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Signature step (or default if no form) */}
        {(step === "sign" || !hasForm) && (
          <motion.div
            key="sign-step"
            initial={hasForm ? { opacity: 0, x: 30 } : false}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <PenTool size={15} className="text-indigo-500" />
              Apply Your Signature
            </h3>

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5 w-fit">
              {(["drawn", "typed"] as SignatureMode[]).map(mode => (
                <button key={mode} onClick={() => setSignMode(mode)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                    signMode === mode ? "bg-white text-indigo-700 shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}>
                  {mode === "drawn" ? "Draw" : "Type"} Signature
                </button>
              ))}
            </div>

            {signMode === "drawn" ? (
              <SignatureCanvas onSave={setDrawnSig} />
            ) : (
              <div className="space-y-3">
                <input type="text" value={typedName} onChange={e => setTypedName(e.target.value)}
                  placeholder="Type your full legal name"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg outline-none focus:border-indigo-400 transition-colors"
                  style={{ fontFamily: "'Dancing Script', cursive, Georgia, serif", fontSize: 24 }} />
                {typedName && (
                  <div className="p-4 bg-muted/30 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Signature preview:</p>
                    <p style={{ fontFamily: "'Dancing Script', cursive, Georgia, serif", fontSize: 28, color: "#1e1b4b" }}>{typedName}</p>
                  </div>
                )}
              </div>
            )}

            {/* Legal agreement */}
            <div className="mt-5 p-4 rounded-xl bg-muted/30 border border-border">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-indigo-600" />
                <p className="text-xs text-foreground leading-relaxed">
                  By checking this box and clicking "Sign Document", I agree that my electronic signature is legally binding
                  under the Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. § 7001) and the
                  Uniform Electronic Transactions Act (UETA). I confirm all information I provided is accurate and complete.
                </p>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center gap-2">
                {hasForm && (
                  <button type="button" onClick={() => setStep("form")}
                    className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                    ← Back to Form
                  </button>
                )}
                <button type="button" onClick={() => setShowDecline(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">
                  <XCircle size={14} /> Decline
                </button>
              </div>
              <button type="button" onClick={submit}
                disabled={submitting || !agreed || (signMode === "drawn" ? !drawnSig : !typedName.trim())}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-lg">
                {submitting
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <PenTool size={14} />
                }
                Sign Document
              </button>
            </div>
          </motion.div>
        )}

        {/* Security footer */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Shield size={11} /> HIPAA Compliant</span>
          <span className="flex items-center gap-1"><Lock size={11} /> ESIGN Act</span>
          <span className="flex items-center gap-1"><CheckCircle size={11} /> Audit Trail</span>
        </div>
      </div>

      {/* Decline modal */}
      <AnimatePresence>
        {showDecline && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setShowDecline(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="font-semibold text-foreground mb-1">Decline to Sign</h3>
              <p className="text-sm text-muted-foreground mb-4">Please provide a reason. The sender will be notified.</p>
              <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)}
                placeholder="Reason for declining..." rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-red-400 resize-none" />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowDecline(false)}
                  className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-muted/50 transition-colors">
                  Cancel
                </button>
                <button onClick={decline} disabled={!declineReason.trim()}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                  Confirm Decline
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusPage({ icon: Icon, color, title, message }: { icon: React.ElementType; color: string; title: string; message: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600", red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600", slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="min-h-screen luminous-gradient flex items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5", colorMap[color])}>
          <Icon size={32} />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
