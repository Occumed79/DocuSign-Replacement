import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
  AlignLeft, AlignJustify, ToggleLeft, CheckSquare,
  Calendar, List, Hash, SeparatorHorizontal, Info,
  GitBranch, Settings2, X, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormField {
  id: string;
  type: "text" | "textarea" | "yes_no" | "checkbox" | "date" | "select" | "number" | "section_header" | "instructions";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select
  helpText?: string;
  showWhen?: {
    fieldId: string;
    value: string;
  };
}

const FIELD_TYPES: { type: FormField["type"]; label: string; icon: React.ElementType; description: string }[] = [
  { type: "yes_no", label: "Yes / No", icon: ToggleLeft, description: "Binary yes/no question — great for triggering follow-ups" },
  { type: "text", label: "Short Text", icon: AlignLeft, description: "Single-line text answer" },
  { type: "textarea", label: "Long Text", icon: AlignJustify, description: "Multi-line paragraph answer" },
  { type: "date", label: "Date", icon: Calendar, description: "Date picker" },
  { type: "number", label: "Number", icon: Hash, description: "Numeric value" },
  { type: "select", label: "Dropdown", icon: List, description: "Choose from a list of options" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, description: "Single checkbox to confirm a statement" },
  { type: "section_header", label: "Section Header", icon: SeparatorHorizontal, description: "Visual divider / group heading" },
  { type: "instructions", label: "Instructions", icon: Info, description: "Read-only text shown to the signer" },
];

function fieldTypeIcon(type: FormField["type"]): React.ElementType {
  return FIELD_TYPES.find(f => f.type === type)?.icon ?? AlignLeft;
}

