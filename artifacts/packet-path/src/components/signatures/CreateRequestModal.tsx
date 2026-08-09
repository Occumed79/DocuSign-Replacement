import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { X, Plus, Trash2, PenTool, FileText, Users, Send, AlertCircle, Upload, CheckCircle2 } from "lucide-react";
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
  initialTemplateId?: number | null;
}

const ROLES = ["signer", "witness", "approver"];
const MAX_PDF_BYTES = 8 * 1024 * 1024;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",", 2)[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

export default function CreateRequestModal({ token, onClose, onCreated, initialTemplateId }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [documentContent, setDocumentContent] = useState("");
  const [sourceDocumentBase64, setSourceDocumentBase64] = useState("");
  const [sourceDocumentFileName, setSourceDocumentFileName] = useState("");
  const [sourceDocumentBytes, setSourceDocumentBytes] = useState(0);
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
      const loadedTemplates = Array.isArray(tmpl) ? tmpl : [];
      setTemplates(loadedTemplates);
      setCases(Array.isArray(cas) ? cas : []);

      if (initialTemplateId) {
        const t = loadedTemplates.find((candidate: Template) => candidate.id === initialTemplateId);
        if (t) {
          setSelectedTemplateId(t.id);
          setDocumentContent(t.content);
          if (!title) setTitle(t.name);
          setStep(2);
        }
      }
    }).catch(() => {});
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectTemplate = (id: number | "") => {
    setSelectedTemplateId(id);
    if (id) {
      const t = templates.find(template => template.id === Number(id));
      if (t) {
        setDocumentContent(t.content);
        setSourceDocumentBase64("");
        setSourceDocumentFileName("");
        setSourceDocumentBytes(0);
        if (!title) setTitle(t.name);
      }
    }
  };

  const selectPdf = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Please choose a PDF file", variant: "destructive" });
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast({ title: "PDF is too large", description: "Exact-source PDFs are limited to 8 MB.", variant: "destructive" });
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setSourceDocumentBase64(base64);
      setSourceDocumentFileName(file.name);
      setSourceDocumentBytes(file.size);
      setSelectedTemplateId("");
      if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "));
      toast({ title: "PDF ready", description: "The original PDF pages will be preserved exactly." });
    } catch {
      toast({ title: "Unable to read PDF", variant: "destructive" });
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

  const isStep1Valid = Boolean(title.trim() && (sourceDocumentBase64 || documentContent.trim() || selectedTemplateId));
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
        sourceDocumentBase64: sourceDocumentBase64 || undefined,
        sourceDocumentFileName: sourceDocumentFileName || undefined,
        sourceDocumentMimeType: sourceDocumentBase64 ? "application/pdf" : undefined,
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
        description: payload?.exactSourceDocument
          ? `Original PDF preserved · ${payload.emailsSent ?? 0}/${payload.emailsTotal ?? 0} email(s) sent`
          : payload?.emailsTotal ? `${payload.emailsSent}/${payload.emailsTotal} email(s) sent` : undefined,
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

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Request Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Provider Service Agreement"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-[#8dbeb5] transition-colors"
                />
              </div>

              <div className="rounded-xl border border-[#8dbeb5]/35 bg-[#8dbeb5]/[0.06] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Upload the actual PDF</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Recommended. The signer reviews these exact PDF pages, and the completed download keeps those source pages unchanged.</p>
                  </div>
                  <label className="shrink-0 cursor-pointer rounded-xl bg-[#8dbeb5] px-3 py-2 text-xs font-semibold text-[#031219] hover:opacity-90">
                    <Upload size={13} className="mr-1 inline" /> Choose PDF
                    <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => void selectPdf(e.target.files?.[0])} />
                  </label>
                </div>
                {sourceDocumentFileName && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{sourceDocumentFileName}</p>
                      <p className="text-[10px] text-muted-foreground">{(sourceDocumentBytes / 1024 / 1024).toFixed(2)} MB · exact-source mode</p>
                    </div>
                    <button type="button" onClick={() => { setSourceDocumentBase64(""); setSourceDocumentFileName(""); setSourceDocumentBytes(0); }} className="text-[10px] text-muted-foreground hover:text-foreground">Remove</button>
                  </div>
                )}
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
                      <p className="text-[11px] text-[#c8d2d1]">No templates yet. Create a reusable template first.</p>
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

              {!sourceDocumentBase64 && !selectedTemplateId && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">HTML document fallback</label>
                  <textarea
                    value={documentContent}
                    onChange={e => setDocumentContent(e.target.value)}
                    rows={8}
                    placeholder={`<h2>Document Title</h2>\n<p>Document body content...</p>`}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-mono outline-none focus:border-[#8dbeb5] resize-none transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Use this only for documents authored as HTML. Upload a PDF above when the original layout must be preserved.</p>
                </div>
              )}
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
              <div className="p-4 rounded-xl bg-muted/20 border border-border">
                <h3 className="font-semibold text-foreground text-sm mb-3">Request Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title</span>
                    <span className="font-medium text-foreground">{title}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Document</span>
                    <span className="font-medium text-foreground text-right">{sourceDocumentFileName || (selectedTemplateId ? "Template document" : "HTML document")}</span>
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

              <div className="p-4 rounded-xl bg-[#052a32]/45 border border-white/20 flex items-start gap-3">
                <AlertCircle size={14} className="text-[#8dbeb5] mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  By sending this request, signing links will be created for each recipient. Each signature is recorded with timestamp,
                  IP address, source-document hash, and an execution audit trail. Uploaded PDF source pages remain unchanged in the completed PDF.
                </p>
              </div>
            </div>
          )}
        </div>

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
