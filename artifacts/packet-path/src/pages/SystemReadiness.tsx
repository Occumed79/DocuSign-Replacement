import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ServerCog, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReadinessCheck {
  configured: boolean;
  required: boolean;
  description: string;
}

interface ReadinessPayload {
  requiredReady: boolean;
  dataSensitivityMode: string;
  runDbPushOnStartup: boolean;
  environment: string;
  checks: Record<string, ReadinessCheck>;
}

function labelFor(key: string): string {
  const labels: Record<string, string> = {
    database: "Database",
    smtp: "Email delivery (SMTP)",
    sentry: "Sentry telemetry",
    artifactStorage: "Final PDF storage",
    appBaseUrl: "Public application URL",
    allowedOrigins: "CORS origin boundary",
    encryption: "Encryption keys",
  };
  return labels[key] ?? key;
}

export default function SystemReadinessPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ReadinessPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/system/readiness", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to load readiness status");
      setData(payload);
    } catch (err: any) {
      toast({ title: err?.message || "Unable to load readiness status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Production Readiness</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configuration status only. Secret values are never shown.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh</button>
      </div>

      {loading && !data ? (
        <div className="glass-card flex min-h-52 items-center justify-center rounded-3xl text-sm text-muted-foreground"><Loader2 size={17} className="mr-2 animate-spin" /> Checking configuration...</div>
      ) : data ? (
        <>
          <div className={`mb-6 rounded-3xl border p-6 ${data.requiredReady ? "border-emerald-300/30 bg-emerald-300/10" : "border-amber-300/30 bg-amber-300/10"}`}>
            <div className="flex items-start gap-3">
              {data.requiredReady ? <CheckCircle2 size={24} className="mt-0.5 text-emerald-600" /> : <AlertTriangle size={24} className="mt-0.5 text-amber-600" />}
              <div><h2 className="text-lg font-semibold text-foreground">{data.requiredReady ? "Required configuration is present" : "Required production configuration is incomplete"}</h2><p className="mt-1 text-sm text-muted-foreground">Environment: {data.environment} · Data sensitivity: {data.dataSensitivityMode}</p></div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(data.checks).map(([key, check]) => (
              <div key={key} className="glass-card rounded-2xl border border-border/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-semibold text-foreground">{labelFor(key)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{check.description}</p></div>
                  <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${check.configured ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-700 dark:text-emerald-200" : check.required ? "border-red-300/30 bg-red-300/10 text-red-700 dark:text-red-200" : "border-amber-300/30 bg-amber-300/10 text-amber-700 dark:text-amber-200"}`}>
                    {check.configured ? <CheckCircle2 size={11} /> : <XCircle size={11} />}{check.configured ? "Configured" : check.required ? "Required" : "Optional"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 glass-card rounded-2xl border border-border/70 p-5">
            <div className="flex items-center gap-2"><ServerCog size={16} className="text-primary" /><h2 className="text-sm font-semibold text-foreground">Database startup policy</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">Automatic schema push on startup is <strong className="text-foreground">{data.runDbPushOnStartup ? "enabled" : "disabled"}</strong>. Controlled migrations are preferable for a formal production release.</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