function fieldTypeLabel(type: FormField["type"]): string {
  return FIELD_TYPES.find(f => f.type === type)?.label ?? type;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function defaultField(type: FormField["type"]): FormField {
  const base: FormField = { id: generateId(), type, label: "", required: false };
  if (type === "select") base.options = ["Option 1", "Option 2"];
  if (type === "section_header") { base.label = "Section Title"; base.required = false; }
  if (type === "instructions") { base.label = "Instructions text here"; base.required = false; }
  return base;
}

// Which field types can trigger conditional logic
function canTriggerCondition(type: FormField["type"]): boolean {
  return ["yes_no", "select", "checkbox"].includes(type);
}

// Get possible trigger values for a field
function triggerValues(field: FormField): string[] {
  if (field.type === "yes_no") return ["yes", "no"];
  if (field.type === "checkbox") return ["true", "false"];
  if (field.type === "select") return field.options ?? [];
  return [];
}

interface FieldEditorProps {
  field: FormField;
  allFields: FormField[];
  onChange: (updated: FormField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function FieldEditor({ field, allFields, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: FieldEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const TypeIcon = fieldTypeIcon(field.type);

  const conditionSource = allFields.find(f => f.id === field.showWhen?.fieldId);
  const hasCondition = !!field.showWhen?.fieldId;

  const isStructural = field.type === "section_header" || field.type === "instructions";

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      hasCondition
        ? "border-violet-200 bg-violet-50/50"
        : "border-border bg-background/60"
    )}>
      {/* Field header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="text-muted-foreground cursor-grab shrink-0">
          <GripVertical size={14} />
        </div>

        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
          isStructural ? "bg-slate-100 text-slate-500" : "bg-indigo-100 text-indigo-600"
        )}>
          <TypeIcon size={13} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {field.label || <span className="text-muted-foreground italic">Untitled field</span>}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{fieldTypeLabel(field.type)}</span>
            {field.required && <span className="text-xs text-red-500 font-medium">Required</span>}
            {hasCondition && (
              <span className="flex items-center gap-0.5 text-xs text-violet-600 font-medium">
                <GitBranch size={10} /> Conditional
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onMoveUp} disabled={isFirst} className="p-1 rounded hover:bg-muted/60 text-muted-foreground disabled:opacity-30">
            <ChevronUp size={13} />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1 rounded hover:bg-muted/60 text-muted-foreground disabled:opacity-30">
            <ChevronDown size={13} />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1 rounded hover:bg-muted/60 text-muted-foreground">
            <Settings2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-border/60 space-y-3">

              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {isStructural ? "Text" : "Question / Label"} *
                </label>
                <input
                  value={field.label}
                  onChange={e => onChange({ ...field, label: e.target.value })}
                  placeholder={field.type === "section_header" ? "Section title..." : field.type === "instructions" ? "Instructions text..." : "e.g. Do you have a history of gout?"}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-indigo-400"
                />
              </div>

              {!isStructural && (
                <>
                  {/* Placeholder */}
                  {["text", "textarea", "number"].includes(field.type) && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Placeholder text</label>
                      <input
                        value={field.placeholder ?? ""}
                        onChange={e => onChange({ ...field, placeholder: e.target.value })}
                        placeholder="e.g. Enter date of last episode..."
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-indigo-400"
                      />
                    </div>
                  )}

                  {/* Select options */}
                  {field.type === "select" && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Options (one per line)</label>
                      <textarea
                        value={(field.options ?? []).join("\n")}
                        onChange={e => onChange({ ...field, options: e.target.value.split("\n").filter(Boolean) })}
                        rows={4}
                        placeholder={"Option A\nOption B\nOption C"}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-indigo-400 resize-none font-mono"
                      />
                    </div>
                  )}

                  {/* Help text */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Help text (shown under the question)</label>
                    <input
                      value={field.helpText ?? ""}
                      onChange={e => onChange({ ...field, helpText: e.target.value || undefined })}
                      placeholder="Optional additional context..."
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-indigo-400"
                    />
                  </div>

                  {/* Required toggle */}
                  {field.type !== "checkbox" && (
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <div
                        onClick={() => onChange({ ...field, required: !field.required })}
                        className={cn(
                          "w-9 h-5 rounded-full transition-colors relative",
                          field.required ? "bg-indigo-500" : "bg-muted-foreground/30"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                          field.required ? "translate-x-4" : "translate-x-0.5"
                        )} />
                      </div>
                      <span className="text-sm text-foreground">Required field</span>
                    </label>
                  )}

                  {/* Conditional logic */}
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <GitBranch size={12} className="text-violet-500" />
                      <label className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Conditional Logic</label>
                    </div>

                    {/* Source field picker */}
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="text-xs text-muted-foreground shrink-0">Show this field when</span>
                      <select
                        value={field.showWhen?.fieldId ?? ""}
                        onChange={e => {
                          if (!e.target.value) {
                            const { showWhen: _, ...rest } = field;
                            onChange(rest);
                          } else {
                            onChange({ ...field, showWhen: { fieldId: e.target.value, value: "" } });
                          }
                        }}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none focus:border-violet-400 min-w-0"
                      >
                        <option value="">— no condition (always show) —</option>
                        {allFields.filter(f => f.id !== field.id && canTriggerCondition(f.type)).map(f => (
                          <option key={f.id} value={f.id}>{f.label || `(${fieldTypeLabel(f.type)})`}</option>
                        ))}
                      </select>

                      {field.showWhen?.fieldId && conditionSource && (
                        <>
                          <span className="text-xs text-muted-foreground shrink-0">equals</span>
                          <select
                            value={field.showWhen.value}
                            onChange={e => onChange({ ...field, showWhen: { ...field.showWhen!, value: e.target.value } })}
                            className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none focus:border-violet-400 min-w-0"
                          >
                            <option value="">— select value —</option>
                            {triggerValues(conditionSource).map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>

                    {hasCondition && conditionSource && field.showWhen?.value && (
                      <p className="text-xs text-violet-600 mt-1.5 flex items-center gap-1">
                        <GitBranch size={10} />
                        This field appears only when "{conditionSource.label || fieldTypeLabel(conditionSource.type)}" = "{field.showWhen.value}"
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AddFieldMenuProps {
  onAdd: (type: FormField["type"]) => void;
  onClose: () => void;
}

function AddFieldMenu({ onAdd, onClose }: AddFieldMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className="absolute left-0 top-10 z-30 bg-background border border-border rounded-xl shadow-xl p-2 w-72"
    >
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Field</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted/60 text-muted-foreground"><X size={12} /></button>
      </div>
      {FIELD_TYPES.map(ft => {
        const Icon = ft.icon;
        return (
          <button
            key={ft.type}
            onClick={() => { onAdd(ft.type); onClose(); }}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Icon size={13} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{ft.label}</p>
              <p className="text-xs text-muted-foreground">{ft.description}</p>
            </div>
          </button>
        );
      })}
    </motion.div>
  );
}

// Preview of what the signer will see
function FormPreview({ fields }: { fields: FormField[] }) {
  const [values, setValues] = useState<Record<string, string>>({});

  function isVisible(field: FormField): boolean {
    if (!field.showWhen?.fieldId || !field.showWhen.value) return true;
    return values[field.showWhen.fieldId] === field.showWhen.value;
  }

  return (
    <div className="space-y-4">
      {fields.filter(isVisible).map(field => {
        if (field.type === "section_header") {
          return (
            <div key={field.id} className="pt-2">
              <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">{field.label}</h3>
            </div>
          );
        }
        if (field.type === "instructions") {
          return (
            <div key={field.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
              {field.label}
            </div>
          );
        }

        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {field.label || <span className="text-muted-foreground italic">Untitled</span>}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.helpText && <p className="text-xs text-muted-foreground mb-2">{field.helpText}</p>}

            {field.type === "text" && (
              <input value={values[field.id] ?? ""} onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                placeholder={field.placeholder} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-indigo-400" />
            )}
            {field.type === "textarea" && (
              <textarea value={values[field.id] ?? ""} onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                placeholder={field.placeholder} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-indigo-400 resize-none" />
            )}
            {field.type === "number" && (
              <input type="number" value={values[field.id] ?? ""} onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                placeholder={field.placeholder} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-indigo-400" />
            )}
            {field.type === "date" && (
              <input type="date" value={values[field.id] ?? ""} onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-indigo-400" />
            )}
            {field.type === "yes_no" && (
              <div className="flex gap-3">
                {["yes", "no"].map(opt => (
                  <button key={opt} onClick={() => setValues(v => ({ ...v, [field.id]: opt }))}
                    className={cn("flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all",
                      values[field.id] === opt
                        ? opt === "yes" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-700"
                        : "border-border text-muted-foreground hover:border-indigo-300"
                    )}>
                    {opt === "yes" ? "✓ Yes" : "✗ No"}
                  </button>
                ))}
              </div>
            )}
            {field.type === "select" && (
              <select value={values[field.id] ?? ""} onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-indigo-400">
                <option value="">Select an option...</option>
                {(field.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}
            {field.type === "checkbox" && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={values[field.id] === "true"} onChange={e => setValues(v => ({ ...v, [field.id]: e.target.checked ? "true" : "false" }))}
                  className="w-4 h-4 mt-0.5 rounded accent-indigo-600" />
                <span className="text-sm text-foreground">{field.label}</span>
              </label>
            )}
          </div>
        );
      })}
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No fields added yet — add fields above to see the preview.</p>
      )}
    </div>
  );
}

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export default function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  function addField(type: FormField["type"]) {
    onChange([...fields, defaultField(type)]);
  }

  function updateField(index: number, updated: FormField) {
    const next = [...fields];
    next[index] = updated;
    onChange(next);
  }

  function deleteField(index: number) {
    const deleted = fields[index];
    // Remove any showWhen references to this field
    onChange(fields.filter((_, i) => i !== index).map(f =>
      f.showWhen?.fieldId === deleted.id ? { ...f, showWhen: undefined } : f
    ));
  }

  function moveField(index: number, direction: "up" | "down") {
    const next = [...fields];
    const target = direction === "up" ? index - 1 : index + 1;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {fields.length === 0 ? "No fields — add your first field below" : `${fields.length} field${fields.length !== 1 ? "s" : ""}`}
          </p>
          {fields.some(f => f.showWhen?.fieldId) && (
            <span className="flex items-center gap-1 text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              <GitBranch size={10} /> {fields.filter(f => f.showWhen?.fieldId).length} conditional
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(p => !p)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              previewMode
                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                : "text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            {previewMode ? <EyeOff size={12} /> : <Eye size={12} />}
            {previewMode ? "Edit" : "Preview"}
          </button>

          {!previewMode && (
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(m => !m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              >
                <Plus size={12} /> Add Field
              </button>
              <AnimatePresence>
                {showAddMenu && (
                  <AddFieldMenu onAdd={addField} onClose={() => setShowAddMenu(false)} />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {previewMode ? (
        <div className="border border-border rounded-xl p-5 bg-white/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Signer View (interactive preview)</p>
          <FormPreview fields={fields} />
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, i) => (
            <FieldEditor
              key={field.id}
              field={field}
              allFields={fields}
              onChange={updated => updateField(i, updated)}
              onDelete={() => deleteField(i)}
              onMoveUp={() => moveField(i, "up")}
              onMoveDown={() => moveField(i, "down")}
              isFirst={i === 0}
              isLast={i === fields.length - 1}
            />
          ))}
          {fields.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Plus size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Click "Add Field" to start building your form</p>
              <p className="text-xs text-muted-foreground mt-1">Use Yes/No fields with conditional logic to trigger follow-up questions automatically</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
