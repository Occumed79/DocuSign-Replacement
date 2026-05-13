import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Save, Search, ExternalLink, Trash2, Edit2, Upload, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Template {
  id: number;
  name: string;
  description: string | null;
  category: string;
  content: string;
  formSchema: unknown[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["All", "Medical", "Dental", "Immunization", "Agreements", "General"];

function packetCategory(template: Template): string {
  const text = `${template.name} ${template.category} ${template.description ?? ""}`.toLowerCase();
  if (text.includes("2813") || text.includes("dental")) return "Dental";
  if (text.includes("2808") || text.includes("2807") || text.includes("medical")) return "Medical";
  if (text.includes("vaccine") || text.includes("vaccination") || text.includes("immunization")) return "Immunization";
  if (text.includes("provider") || text.includes("agreement") || text.includes("service")) return "Agreements";
  return template.category || "General";
}

function packetSubtitle(template: Template): string {
  const name = template.name.toLowerCase();
  if (name.includes("2813")) return "Department of Defense Dental Examination";
  if (name.includes("2808")) return "Report of Medical Examination";
  if (name.includes("2807")) return "Report of Medical History";
  if (name.includes("vaccine") || name.includes("immunization")) return "Authorization for Immunization Services";
  if (name.includes("provider")) return "Provider Service Agreement";
  if (name.includes("release")) return "Authorization for Release of Medical Information";
  return template.description || "Embedded occupational health document";
}

function pageEstimate(content: string): number {
  const matches = content.match(/class=["']page["']/g);
  if (matches?.length) return matches.length;
  if (content.length > 55000) return 4;
  if (content.length > 30000) return 2;
  return 1;
}

function OccuMedWordmark() {
  return (
    <div className="flex items-center gap-3 rounded-[28px] border border-white/25 bg-black/15 px-5 py-3 shadow-[0_0_32px_rgba(141,190,181,.18)] backdrop-blur-2xl">
      <div className="grid h-10 w-14 grid-cols-3 gap-1 rounded-2xl border border-white/30 bg-[#8dbeb5]/10 p-1.5 shadow-[0_0_22px_rgba(141,190,181,.16)]">
        <div className="rounded-l-full border border-white/35 bg-[#8dbeb5]/20" />
        <div className="rounded-t-full border border-white/35 bg-[#8dbeb5]/15" />
        <div className="rounded-t-full border border-white/35 bg-[#8dbeb5]/12" />
      </div>
      <div className="leading-none">
        <div className="text-[10px] uppercase tracking-[0.35em] text-[#c8d2d1]/80">Occu-Med</div>
        <div className="text-lg font-semibold tracking-wide text-[#f4f7f6]">PacketPath</div>
      </div>
    </div>
  );
}

function PacketPreview({ template }: { template: Template }) {
  return (
    <div className="h-52 overflow-hidden rounded-[22px] border border-white/50 bg-white/80 shadow-inner">
      <iframe
        title={`${template.name} preview`}
        srcDoc={template.content}
        className="h-[820px] w-[820px] origin-top-left scale-[0.245] border-0 bg-white pointer-events-none"
        sandbox="allow-forms allow-same-origin"
      />
    </div>
  );
}

function PacketViewer({ template, onClose }: { template: Template; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#031219]/85 p-5 backdrop-blur-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[34px] border border-white/25 bg-white/10 shadow-[0_35px_120px_rgba(0,0,0,.45)] backdrop-blur-3xl">
        <div className="flex items-center justify-between border-b border-white/15 px-6 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#8dbeb5]/90">Embedded Packet Viewer</div>
            <h2 className="mt-1 text-2xl font-semibold text-white">{template.name}</h2>
            <p className="text-sm text-white/60">{packetSubtitle(template)}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/20 bg-white/10 p-3 text-white hover:bg-white/20">
            <X size={18} />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[210px_1fr] gap-4 p-5">
          <aside className="rounded-[28px] border border-white/15 bg-black/20 p-4 text-white/75 backdrop-blur-2xl">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#8dbeb5]">Packet Tools</div>
            <div className="space-y-2 text-sm">
              <div className="rounded-2xl bg-white/10 px-3 py-2">Preview form</div>
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-white/45">Add signer fields</div>
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-white/45">Create envelope</div>
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-white/45">Export PDF</div>
            </div>
            <div className="mt-6 rounded-3xl border border-white/20 bg-[#8dbeb5]/10 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#8dbeb5]/90">HIPAA Audit</div>
              <p className="mt-2 text-xs text-white/60">Viewer activity and PHI access are logged by PacketPath.</p>
            </div>
          </aside>
          <div className="template-iframe-shell min-h-0">
            <iframe title={template.name} srcDoc={template.content} sandbox="allow-forms allow-same-origin" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TemplateEditor({ onSave, onClose, token }: { onSave: () => void; onClose: () => void; token: string | null }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const importFile = async (file: File) => {
    const text = await file.text();
    setContent(text);
    if (!name.trim()) setName(file.name.replace(/\.html?$/i, "").replace(/[-_]/g, " "));
    toast({ title: "HTML form imported" });
  };

  const save = async () => {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    const res = await fetch("/api/signature-templates", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), category, description: description.trim() || null, content, formSchema: [] }),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Packet added" });
      onSave();
    } else {
      toast({ title: "Could not save packet", variant: "destructive" });
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-[#031219]/75 p-6 backdrop-blur-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="glass-card w-full max-w-4xl overflow-hidden rounded-[32px]" initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }}>
        <div className="flex items-center justify-between border-b border-white/35 px-6 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8dbeb5]">Add Packet</div>
            <h2 className="text-xl font-semibold">Import HTML Form</h2>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/40 p-2 hover:bg-white/70"><X size={18} /></button>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Packet name" className="rounded-2xl border border-white/60 bg-[#052a32]/70 text-[#f4f7f6] px-4 py-3 outline-none" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-2xl border border-white/60 bg-[#052a32]/70 text-[#f4f7f6] px-4 py-3 outline-none">
            {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
          </select>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 bg-white/10 px-4 py-3 font-medium text-[#f4f7f6] hover:bg-[#9bc8bf]/30">
            <Upload size={16} /> Upload HTML
            <input type="file" accept=".html,.htm,text/html" className="hidden" onChange={e => e.target.files?.[0] && importFile(e.target.files[0])} />
          </label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" className="md:col-span-3 rounded-2xl border border-white/60 bg-[#052a32]/70 text-[#f4f7f6] px-4 py-3 outline-none" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={14} placeholder="Paste or upload the full HTML form here" className="md:col-span-3 rounded-3xl border border-white/60 bg-[#052a32]/70 text-[#f4f7f6] p-4 font-mono text-xs outline-none" />
        </div>
        <div className="flex justify-end gap-3 border-t border-white/35 px-6 py-4">
          <button onClick={onClose} className="rounded-2xl border border-white/50 bg-white/40 px-5 py-2.5">Cancel</button>
          <button onClick={save} disabled={saving || !name.trim() || !content.trim()} className="rounded-2xl bg-[#8dbeb5] px-5 py-2.5 font-semibold text-[#f4f7f6] shadow-[0_0_30px_rgba(141,190,181,.16)] disabled:opacity-50">
            {saving ? "Saving..." : <span className="inline-flex items-center gap-2"><Save size={16} /> Save Packet</span>}
          </button>
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
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Template | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/signature-templates", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const deleteTemplate = async (id: number) => {
    if (!confirm("Delete this packet?")) return;
    const res = await fetch(`/api/signature-templates/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { toast({ title: "Packet deleted" }); fetchTemplates(); }
  };

  const filtered = templates.filter(t => {
    const cat = packetCategory(t);
    const matchesCat = category === "All" || cat === category;
    const matchesQuery = `${t.name} ${t.description ?? ""} ${cat}`.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <div className="mb-4"><OccuMedWordmark /></div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.38em] text-[#8dbeb5]/70">Document Center</div>
            <h1 className="mt-2 text-5xl font-semibold tracking-tight text-[#f4f7f6]">Packet Library</h1>
            <p className="mt-2 max-w-2xl text-base text-[#c8d2d1]">Embedded Occu-Med forms, DD packet documents, agreements, and authorization forms in one luminous workspace.</p>
          </div>
          <button onClick={() => setCreating(true)} className="rounded-[24px] bg-[#8dbeb5] px-6 py-3 font-semibold text-[#f4f7f6] shadow-[0_0_34px_rgba(183,236,72,.45)] hover:bg-[#9bc8bf]">
            <span className="inline-flex items-center gap-2"><Plus size={18} /> Add Form</span>
          </button>
        </div>

        <div className="glass-card mb-8 rounded-[32px] p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-[24px] border border-white/55 bg-white/45 px-4 py-3 backdrop-blur-xl">
              <Search size={18} className="text-[#8dbeb5]/75" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search packets, forms, or categories..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#f4f7f6]/35" />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={cn("rounded-2xl px-4 py-2 text-sm font-semibold transition", category === c ? "bg-[#8dbeb5] text-[#f4f7f6] shadow-[0_0_24px_rgba(141,190,181,.16)]" : "bg-white/35 text-[#f4f7f6]/70 hover:bg-white/55")}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-96 animate-pulse rounded-[34px]" />)}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((template, i) => {
              const cat = packetCategory(template);
              return (
                <motion.article key={template.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card group relative overflow-hidden rounded-[34px] p-4">
                  <div className="absolute right-4 top-4 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => setViewing(template)} className="rounded-full bg-white/70 p-2 text-[#f4f7f6] shadow"><ExternalLink size={15} /></button>
                    <button onClick={() => deleteTemplate(template.id)} className="rounded-full bg-white/70 p-2 text-red-700 shadow"><Trash2 size={15} /></button>
                  </div>
                  <button onClick={() => setViewing(template)} className="block w-full text-left">
                    <PacketPreview template={template} />
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#8dbeb5]/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f4f7f6]">{cat}</span>
                      <span className="text-xs text-[#f4f7f6]/55">{pageEstimate(template.content)} page{pageEstimate(template.content) === 1 ? "" : "s"}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-[#f4f7f6]">{template.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[#c8d2d1]">{packetSubtitle(template)}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/45 pt-3 text-xs text-[#f4f7f6]/55">
                      <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                      <span className="font-semibold text-[#8dbeb5]">Open packet</span>
                    </div>
                  </button>
                </motion.article>
              );
            })}

            <button onClick={() => setCreating(true)} className="glass-card flex min-h-[390px] flex-col items-center justify-center rounded-[34px] border border-dashed border-white/25 p-6 text-center hover:shadow-[0_0_60px_rgba(141,190,181,.18)]">
              <div className="mb-4 rounded-full border border-white/30 bg-[#8dbeb5]/20 p-6 shadow-[0_0_35px_rgba(141,190,181,.16)]"><Plus size={34} /></div>
              <h3 className="text-xl font-semibold">Add HTML Form</h3>
              <p className="mt-2 max-w-xs text-sm text-[#c8d2d1]/80">Upload or paste an Occu-Med form and it will become an embedded packet preview.</p>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {creating && <TemplateEditor token={token} onClose={() => setCreating(false)} onSave={() => { setCreating(false); fetchTemplates(); }} />}
        {viewing && <PacketViewer template={viewing} onClose={() => setViewing(null)} />}
      </AnimatePresence>
    </div>
  );
}
