import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Edit2, Trash2, Copy, X, Save, Tag, ClipboardList, GitBranch } from "lucide-react";
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

const CATEGORIES = [
  "General", "Consent Form", "Medical Clearance", "Pre-Employment", "Return to Work",
  "Release of Information", "HIPAA Notice", "Fitness for Duty", "Drug Testing",
];

const STARTER_TEMPLATES: { name: string; category: string; content: string }[] = [
  {
    name: "Pre-Employment Physical Consent",
    category: "Consent Form",
    content: `<h2>Pre-Employment Physical Examination Consent</h2>
<p>I, the undersigned, hereby authorize <strong>Occu-Med Occupational Health</strong> to perform a pre-employment physical examination as required by my prospective employer.</p>
<p>I understand that:</p>
<ul>
  <li>The examination is required as a condition of employment</li>
  <li>Results will be reported to the requesting employer in a limited format</li>
  <li>My personal health information is protected under HIPAA</li>
  <li>I may request a copy of any medical records generated during this examination</li>
</ul>
<p>I confirm that all information I provide is accurate and complete to the best of my knowledge.</p>`,
  },
  {
    name: "Release of Medical Information",
    category: "Release of Information",
    content: `<h2>Authorization for Release of Medical Information</h2>
<p>I hereby authorize <strong>Occu-Med Occupational Health</strong> to release the following health information:</p>
<p><strong>Information to be disclosed:</strong> Occupational health examination results, work status, and fitness-for-duty determinations.</p>
<p><strong>Purpose:</strong> Occupational health and return-to-work coordination.</p>
<p>This authorization is valid for one (1) year from the date of signing unless revoked in writing. I understand I have the right to revoke this authorization at any time by submitting a written request.</p>`,
  },
  {
    name: "Return to Work Authorization",
    category: "Return to Work",
    content: `<h2>Return to Work Authorization</h2>
<p>This document certifies that the patient named above has been evaluated by Occu-Med Occupational Health and is authorized to return to work under the following conditions:</p>
<ul>
  <li>Full duty with no restrictions</li>
  <li>Modified duty as specified by the treating physician</li>
</ul>
<p>The employee acknowledges understanding of any work restrictions and agrees to comply with all recommendations provided by the occupational health team.</p>`,
  },
  {
    name: "HIPAA Notice of Privacy Practices",
    category: "HIPAA Notice",
    content: `<h2>Acknowledgment of Receipt — HIPAA Notice of Privacy Practices</h2>
<p>I acknowledge that I have received a copy of <strong>Occu-Med's Notice of Privacy Practices</strong>, which describes how my protected health information may be used and disclosed.</p>
<p>I understand that Occu-Med has the right to change its notice of privacy practices and that I can obtain any revised notice by contacting the Privacy Officer or visiting our website.</p>
<p>This acknowledgment does not constitute consent to any specific use or disclosure of my protected health information.</p>`,
  },
];

type EditorTab = "document" | "form";

