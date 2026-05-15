import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { X, Plus, Trash2, PenTool, FileText, Users, Send, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Template {
  id: number;
  name: string;
  category: string;
  content: string;
}

interface Case {
  id: number;
  patientName: string;
  status: string;
}

interface Recipient {
  name: string;
  email: string;
  role: string;
  order: number;
}

interface Props {
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
}

const ROLES = ["signer", "witness", "approver"];

export default function CreateRequestModal({ token, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [documentContent, setDocumentContent] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<number | "">("");
  const [expiryDays, setExpiryDays] = useState(7);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: "", email: "", role: "signer", order: 1 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/signature-templates", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/cases", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([tmpl, cas]) => {
      setTemplates(Array.isArray(tmpl) ? tmpl : []);
      setCases(Array.isArray(cas) ? cas : []);
    }).catch(() => {});
  }, [token]);

  const selectTemplate = (id: number | "") => {
    setSelectedTemplateId(id);
    if (id) {
      const t = templates.find(t => t.id === Number(id));
      if (t) {
        setDocumentContent(t.content);
        if (!title) setTitle(t.name);
      }
    }
  };

  const addRecipient = () => {
    setRecipients(prev => [...prev, { name: "", email: "", role: "signer", order: prev.length + 1 }]);
  };

  const removeRecipient = (i: number) => {
    setRecipients(prev => prev.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, order: idx + 1 })));
  };

  const updateRecipient = (i: number, field: keyof Recipient, value: string | number) => {
    setRecipients(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const isStep1Valid = title.trim() && (documentContent.trim() || selectedTemplateId);
  const isStep2Valid = recipients.every(r => r.name.trim() && /\S+@\S+\.\S+/.test(r.email));

  const submit = async () => {
    if (!isStep1Valid || !isStep2Valid) return;
    setSubmitting(true);
    const res = await fetch("/api/signature-requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        message: message.trim() || null,
        templateId: selectedTemplateId || null,
        caseId: selectedCaseId || null,
        documentContent: documentContent.trim() || null,
        expiryDays,
        recipients,
      }),
    });
    if (res.ok) {
      const payload = await res.json().catch(() => null);
      const failed = Array.isArray(payload?.perRecipient)
        ? payload.perRecipient.filter((r: { sent?: boolean }) => !r.sent).length
        : 0;
      toast({
        title: failed > 0 ? "Request created with some delivery failures" : "Signature request created & sent",
        description: payload?.emailsTotal ? `${payload.emailsSent}/${payload.emailsTotal} email(s) sent` : undefined,
      });
      onCreated();
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: err.error ?? "Failed to create request", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8dbeb5] to-[#527b78] flex items-center justify-center">
              <PenTool size={14} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">New Signature Request</h2>
              <p className="text-xs text-muted-foreground">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Step progress */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {[
              { n: 1, label: "Document", icon: FileText },
              { n: 2, label: "Recipients", icon: Users },
              { n: 3, label: "Review & Send", icon: Send },
            ].map(({ n, label, icon: Icon }, i) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  step === n ? "bg-[#8dbeb5] text-[#031219]" : step > n ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  <Icon size={12} />
                </div>
                <span className={cn("text-xs font-medium", step >= n ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {i < 2 && <div className={cn("flex-1 h-px mx-1", step > n ? "bg-emerald-400" : "bg-border")} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Request Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Pre-Employment Physical Consent"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-[#8dbeb5] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Template (optional)</label>
                  <select
                    value={selectedTemplateId}
                    onChange={e => selectTemplate(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-[#8dbeb5] transition-colors"
                  >
                    <option value="">No template</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {templates.length === 0 && (
                    <div className="mt-2 rounded-lg border border-white/20 bg-[#052a32]/60 px-2.5 py-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-[#c8d2d1]">No templates yet. Create a custom form template first.</p>
                      <Link href="/signature-templates">
                        <button type="button" className="text-[11px] px-2 py-1 rounded bg-[#8dbeb5] text-[#031219]">Open Templates</button>
                      </Link>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Link to Case (optional)</label>
                  <select
                    value={selectedCaseId}
                    onChange={e => setSelectedCaseId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-[#8dbeb5] transition-colors"
                  >
                    <option value="">No case</option>
                    {cases.map(c => <option key={c.id} value={c.id}>{c.patientName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Message to signers (optional)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={2}
                  placeholder="Please review and sign this document..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-[#8dbeb5] resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Document Content (HTML) *</label>
                <textarea
                  value={documentContent}
                  onChange={e => setDocumentContent(e.target.value)}
                  rows={10}
                  placeholder={`<h2>Document Title</h2>\n<p>Document body content...</p>`}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-mono outline-none focus:border-[#8dbeb5] resize-none transition-colors"
                />
                {!selectedTemplateId && templates.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    <span className="text-[#8dbeb5]">Tip:</span> Select a template above to auto-fill this field.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Add people who need to sign this document</p>
                <button
                  onClick={addRecipient}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/25 text-[#8dbeb5] text-xs hover:bg-[#8dbeb5]/10 transition-colors"
                >
                  <Plus size={12} /> Add Recipient
                </button>
              </div>

              {recipients.map((r, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#8dbeb5] text-[#031219] text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-foreground">Recipient {i + 1}</span>
                    </div>
                    {recipients.length > 1 && (
                      <button
                        onClick={() => removeRecipient(i)}
                        className="p-1 rounded text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      value={r.name}
                      onChange={e => updateRecipient(i, "name", e.target.value)}
                      placeholder="Full name *"
                      className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-[#8dbeb5] transition-colors"
                    />
                    <input
                      value={r.email}
                      onChange={e => updateRecipient(i, "email", e.target.value)}
                      type="email"
                      placeholder="Email address *"
                      className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-[#8dbeb5] transition-colors"
                    />
                    <select
                      value={r.role}
                      onChange={e => updateRecipient(i, "role", e.target.value)}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-[#8dbeb5] transition-colors"
                    >
                      {ROLES.map(role => <option key={role} value={role} className="capitalize">{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Link Expires In</label>
                <select
                  value={expiryDays}
                  onChange={e => setExpiryDays(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-[#8dbeb5] transition-colors"
                >
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-muted/20 border border-border">
                <h3 className="font-semibold text-foreground text-sm mb-3">Request Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title</span>
                    <span className="font-medium text-foreground">{title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipients</span>
                    <span className="font-medium text-foreground">{recipients.length} signer{recipients.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium text-foreground">In {expiryDays} days</span>
                  </div>
                </div>
              </div>

              {/* Recipients preview */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Signing Links Will Be Generated For:</p>
                <div className="space-y-2">
                  {recipients.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8dbeb5] to-[#527b78] flex items-center justify-center text-white text-sm font-bold">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email} · <span className="capitalize">{r.role}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal notice */}
              <div className="p-4 rounded-xl bg-[#052a32]/45 border border-white/20 flex items-start gap-3">
                <AlertCircle size={14} className="text-[#8dbeb5] mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  By sending this request, signing links will be created for each recipient. Each signature will be recorded with a timestamp,
                  IP address, and document hash to create a legally binding, HIPAA-compliant audit trail under the ESIGN Act.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-border">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : onClose()}
            className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground border border-border hover:bg-muted/50 transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as 1 | 2 | 3)}
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8dbeb5] to-[#527b78] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8dbeb5] to-[#527b78] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Send Request
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
