import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileSearch,
  FileUp,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type MapStrategy = "acroform" | "overlay";

type RegistryEntry = {
  sourceFamily: string;
  name: string;
  sha256: string;
  pageCount: number;
  strategy: MapStrategy;
  mappingVersion: number;
};

type ExamType = {
  id: number;
  slug: string;
  name: string;
};

type InstalledSource = {
  id: number;
  examTypeId: number;
  sourceFamily: string;
  sourceSha256: string;
  sourceFileName: string;
  pageCount: number;
  mappingValidatedAt: string | null;
  isActive: boolean;
  updatedAt: string;
};

type PdfField = {
  name: string;
  type: string;
  options?: string[];
};

type SourceQuestion = {
  questionId: number;
  sourceKey: string;
  text: string;
  section: string;
  answerType: string;
};

type FieldDescriptor =
  | { kind: "text"; field: string }
  | { kind: "checkbox"; field: string; checkedWhen: string[] }
  | { kind: "checkbox_pair"; yesField: string; noField: string; unsureField?: string }
  | { kind: "radio"; field: string; yesValue: string; noValue: string; unsureValue?: string }
  | { kind: "overlay"; page: number; x: number; y: number; width?: number; height?: number; fontSize?: number; align?: "left" | "center" | "right" };

type SourceMapping = Record<string, FieldDescriptor>;

type InspectionPayload = {
  sourceId: number;
  sourceFamily: string;
  sourceFileName: string;
  strategy: MapStrategy;
  mappingVersion: number;
  mappingValidatedAt: string | null;
  pageSizes: Array<{ width: number; height: number }>;
  fields: PdfField[];
  sourceQuestions: SourceQuestion[];
  fieldMap: SourceMapping;
};

type RegistryPayload = {
  registry: RegistryEntry[];
  examTypes: ExamType[];
  installed: InstalledSource[];
};

const emptyRegistry: RegistryPayload = { registry: [], examTypes: [], installed: [] };

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not validated";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function shortHash(value: string): string {
  return value.length > 16 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

function mappingExample(strategy: MapStrategy): string {
  if (strategy === "overlay") {
    return `{
  "stable.source.key": {
    "kind": "overlay",
    "page": 0,
    "x": 72,
    "y": 640,
    "width": 180,
    "height": 14,
    "fontSize": 9,
    "align": "left"
  }
}`;
  }
  return `{
  "stable.source.key": {
    "kind": "text",
    "field": "Exact PDF field name"
  }
}`;
}

