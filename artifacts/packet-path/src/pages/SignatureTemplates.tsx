import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Edit2,
  FileCheck2,
  FileText,
  GitBranch,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import FormBuilder, { type FormField } from "@/components/signatures/FormBuilder";

interface Template {
  id: number;
  name: string;
  description: string | null;
  category: string;
  content: string;
  formSchema: FormField[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type EditorTab = "document" | "form";
type ViewMode = "grid" | "list";

const MAX_PDF_BYTES = 8 * 1024 * 1024;
const CATEGORIES = [
  "General",
  "Consent Form",
  "Medical Clearance",
  "Pre-Employment",
  "Return to Work",
  "Release of Information",
  "HIPAA Notice",
  "Fitness for Duty",
  "Drug Testing",
];

function htmlPreviewText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readFileAsBase64(file: File): Promise<string> {
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

function TemplateEditor({
  template,
  token,
  onClose,
  onSaved,
}: {
  template?: Template;
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [category, setCategory] = useState(template?.category ?? "General");
  const [content, setContent] = useState(template?.content ?? "");
  const [formSchema, setFormSchema] = useState<FormField[]>(template?.formSchema ?? []);
  const [activeTab, setActiveTab] = useState<EditorTab>("document");
  const [saving, setSaving] = useState(false);
  const [sourcePdfBase64, setSourcePdfBase64] = useState("");
  const [sourcePdfFileName, setSourcePdfFileName] = useState("");
  const [sourcePdfBytes, setSourcePdfBytes] = useState(0);
  const [existingSourcePdf, setExistingSourcePdf] = useState(false);
  const [checkingSource, setCheckingSource] = useState(Boolean(template));

  useEffect(() => {
    if (!template) return;
    let cancelled = false;
    void fetch(`/api/signature-templates/${template.id}/source-document`, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (!cancelled) setExistingSourcePdf(res.ok);
    }).catch(() => {
      if (!cancelled) setExistingSourcePdf(false);
    }).finally(() => {
      if (!cancelled) setCheckingSource(false);
    });
    return () => { cancelled = true; };
  }, [template, token]);

  const importFile = async (file?: File) => {
    if (!file) return;
    const lower = file.name.toLowerCase();

    if (lower.endsWith(".pdf")) {
      if (file.size > MAX_PDF_BYTES) {
        toast({ title: "PDF is too large", description: "Exact-source template PDFs are limited to 8 MB.", variant: "destructive" });
        return;
      }
      try {
        const base64 = await readFileAsBase64(file);
        setSourcePdfBase64(base64);
        setSourcePdfFileName(file.name);
        setSourcePdfBytes(file.size);
        setContent(`<p><strong>Original PDF document:</strong> ${file.name.replace(/[<>&]/g, "")}</p>`);
        if (!name.trim()) setName(file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "));
        toast({ title: "Exact PDF source ready", description: "The original PDF bytes will be attached to this template when you save." });
      } catch {
        toast({ title: "Unable to read PDF", variant: "destructive" });
      }
      return;
    }

    if (lower.endsWith(".html") || lower.endsWith(".htm")) {
      const text = await file.text();
      setContent(text);
      setSourcePdfBase64("");
      setSourcePdfFileName("");
      setSourcePdfBytes(0);
      if (!name.trim()) setName(file.name.replace(/\.html?$/i, "").replace(/[-_]+/g, " "));
      toast({ title: "HTML imported" });
      return;
    }

    toast({ title: "Unsupported template source", description: "Use PDF for exact-source documents or HTML for authored documents.", variant: "destructive" });
  };

  const removeExistingSource = async () => {
    if (!template || !existingSourcePdf) return;
    const res = await fetch(`/api/signature-templates/${template.id}/source-document`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      toast({ title: "Unable to remove source PDF", variant: "destructive" });
      return;
    }
    setExistingSourcePdf(false);
    toast({ title: "Exact PDF source removed" });
  };

  const save = async () => {
    if (!name.trim()) {
      toast({ title: "Template name is required" });
      return;
    }
    if (!content.trim() && !sourcePdfBase64 && !existingSourcePdf) {
      toast({ title: "Add document content or a PDF source" });
      return;
    }

    setSaving(true);
    try {
      const url = template ? `/api/signature-templates/${template.id}` : "/api/signature-templates";
      const method = template ? "PUT" : "POST";
      const documentContent = content.trim() || `<p><strong>Original PDF document:</strong> ${sourcePdfFileName || "source.pdf"}</p>`;
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          content: documentContent,
          formSchema,
        }),
      });
      const saved = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(saved.error || "Unable to save template");
      const templateId = Number(saved.id ?? template?.id);
      if (!templateId) throw new Error("Template was saved without an id");

      if (sourcePdfBase64) {
        const sourceRes = await fetch(`/api/signature-templates/${templateId}/source-document`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ sourceDocumentBase64: sourcePdfBase64, fileName: sourcePdfFileName }),
        });
        const sourcePayload = await sourceRes.json().catch(() => ({}));
        if (!sourceRes.ok) throw new Error(sourcePayload.error || "Template saved, but the exact PDF source could not be attached");
      }

      toast({
        title: template ? "Template updated" : "Template created",
        description: sourcePdfBase64 ? "Exact PDF source attached." : existingSourcePdf ? "Existing exact PDF source preserved." : undefined,
      });
      onSaved();
    } catch (err: any) {
      toast({ title: err?.message || "Unable to save template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const conditionalCount = formSchema.filter(field => field.showWhen?.fieldId).length;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={event => event.stopPropagation()}
        className="glass-card flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">Reusable signing template</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{template ? "Edit template" : "New template"}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"><X size={17} /></button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-border/60 px-6 py-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name *</label>
            <input value={name} onChange={event => setName(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
            <select value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60">
              {CATEGORIES.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
            <input value={description} onChange={event => setDescription(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-border/60 px-6 py-2">
          <button onClick={() => setActiveTab("document")} className={cn("rounded-xl px-4 py-2 text-sm font-medium", activeTab === "document" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>Document</button>
          <button onClick={() => setActiveTab("form")} className={cn("rounded-xl px-4 py-2 text-sm font-medium", activeTab === "form" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>Form fields {formSchema.length > 0 && `(${formSchema.length})`}</button>
          {conditionalCount > 0 && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700"><GitBranch size={10} /> {conditionalCount} conditional</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "document" ? (
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2"><FileCheck2 size={16} className="text-primary" /><h3 className="text-sm font-semibold text-foreground">Exact source PDF</h3></div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Use a PDF when the completed document must preserve the original pages exactly. PacketPath attaches execution evidence separately instead of recreating the PDF.</p>
                  <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                    <Upload size={14} /> Choose PDF
                    <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={event => void importFile(event.target.files?.[0])} />
                  </label>
                  {sourcePdfFileName && (
                    <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3">
                      <div className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 text-emerald-600" /><div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{sourcePdfFileName}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{(sourcePdfBytes / 1024 / 1024).toFixed(2)} MB · attaches on save</p></div></div>
                    </div>
                  )}
                  {!sourcePdfFileName && existingSourcePdf && (
                    <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3">
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">Exact PDF source already attached</p>
                      <button onClick={() => void removeExistingSource()} className="mt-2 text-[10px] font-semibold text-red-600 hover:underline">Remove PDF source</button>
                    </div>
                  )}
                  {checkingSource && <p className="mt-3 text-[10px] text-muted-foreground">Checking source document...</p>}
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <h3 className="text-sm font-semibold text-foreground">HTML document</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Use HTML for documents authored inside PacketPath where exact external PDF layout is not required.</p>
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/40">
                    <Upload size={14} /> Import HTML
                    <input type="file" accept="text/html,.html,.htm" className="hidden" onChange={event => void importFile(event.target.files?.[0])} />
                  </label>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">HTML / fallback content</label><span className="text-[10px] text-muted-foreground">PDF templates keep only a lightweight fallback here</span></div>
                <textarea value={content} onChange={event => setContent(event.target.value)} rows={18} className="w-full resize-y rounded-2xl border border-border bg-background p-4 font-mono text-xs leading-5 text-foreground outline-none focus:border-primary/60" placeholder="<h2>Document title</h2>..." />
                {content && <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Text preview</p><p className="mt-1 line-clamp-3 text-xs leading-5 text-foreground/75">{htmlPreviewText(content) || "No text preview"}</p></div>}
              </div>
            </div>
          ) : (
            <FormBuilder fields={formSchema} onChange={setFormSchema} />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <p className="text-xs text-muted-foreground">{sourcePdfFileName || existingSourcePdf ? "Exact-source PDF mode" : "HTML-authored mode"}</p>
          <div className="flex gap-2"><button onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground">Cancel</button><button onClick={() => void save()} disabled={saving} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{saving ? "Saving" : "Save template"}</button></div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SignatureTemplatesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [editorTemplate, setEditorTemplate] = useState<Template | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/signature-templates", { headers: { Authorization: `Bearer ${token}` } });
      const payload = await res.json().catch(() => []);
      if (!res.ok) throw new Error(payload.error || "Unable to load templates");
      setTemplates(Array.isArray(payload) ? payload : []);
    } catch (err: any) {
      toast({ title: err?.message || "Unable to load templates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter(template => `${template.name} ${template.category} ${template.description ?? ""}`.toLowerCase().includes(term));
  }, [search, templates]);

  const removeTemplate = async (template: Template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    const res = await fetch(`/api/signature-templates/${template.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      toast({ title: "Unable to delete template", variant: "destructive" });
      return;
    }
    toast({ title: "Template deleted" });
    await load();
  };

  const duplicateTemplate = async (template: Template) => {
    const res = await fetch("/api/signature-templates", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${template.name} Copy`, description: template.description, category: template.category, content: template.content, formSchema: template.formSchema }),
    });
    if (!res.ok) {
      toast({ title: "Unable to duplicate template", variant: "destructive" });
      return;
    }
    toast({ title: "Template duplicated", description: "Document/form content copied. Exact PDF source can be attached from Edit." });
    await load();
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl p-8">
      <AnimatePresence>
        {editorTemplate !== undefined && (
          <TemplateEditor
            template={editorTemplate ?? undefined}
            token={token}
            onClose={() => setEditorTemplate(undefined)}
            onSaved={async () => { setEditorTemplate(undefined); await load(); }}
          />
        )}
      </AnimatePresence>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">E-Signature library</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Signature Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create reusable documents, attach exact PDF sources, and define signer fields.</p>
        </div>
        <button onClick={() => setEditorTemplate(null)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus size={15} /> New Template</button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/15 p-3">
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search templates..." className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/60" /></div>
        <div className="flex items-center gap-1 rounded-xl border border-border p-1"><button onClick={() => setView("grid")} className={cn("rounded-lg p-2", view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><LayoutGrid size={15} /></button><button onClick={() => setView("list")} className={cn("rounded-lg p-2", view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><List size={15} /></button></div>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 animate-spin" size={17} /> Loading templates...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex min-h-64 flex-col items-center justify-center rounded-3xl p-8 text-center"><FileText size={36} className="text-muted-foreground/40" /><h2 className="mt-4 text-lg font-semibold text-foreground">No templates found</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Create a template and attach an exact source PDF when document layout must be preserved.</p><button onClick={() => setEditorTemplate(null)} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus size={14} className="mr-1 inline" /> Create template</button></div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(template => (
            <motion.div key={template.id} layout className="glass-card rounded-2xl border border-border/70 p-5">
              <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText size={18} /></div><span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground">{template.category}</span></div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{template.name}</h3>
              <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{template.description || htmlPreviewText(template.content) || "Reusable signing template"}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground"><span>{template.formSchema?.length ?? 0} fields</span><span>{new Date(template.updatedAt).toLocaleDateString()}</span></div>
              <div className="mt-4 grid grid-cols-[1fr_auto_auto_auto] gap-2"><button onClick={() => setLocation(`/esignatures?templateId=${template.id}&from=template`)} className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Send size={13} /> Use</button><button onClick={() => setEditorTemplate(template)} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground" title="Edit"><Edit2 size={14} /></button><button onClick={() => void duplicateTemplate(template)} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground" title="Duplicate"><Copy size={14} /></button><button onClick={() => void removeTemplate(template)} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-red-600" title="Delete"><Trash2 size={14} /></button></div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[1fr_160px_110px_150px] gap-4 bg-muted/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><span>Template</span><span>Category</span><span>Fields</span><span>Actions</span></div>
          {filtered.map(template => (
            <div key={template.id} className="grid grid-cols-[1fr_160px_110px_150px] items-center gap-4 border-t border-border bg-background/40 px-4 py-3"><div><p className="text-sm font-medium text-foreground">{template.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{template.description || htmlPreviewText(template.content)}</p></div><span className="text-xs text-muted-foreground">{template.category}</span><span className="text-xs text-muted-foreground">{template.formSchema?.length ?? 0}</span><div className="flex gap-1"><button onClick={() => setLocation(`/esignatures?templateId=${template.id}&from=template`)} className="rounded-lg bg-primary p-2 text-primary-foreground" title="Use"><Send size={13} /></button><button onClick={() => setEditorTemplate(template)} className="rounded-lg border border-border p-2 text-muted-foreground" title="Edit"><Edit2 size={13} /></button><button onClick={() => void duplicateTemplate(template)} className="rounded-lg border border-border p-2 text-muted-foreground" title="Duplicate"><Copy size={13} /></button><button onClick={() => void removeTemplate(template)} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-red-600" title="Delete"><Trash2 size={13} /></button></div></div>
          ))}
        </div>
      )}
    </div>
  );
}