function TemplateEditor({
  template,
  onSave,
  onClose,
  token,
}: {
  template?: Template;
  onSave: () => void;
  onClose: () => void;
  token: string | null;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [category, setCategory] = useState(template?.category ?? "General");
  const [content, setContent] = useState(template?.content ?? "");
  const [formSchema, setFormSchema] = useState<FormField[]>(template?.formSchema ?? []);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("document");
  const [previewDoc, setPreviewDoc] = useState(false);

  const save = async () => {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    const url = template ? `/api/signature-templates/${template.id}` : "/api/signature-templates";
    const method = template ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, category, content, formSchema }),
    });
    if (res.ok) {
      toast({ title: template ? "Template updated" : "Template created" });
      onSave();
    } else {
      toast({ title: "Failed to save template", variant: "destructive" });
    }
    setSaving(false);
  };


  const importDocumentFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.html') || lower.endsWith('.htm')) {
      const text = await file.text();
      setContent(text);
      if (!name.trim()) setName(file.name.replace(/\.html?$/i, '').replace(/[-_]/g, ' '));
      toast({ title: 'HTML imported' });
      return;
    }

    if (lower.endsWith('.pdf')) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      setContent(`<div style="display:flex;flex-direction:column;gap:12px;">
  <p><strong>Imported PDF:</strong> ${file.name}</p>
  <object data="${dataUrl}" type="application/pdf" width="100%" height="900">
    <p>Your browser cannot preview this PDF. Download file: <a href="${dataUrl}" download="${file.name}">${file.name}</a></p>
  </object>
</div>`);
      if (!name.trim()) setName(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
      toast({ title: 'PDF imported (embedded)' });
      return;
    }


    if (file.type.startsWith('image/')) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      setContent(`<div style="display:flex;flex-direction:column;gap:12px;">
  <p><strong>Imported image form:</strong> ${file.name}</p>
  <img src="${dataUrl}" alt="${file.name}" style="max-width:100%;border:1px solid #d1d5db;border-radius:8px;" />
</div>`);
      if (!name.trim()) setName(file.name.replace(/\.[^.]+$/i, '').replace(/[-_]/g, ' '));
      toast({ title: 'Image imported' });
      return;
    }

    const genericDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setContent(`<div style="display:flex;flex-direction:column;gap:12px;">
  <p><strong>Imported file:</strong> ${file.name}</p>
  <p>This file type cannot be rendered inline, but it has been attached to the template content.</p>
  <a href="${genericDataUrl}" download="${file.name}">Download ${file.name}</a>
</div>`);
    if (!name.trim()) setName(file.name.replace(/\.[^.]+$/i, '').replace(/[-_]/g, ' '));
    toast({ title: 'File imported as attachment' });
    return;
  };
  const conditionalCount = formSchema.filter(f => f.showWhen?.fieldId).length;

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
        className="glass-card rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <FileText size={16} className="text-indigo-500" />
            {template ? "Edit Template" : "New Template"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Meta fields (always visible) */}
        <div className="px-6 pt-4 pb-3 border-b border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Template Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Pre-Employment Consent"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-indigo-400"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-3 border-b border-border">
          <button
            onClick={() => setActiveTab("document")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
              activeTab === "document"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText size={13} /> Document
          </button>
          <button
            onClick={() => setActiveTab("form")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
              activeTab === "form"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardList size={13} /> Form Fields
            {formSchema.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium">
                {formSchema.length}
              </span>
            )}
            {conditionalCount > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 text-xs font-medium">
                <GitBranch size={9} />{conditionalCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "document" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document Content (HTML) *</label>
                  <div className="flex items-center gap-2">
                    <label className="text-xs cursor-pointer px-2.5 py-1 rounded-lg border border-border hover:bg-muted/40">
                      Import Any File
                      <input
                        type="file"
                        accept="*/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await importDocumentFile(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-muted-foreground">HTML stays editable; PDF and images render inline; other files attach as downloads.</span>
                    {content && (
                      <button
                        onClick={() => setPreviewDoc(p => !p)}
                        className="text-xs text-indigo-500 hover:text-indigo-700"
                      >
                        {previewDoc ? "Edit HTML" : "Preview"}
                      </button>
                    )}
                  </div>
                </div>
                {!previewDoc ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">Use basic HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;</p>
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      rows={18}
                      placeholder="<h2>Document Title</h2><p>Document body...</p>"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-mono outline-none focus:border-indigo-400 resize-none transition-colors"
                    />
                  </>
                ) : (
                  <div
                    className="p-5 rounded-xl border border-border bg-white/50 prose prose-sm max-w-none text-foreground"
                    style={{ fontFamily: "Georgia, serif", lineHeight: 1.8, fontSize: 14 }}
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === "form" && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-sm font-medium text-indigo-800 mb-1">How form fields work</p>
                <p className="text-xs text-indigo-700">
                  Form fields are presented to the signer <strong>before</strong> they sign. Use <strong>Yes/No</strong> fields
                  with conditional logic to show follow-up questions automatically — for example, if "History of gout" = Yes,
                  show "Date of last flare-up". All required fields must be completed before the signer can apply their signature.
                </p>
              </div>
              <FormBuilder fields={formSchema} onChange={setFormSchema} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {formSchema.length > 0 ? (
              <span>{formSchema.length} form field{formSchema.length !== 1 ? "s" : ""}{conditionalCount > 0 ? `, ${conditionalCount} conditional` : ""}</span>
            ) : (
              <span>No form fields — signers will only see the document above</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground border border-border hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !name.trim() || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
              {template ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SignatureTemplatesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/signature-templates", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const deleteTemplate = async (id: number) => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    const res = await fetch(`/api/signature-templates/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast({ title: "Template deleted" }); fetchTemplates(); }
  };

  const seedStarterTemplates = async () => {
    for (const t of STARTER_TEMPLATES) {
      await fetch("/api/signature-templates", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
    }
    toast({ title: `${STARTER_TEMPLATES.length} starter templates added` });
    fetchTemplates();
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filtered = categoryFilter ? templates.filter(t => t.category === categoryFilter) : templates;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Document Templates</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Reusable templates with smart form fields and conditional logic</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {templates.length === 0 && (
              <button
                onClick={seedStarterTemplates}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                <Copy size={14} /> Load Starter Templates
              </button>
            )}
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg"
            >
              <Plus size={14} /> New Template
            </button>
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCategoryFilter("")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                !categoryFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All ({templates.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {cat} ({templates.filter(t => t.category === cat).length})
              </button>
            ))}
          </div>
        )}

        {/* Template grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                <div className="h-4 w-48 bg-muted rounded mb-2" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <FileText size={40} className="text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-foreground font-medium mb-1">No templates yet</p>
            <p className="text-muted-foreground text-sm mb-5">Create reusable document templates with smart conditional form fields.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={seedStarterTemplates}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                <Copy size={14} /> Load Starters
              </button>
              <button
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus size={14} /> New Template
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((template, i) => {
              const fieldCount = (template.formSchema ?? []).length;
              const conditionalCount = (template.formSchema ?? []).filter(f => f.showWhen?.fieldId).length;
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setEditing(template)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setEditing(template);
                    }
                  }}
                  className="glass-card rounded-2xl p-5 hover:shadow-md transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm truncate">{template.name}</h3>
                      {template.description && (
                        <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{template.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing(template); }}
                        className="p-1.5 rounded-lg bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                        aria-label={`Edit ${template.name}`}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                        className="p-1.5 rounded-lg bg-muted/40 hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete"
                        aria-label={`Delete ${template.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                      <Tag size={10} />
                      {template.category}
                    </span>
                    {fieldCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                        <ClipboardList size={10} />
                        {fieldCount} field{fieldCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {conditionalCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium">
                        <GitBranch size={10} />
                        {conditionalCount} conditional
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      Updated {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Content preview */}
                  <div
                    className="mt-3 p-3 rounded-lg bg-muted/20 border border-border/50 text-xs text-muted-foreground line-clamp-3"
                    style={{ fontFamily: "Georgia, serif" }}
                    dangerouslySetInnerHTML={{ __html: template.content.slice(0, 200) + "..." }}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {(creating || editing) && (
          <TemplateEditor
            template={editing}
            token={token}
            onClose={() => { setCreating(false); setEditing(undefined); }}
            onSave={() => { setCreating(false); setEditing(undefined); fetchTemplates(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