export default function OfficialSourceFormsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<RegistryPayload>(emptyRegistry);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState("");
  const [examTypeId, setExamTypeId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inspection, setInspection] = useState<InspectionPayload | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [mappingText, setMappingText] = useState("{}");
  const [savingMapping, setSavingMapping] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Mapping helper state. It never bypasses backend validation; it only builds JSON.
  const [helperSourceKey, setHelperSourceKey] = useState("");
  const [helperKind, setHelperKind] = useState<FieldDescriptor["kind"]>("text");
  const [helperField, setHelperField] = useState("");
  const [helperYesField, setHelperYesField] = useState("");
  const [helperNoField, setHelperNoField] = useState("");
  const [helperUnsureField, setHelperUnsureField] = useState("");
  const [helperCheckedWhen, setHelperCheckedWhen] = useState("yes,true,1");
  const [helperYesValue, setHelperYesValue] = useState("Yes");
  const [helperNoValue, setHelperNoValue] = useState("No");
  const [helperUnsureValue, setHelperUnsureValue] = useState("");
  const [helperPage, setHelperPage] = useState(0);
  const [helperX, setHelperX] = useState(72);
  const [helperY, setHelperY] = useState(640);
  const [helperWidth, setHelperWidth] = useState(180);
  const [helperHeight, setHelperHeight] = useState(14);
  const [helperFontSize, setHelperFontSize] = useState(9);
  const [helperAlign, setHelperAlign] = useState<"left" | "center" | "right">("left");

  const api = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  }, [token]);

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await api("/api/medical-source-forms/registry") as RegistryPayload;
      setData(payload);
      setSelectedFamily(current => current || payload.registry[0]?.sourceFamily || "");
    } catch (err: any) {
      toast({ title: err?.message || "Unable to load official source forms", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => { void loadRegistry(); }, [loadRegistry]);

  const selectedRegistry = useMemo(
    () => data.registry.find(entry => entry.sourceFamily === selectedFamily) ?? null,
    [data.registry, selectedFamily],
  );

  const familyInstallations = useMemo(
    () => data.installed.filter(source => source.sourceFamily === selectedFamily),
    [data.installed, selectedFamily],
  );

  const selectedInstallation = useMemo(
    () => examTypeId == null ? null : data.installed.find(source => source.examTypeId === examTypeId && source.sourceFamily === selectedFamily && source.isActive) ?? null,
    [data.installed, examTypeId, selectedFamily],
  );

  const activeByExamType = useMemo(() => {
    const map = new Map<number, InstalledSource>();
    data.installed.filter(source => source.isActive).forEach(source => map.set(source.examTypeId, source));
    return map;
  }, [data.installed]);

  useEffect(() => {
    setInspection(null);
    setMappingText("{}");
    setFile(null);
    setHelperSourceKey("");
    const active = familyInstallations.find(source => source.isActive) ?? familyInstallations[0];
    if (active) setExamTypeId(active.examTypeId);
    else if (examTypeId == null && data.examTypes.length) setExamTypeId(data.examTypes[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFamily]);

  const readyCount = data.installed.filter(source => source.isActive && source.mappingValidatedAt).length;
  const installedFamilies = new Set(data.installed.filter(source => source.isActive).map(source => source.sourceFamily)).size;

  const inspect = useCallback(async (targetExamTypeId = examTypeId) => {
    if (targetExamTypeId == null) return;
    setInspecting(true);
    try {
      const payload = await api(`/api/medical-source-forms/${targetExamTypeId}/fields`) as InspectionPayload;
      setInspection(payload);
      setMappingText(JSON.stringify(payload.fieldMap ?? {}, null, 2));
      setHelperSourceKey(payload.sourceQuestions[0]?.sourceKey ?? "");
      setHelperKind(payload.strategy === "overlay" ? "overlay" : "text");
    } catch (err: any) {
      setInspection(null);
      toast({ title: err?.message || "Unable to inspect source PDF", variant: "destructive" });
    } finally {
      setInspecting(false);
    }
  }, [api, examTypeId, toast]);

  useEffect(() => {
    if (selectedInstallation) void inspect(selectedInstallation.examTypeId);
    else {
      setInspection(null);
      setMappingText("{}");
    }
  }, [selectedInstallation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function upload() {
    if (!selectedRegistry || examTypeId == null || !file) {
      toast({ title: "Choose an exam type and the exact registered PDF first", variant: "destructive" });
      return;
    }
    const existingForExam = activeByExamType.get(examTypeId);
    if (existingForExam && existingForExam.sourceFamily !== selectedRegistry.sourceFamily) {
      toast({
        title: "This exam type already has an active official source",
        description: `Remove ${existingForExam.sourceFamily} before assigning ${selectedRegistry.sourceFamily}.`,
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await api(`/api/medical-source-forms/${examTypeId}/upload`, {
        method: "POST",
        body: JSON.stringify({
          sourceFamily: selectedRegistry.sourceFamily,
          fileName: file.name,
          sourceDocumentBase64: bytesToBase64(bytes),
        }),
      });
      toast({ title: "Exact source PDF verified and installed" });
      setFile(null);
      await loadRegistry();
      await inspect(examTypeId);
    } catch (err: any) {
      toast({ title: err?.message || "Unable to upload source PDF", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function addHelperMapping() {
    if (!inspection || !helperSourceKey) return;
    let mapping: SourceMapping;
    try {
      mapping = JSON.parse(mappingText || "{}") as SourceMapping;
      if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) throw new Error();
    } catch {
      toast({ title: "Fix the mapping JSON before using the helper", variant: "destructive" });
      return;
    }

    let descriptor: FieldDescriptor;
    if (inspection.strategy === "overlay") {
      descriptor = {
        kind: "overlay",
        page: helperPage,
        x: helperX,
        y: helperY,
        width: helperWidth,
        height: helperHeight,
        fontSize: helperFontSize,
        align: helperAlign,
      };
    } else if (helperKind === "checkbox_pair") {
      if (!helperYesField || !helperNoField) {
        toast({ title: "Choose both Yes and No fields", variant: "destructive" });
        return;
      }
      descriptor = { kind: "checkbox_pair", yesField: helperYesField, noField: helperNoField, ...(helperUnsureField ? { unsureField: helperUnsureField } : {}) };
    } else if (helperKind === "checkbox") {
      if (!helperField) {
        toast({ title: "Choose a PDF field", variant: "destructive" });
        return;
      }
      descriptor = { kind: "checkbox", field: helperField, checkedWhen: helperCheckedWhen.split(",").map(value => value.trim()).filter(Boolean) };
    } else if (helperKind === "radio") {
      if (!helperField || !helperYesValue || !helperNoValue) {
        toast({ title: "Choose a radio field and Yes/No export values", variant: "destructive" });
        return;
      }
      descriptor = { kind: "radio", field: helperField, yesValue: helperYesValue, noValue: helperNoValue, ...(helperUnsureValue ? { unsureValue: helperUnsureValue } : {}) };
    } else {
      if (!helperField) {
        toast({ title: "Choose a PDF field", variant: "destructive" });
        return;
      }
      descriptor = { kind: "text", field: helperField };
    }

    mapping[helperSourceKey] = descriptor;
    setMappingText(JSON.stringify(mapping, null, 2));
    toast({ title: `Mapped ${helperSourceKey}` });
  }

  async function saveMapping() {
    if (!inspection) return;
    let fieldMap: SourceMapping;
    try {
      fieldMap = JSON.parse(mappingText) as SourceMapping;
      if (!fieldMap || typeof fieldMap !== "object" || Array.isArray(fieldMap)) throw new Error();
    } catch {
      toast({ title: "Mapping must be valid JSON object", variant: "destructive" });
      return;
    }
    setSavingMapping(true);
    try {
      const result = await api(`/api/medical-source-forms/${inspection.sourceId}/mapping`, {
        method: "PUT",
        body: JSON.stringify({ fieldMap }),
      });
      toast({ title: `Mapping validated — ${result.mappedKeys?.length ?? 0} source keys ready` });
      await loadRegistry();
      await inspect(examTypeId);
    } catch (err: any) {
      toast({ title: err?.message || "Mapping validation failed", variant: "destructive" });
    } finally {
      setSavingMapping(false);
    }
  }

  async function removeSource() {
    if (!selectedInstallation) return;
    if (!window.confirm(`Remove ${selectedInstallation.sourceFileName} and its mapping?`)) return;
    setDeleting(true);
    try {
      await api(`/api/medical-source-forms/${selectedInstallation.id}`, { method: "DELETE" });
      toast({ title: "Official source PDF removed" });
      setInspection(null);
      setMappingText("{}");
      await loadRegistry();
    } catch (err: any) {
      toast({ title: err?.message || "Unable to remove source PDF", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  const mappedKeys = useMemo(() => {
    try {
      const parsed = JSON.parse(mappingText || "{}") as SourceMapping;
      return new Set(Object.keys(parsed ?? {}));
    } catch {
      return new Set<string>();
    }
  }, [mappingText]);

  const fieldOptions = inspection?.fields ?? [];
  const helperRadioField = fieldOptions.find(field => field.name === helperField);

  return (
    <div className="mx-auto max-w-[1500px] p-7 lg:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">Document Control</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Official Source Forms</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Install the exact verified questionnaire PDFs and validate how PacketPath writes answers back into each official form.</p>
        </div>
        <button onClick={() => void loadRegistry()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl border border-border/70 p-5"><p className="text-xs text-muted-foreground">Registered revisions</p><p className="mt-1 text-2xl font-semibold text-foreground">{data.registry.length}</p><p className="mt-1 text-[11px] text-muted-foreground">Exact SHA-256 fingerprints</p></div>
        <div className="glass-card rounded-2xl border border-border/70 p-5"><p className="text-xs text-muted-foreground">Installed families</p><p className="mt-1 text-2xl font-semibold text-foreground">{installedFamilies}</p><p className="mt-1 text-[11px] text-muted-foreground">Active source PDFs</p></div>
        <div className="glass-card rounded-2xl border border-border/70 p-5"><p className="text-xs text-muted-foreground">Ready mappings</p><p className="mt-1 text-2xl font-semibold text-foreground">{readyCount}</p><p className="mt-1 text-[11px] text-muted-foreground">Validated for generation</p></div>
      </div>

      {loading && data.registry.length === 0 ? (
        <div className="glass-card flex min-h-64 items-center justify-center rounded-3xl text-sm text-muted-foreground"><Loader2 className="mr-2 animate-spin" size={17} /> Loading source-form registry...</div>
      ) : (
        <div className="grid min-h-[680px] gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
          <section className="glass-card overflow-hidden rounded-3xl border border-border/70">
            <div className="border-b border-border/70 p-5"><h2 className="text-sm font-semibold text-foreground">Verified form library</h2><p className="mt-1 text-xs text-muted-foreground">Choose a source family to install or map.</p></div>
            <div className="max-h-[760px] overflow-y-auto p-2">
              {data.registry.map(entry => {
                const installs = data.installed.filter(item => item.sourceFamily === entry.sourceFamily && item.isActive);
                const ready = installs.some(item => Boolean(item.mappingValidatedAt));
                const selected = selectedFamily === entry.sourceFamily;
                return (
                  <button key={entry.sourceFamily} onClick={() => setSelectedFamily(entry.sourceFamily)} className={`mb-1 w-full rounded-2xl border px-4 py-3.5 text-left transition-all ${selected ? "border-primary/35 bg-primary/10" : "border-transparent hover:border-border/70 hover:bg-muted/30"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${ready ? "bg-emerald-500/10 text-emerald-600" : installs.length ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                        {ready ? <FileCheck2 size={16} /> : <FileSearch size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-5 text-foreground">{entry.name}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground"><span className="rounded-md bg-muted/60 px-1.5 py-0.5">{entry.pageCount} pages</span><span className="rounded-md bg-muted/60 px-1.5 py-0.5">{entry.strategy}</span><span className="rounded-md bg-muted/60 px-1.5 py-0.5">v{entry.mappingVersion}</span></div>
                      </div>
                      <ChevronRight size={15} className="mt-2 shrink-0 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedRegistry ? (
            <section className="space-y-5">
              <div className="glass-card rounded-3xl border border-border/70 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-primary" /><h2 className="text-lg font-semibold text-foreground">{selectedRegistry.name}</h2></div><p className="mt-2 font-mono text-[11px] text-muted-foreground" title={selectedRegistry.sha256}>SHA-256 {shortHash(selectedRegistry.sha256)}</p></div>
                  <div className="flex gap-2"><span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{selectedRegistry.strategy}</span><span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{selectedRegistry.pageCount} pages</span></div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <label className="block"><span className="mb-1.5 block text-xs font-medium text-foreground">Exam type</span><select value={examTypeId ?? ""} onChange={event => setExamTypeId(Number(event.target.value))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"><option value="" disabled>Select exam type</option>{data.examTypes.map(exam => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select></label>
                  <div><span className="mb-1.5 block text-xs font-medium text-foreground">Current status</span><div className={`flex min-h-[42px] items-center gap-2 rounded-xl border px-3 text-sm ${selectedInstallation?.mappingValidatedAt ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-700 dark:text-emerald-200" : selectedInstallation ? "border-amber-300/30 bg-amber-300/10 text-amber-700 dark:text-amber-200" : "border-border bg-muted/20 text-muted-foreground"}`}>{selectedInstallation?.mappingValidatedAt ? <CheckCircle2 size={15} /> : selectedInstallation ? <AlertTriangle size={15} /> : <XCircle size={15} />}{selectedInstallation?.mappingValidatedAt ? "Ready — exact PDF + validated mapping" : selectedInstallation ? "PDF installed — mapping still required" : "Not installed for this exam type"}</div></div>
                </div>

                {examTypeId != null && activeByExamType.get(examTypeId) && activeByExamType.get(examTypeId)?.sourceFamily !== selectedRegistry.sourceFamily && (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-xs text-amber-800 dark:text-amber-200"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><p>This exam type already uses <strong>{activeByExamType.get(examTypeId)?.sourceFamily}</strong>. PacketPath allows only one active official source assignment per exam type in this admin workflow.</p></div>
                )}

                {selectedInstallation ? (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/15 p-4">
                    <div><p className="text-sm font-medium text-foreground">{selectedInstallation.sourceFileName}</p><p className="mt-1 text-[11px] text-muted-foreground">Mapping: {formatDate(selectedInstallation.mappingValidatedAt)} · Updated: {formatDate(selectedInstallation.updatedAt)}</p></div>
                    <div className="flex gap-2"><button onClick={() => void inspect()} disabled={inspecting} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40 disabled:opacity-50">{inspecting ? <Loader2 size={13} className="animate-spin" /> : <FileSearch size={13} />} Inspect</button><button onClick={() => void removeSource()} disabled={deleting} className="flex items-center gap-2 rounded-xl border border-red-300/30 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-50">{deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Remove</button></div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-border p-5">
                    <div className="flex items-start gap-3"><FileUp size={19} className="mt-0.5 text-primary" /><div><p className="text-sm font-semibold text-foreground">Upload the exact registered PDF</p><p className="mt-1 text-xs leading-5 text-muted-foreground">A visually identical PDF with different bytes will be rejected. This protects field coordinates and signature/document integrity.</p></div></div>
                    <div className="mt-4 flex flex-wrap items-center gap-3"><input type="file" accept="application/pdf,.pdf" onChange={event => setFile(event.target.files?.[0] ?? null)} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary" /><button onClick={() => void upload()} disabled={!file || uploading} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40">{uploading ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} />} Verify & install</button></div>
                  </div>
                )}
              </div>

              {inspection && selectedInstallation ? (
                <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="space-y-5">
                    <div className="glass-card rounded-3xl border border-border/70 p-5">
                      <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Source questions</h3><p className="mt-1 text-xs text-muted-foreground">Only stable root source keys may be mapped.</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{inspection.sourceQuestions.length} keys</span></div>
                      <div className="mt-4 max-h-72 space-y-1.5 overflow-y-auto pr-1">{inspection.sourceQuestions.map(question => <button key={question.sourceKey} onClick={() => setHelperSourceKey(question.sourceKey)} className={`w-full rounded-xl border px-3 py-2.5 text-left ${helperSourceKey === question.sourceKey ? "border-primary/40 bg-primary/10" : "border-border/60 bg-background/30 hover:bg-muted/30"}`}><div className="flex items-start gap-2"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${mappedKeys.has(question.sourceKey) ? "bg-emerald-500" : "bg-muted-foreground/30"}`} /><div className="min-w-0"><p className="font-mono text-[10px] text-primary">{question.sourceKey}</p><p className="mt-0.5 text-xs leading-4 text-foreground">{question.text}</p><p className="mt-1 text-[10px] text-muted-foreground">{question.section} · {question.answerType}</p></div></div></button>)}</div>
                    </div>

                    {inspection.strategy === "acroform" && (
                      <div className="glass-card rounded-3xl border border-border/70 p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Detected PDF fields</h3><p className="mt-1 text-xs text-muted-foreground">Names and export options read directly from the installed PDF.</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{inspection.fields.length} fields</span></div><div className="mt-4 max-h-64 space-y-1 overflow-y-auto font-mono text-[10px]">{inspection.fields.length ? inspection.fields.map(field => <div key={field.name} className="rounded-lg border border-border/60 bg-background/30 px-3 py-2"><span className="text-foreground">{field.name}</span><span className="ml-2 text-muted-foreground">[{field.type}]</span>{field.options?.length ? <p className="mt-1 whitespace-normal text-muted-foreground">Options: {field.options.join(" · ")}</p> : null}</div>) : <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 font-sans text-xs text-amber-800 dark:text-amber-200">No AcroForm fields were detected.</p>}</div></div>
                    )}

                    {inspection.strategy === "overlay" && (
                      <div className="glass-card rounded-3xl border border-border/70 p-5"><h3 className="text-sm font-semibold text-foreground">PDF page geometry</h3><p className="mt-1 text-xs text-muted-foreground">Overlay coordinates use PDF points with page index starting at 0.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{inspection.pageSizes.map((page, index) => <div key={index} className="rounded-xl border border-border/60 bg-background/30 px-3 py-2 text-xs"><span className="font-semibold text-foreground">Page {index + 1}</span><span className="ml-2 text-muted-foreground">{Math.round(page.width)} × {Math.round(page.height)}</span></div>)}</div></div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="glass-card rounded-3xl border border-border/70 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Mapping helper</h3><p className="mt-1 text-xs text-muted-foreground">Build one descriptor at a time, then run authoritative server validation.</p></div><span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{inspection.strategy}</span></div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="sm:col-span-2"><span className="mb-1 block text-[11px] font-medium text-foreground">Source question</span><select value={helperSourceKey} onChange={event => setHelperSourceKey(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground">{inspection.sourceQuestions.map(question => <option key={question.sourceKey} value={question.sourceKey}>{question.sourceKey} — {question.text}</option>)}</select></label>
                        {inspection.strategy === "acroform" ? <>
                          <label><span className="mb-1 block text-[11px] font-medium text-foreground">Mapping type</span><select value={helperKind} onChange={event => setHelperKind(event.target.value as FieldDescriptor["kind"])} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"><option value="text">Text field</option><option value="checkbox">Checkbox</option><option value="checkbox_pair">Yes / No checkboxes</option><option value="radio">Radio group</option></select></label>
                          {helperKind === "checkbox_pair" ? <>
                            <FieldSelect label="Yes field" value={helperYesField} onChange={setHelperYesField} fields={fieldOptions} filter="checkbox" />
                            <FieldSelect label="No field" value={helperNoField} onChange={setHelperNoField} fields={fieldOptions} filter="checkbox" />
                            <FieldSelect label="Unsure field (optional)" value={helperUnsureField} onChange={setHelperUnsureField} fields={fieldOptions} filter="checkbox" allowBlank />
                          </> : <>
                            <FieldSelect label="PDF field" value={helperField} onChange={setHelperField} fields={fieldOptions} filter={helperKind === "radio" ? "radio" : helperKind === "checkbox" ? "checkbox" : undefined} />
                            {helperKind === "checkbox" && <label><span className="mb-1 block text-[11px] font-medium text-foreground">Checked when</span><input value={helperCheckedWhen} onChange={event => setHelperCheckedWhen(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground" placeholder="yes,true,1" /></label>}
                            {helperKind === "radio" && <><label><span className="mb-1 block text-[11px] font-medium text-foreground">Yes export value</span><select value={helperYesValue} onChange={event => setHelperYesValue(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"><option value="">Select</option>{helperRadioField?.options?.map(option => <option key={option} value={option}>{option}</option>)}</select></label><label><span className="mb-1 block text-[11px] font-medium text-foreground">No export value</span><select value={helperNoValue} onChange={event => setHelperNoValue(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"><option value="">Select</option>{helperRadioField?.options?.map(option => <option key={option} value={option}>{option}</option>)}</select></label><label><span className="mb-1 block text-[11px] font-medium text-foreground">Unsure export (optional)</span><select value={helperUnsureValue} onChange={event => setHelperUnsureValue(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"><option value="">None</option>{helperRadioField?.options?.map(option => <option key={option} value={option}>{option}</option>)}</select></label></>}
                          </>}
                        </> : <>
                          <NumberField label="Page index" value={helperPage} onChange={setHelperPage} min={0} max={Math.max(0, inspection.pageSizes.length - 1)} />
                          <NumberField label="X" value={helperX} onChange={setHelperX} />
                          <NumberField label="Y" value={helperY} onChange={setHelperY} />
                          <NumberField label="Width" value={helperWidth} onChange={setHelperWidth} min={1} />
                          <NumberField label="Height" value={helperHeight} onChange={setHelperHeight} min={1} />
                          <NumberField label="Font size" value={helperFontSize} onChange={setHelperFontSize} min={1} />
                          <label><span className="mb-1 block text-[11px] font-medium text-foreground">Alignment</span><select value={helperAlign} onChange={event => setHelperAlign(event.target.value as "left" | "center" | "right")} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
                        </>}
                      </div>
                      <button onClick={addHelperMapping} disabled={!helperSourceKey} className="mt-4 w-full rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/15 disabled:opacity-40">Add / replace this mapping</button>
                    </div>

                    <div className="glass-card rounded-3xl border border-border/70 p-5">
                      <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Validated mapping JSON</h3><p className="mt-1 text-xs text-muted-foreground">{mappedKeys.size} source keys currently mapped.</p></div>{inspection.mappingValidatedAt ? <span className="flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-200"><CheckCircle2 size={11} /> Validated</span> : <span className="flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-200"><AlertTriangle size={11} /> Draft</span>}</div>
                      <textarea value={mappingText} onChange={event => setMappingText(event.target.value)} spellCheck={false} className="mt-4 min-h-[360px] w-full resize-y rounded-2xl border border-border bg-background/80 p-4 font-mono text-[11px] leading-5 text-foreground outline-none focus:border-primary/60" placeholder={mappingExample(inspection.strategy)} />
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-muted-foreground">Saving runs fingerprint, source-key, PDF-field, option, and coordinate validation on the server.</p><button onClick={() => void saveMapping()} disabled={savingMapping} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">{savingMapping ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Validate & save mapping</button></div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FieldSelect({ label, value, onChange, fields, filter, allowBlank = false }: { label: string; value: string; onChange: (value: string) => void; fields: PdfField[]; filter?: string; allowBlank?: boolean }) {
  const options = filter ? fields.filter(field => field.type === filter) : fields;
  return <label><span className="mb-1 block text-[11px] font-medium text-foreground">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"><option value="">{allowBlank ? "None" : "Select field"}</option>{options.map(field => <option key={field.name} value={field.name}>{field.name}</option>)}</select></label>;
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return <label><span className="mb-1 block text-[11px] font-medium text-foreground">{label}</span><input type="number" value={value} min={min} max={max} step="any" onChange={event => onChange(Number(event.target.value))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground" /></label>;
}
