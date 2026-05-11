import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useListExamTypes, useCreateCase, getListCasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, FileText, Stethoscope, Heart, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const examTypeIcons: Record<string, React.ElementType> = {
  deployment: Stethoscope,
  traditional: Heart,
  dental: FileText,
  labs: FlaskConical,
};

const examTypeGradients: Record<string, string> = {
  deployment: "linear-gradient(135deg, #3b82f6, #4f46e5)",
  traditional: "linear-gradient(135deg, #10b981, #0d9488)",
  dental: "linear-gradient(135deg, #f59e0b, #d97706)",
  labs: "linear-gradient(135deg, #8b5cf6, #a855f7)",
};

export default function NewCasePage() {
  const [, setLocation] = useLocation();
  const [patientName, setPatientName] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [selectedExamTypeId, setSelectedExamTypeId] = useState<number | null>(null);
  const { data: examTypes, isLoading } = useListExamTypes();
  const createCase = useCreateCase();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamTypeId) {
      toast({ title: "Select an exam type", variant: "destructive" });
      return;
    }
    if (!patientName.trim()) {
      toast({ title: "Enter patient name", variant: "destructive" });
      return;
    }
    createCase.mutate(
      { data: { patientName: patientName.trim(), patientDob: patientDob || null, examTypeId: selectedExamTypeId } },
      {
        onSuccess: (newCase) => {
          queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
          toast({ title: "Case created", description: `Starting interview for ${newCase.patientName}` });
          setLocation(`/cases/${newCase.id}`);
        },
        onError: () => {
          toast({ title: "Failed to create case", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <button
          data-testid="btn-back"
          onClick={() => setLocation("/cases")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to Cases
        </button>

        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">New Case</h1>
        <p className="text-muted-foreground text-sm mb-8">Enter patient information and select the exam type</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Patient info */}
          <div className="liquid-glass rounded-3xl p-6 relative glass-highlight">
            <h2 className="font-semibold text-foreground text-sm mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Patient Name <span className="text-destructive">*</span>
                </label>
                <input
                  data-testid="input-patient-name"
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  required
                  placeholder="Full legal name"
                  className="w-full px-4 py-2.5 rounded-2xl border border-white/40 bg-white/50 text-sm outline-none focus:border-primary/50 transition-all backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Date of Birth
                </label>
                <input
                  data-testid="input-patient-dob"
                  type="date"
                  value={patientDob}
                  onChange={e => setPatientDob(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-white/40 bg-white/50 text-sm outline-none focus:border-primary/50 transition-all text-foreground backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {/* Exam type */}
          <div className="liquid-glass rounded-3xl p-6 relative glass-highlight">
            <h2 className="font-semibold text-foreground text-sm mb-1">Exam Type <span className="text-destructive">*</span></h2>
            <p className="text-muted-foreground text-xs mb-4">Select the type of examination to determine which questions apply</p>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(examTypes ?? []).map((et) => {
                  const Icon = examTypeIcons[et.slug] ?? FileText;
                  const gradient = examTypeGradients[et.slug] ?? "linear-gradient(135deg, #3b82f6, #4f46e5)";
                  const selected = selectedExamTypeId === et.id;
                  return (
                    <motion.button
                      key={et.id}
                      data-testid={`exam-type-card-${et.slug}`}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedExamTypeId(et.id)}
                      className={cn(
                        "p-4 rounded-2xl text-left transition-all",
                        selected
                          ? "shadow-md"
                          : "hover:shadow-sm"
                      )}
                      style={{
                        background: selected ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.40)",
                        border: selected ? "2px solid hsl(210, 100%, 52%)" : "2px solid rgba(255,255,255,0.50)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{
                        background: gradient,
                        boxShadow: "0 3px 10px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.25)",
                      }}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">{et.name}</p>
                      <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{et.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            data-testid="button-create-case"
            type="submit"
            disabled={createCase.isPending || !patientName.trim() || !selectedExamTypeId}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(210, 100%, 52%), hsl(250, 80%, 60%))",
              boxShadow: "0 4px 20px rgba(56, 140, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {createCase.isPending ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>Begin Interview <ArrowRight size={15} /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
