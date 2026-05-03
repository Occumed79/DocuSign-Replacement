import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Eye, RefreshCw, Filter, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: number;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  phiAccessed: boolean;
  patientName: string | null;
  createdAt: string;
}

const actionConfig: Record<string, { color: string; bg: string }> = {
  view: { color: "text-blue-600", bg: "bg-blue-50" },
  create: { color: "text-emerald-600", bg: "bg-emerald-50" },
  update: { color: "text-amber-600", bg: "bg-amber-50" },
  delete: { color: "text-red-600", bg: "bg-red-50" },
  export: { color: "text-violet-600", bg: "bg-violet-50" },
  login: { color: "text-slate-600", bg: "bg-slate-100" },
  logout: { color: "text-slate-600", bg: "bg-slate-100" },
};

const resourceLabels: Record<string, string> = {
  cases: "Patient Cases",
  case_answers: "Case Answers",
  case_review: "Case Review",
  dashboard: "Dashboard",
  auth: "Authentication",
};

function parseUserAgent(ua: string | null): string {
  if (!ua) return "—";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("curl")) return "curl";
  return "Browser";
}

export default function AuditLogPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [phiOnly, setPhiOnly] = useState(false);
  const [resource, setResource] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (phiOnly) params.set("phi_only", "true");
    if (resource) params.set("resource", resource);
    const res = await fetch(`/api/audit-logs?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    }
    setLoading(false);
  }, [token, phiOnly, resource, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Audit Log</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                HIPAA-compliant record of all PHI access and system actions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{total} records</span>
            <button
              onClick={fetchLogs}
              className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* PHI notice */}
        <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3 border border-amber-200 bg-amber-50/40">
          <Shield size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Protected Health Information (PHI) Access Log</p>
            <p className="text-xs text-amber-700 mt-0.5">
              All access to patient data is logged in compliance with HIPAA's Audit Controls standard (§164.312(b)).
              Logs are retained and tamper-evident. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={resource}
            onChange={e => { setResource(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary text-foreground"
          >
            <option value="">All Resources</option>
            <option value="cases">Patient Cases</option>
            <option value="case_answers">Case Answers</option>
            <option value="case_review">Case Review</option>
            <option value="dashboard">Dashboard</option>
            <option value="auth">Authentication</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
            <input
              type="checkbox"
              checked={phiOnly}
              onChange={e => { setPhiOnly(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded accent-primary"
            />
            <Eye size={13} className="text-primary" />
            PHI Access Only
          </label>
        </div>

        {/* Log table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="px-6 py-3 border-b border-border bg-muted/30 grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2">Time</div>
            <div className="col-span-2">User</div>
            <div className="col-span-1">Action</div>
            <div className="col-span-2">Resource</div>
            <div className="col-span-2">Details</div>
            <div className="col-span-1">PHI</div>
            <div className="col-span-1">IP</div>
            <div className="col-span-1">Agent</div>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="px-6 py-3 grid grid-cols-12 gap-4 animate-pulse">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <div key={j} className={cn("h-3 bg-muted rounded", j === 1 ? "col-span-2" : "col-span-1")} />
                  ))}
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <ClipboardList size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">No audit logs found</p>
                <p className="text-muted-foreground text-xs mt-1">Logs appear as users interact with the system</p>
              </div>
            ) : (
              logs.map((entry, i) => {
                const actionCfg = actionConfig[entry.action] ?? actionConfig.view;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      "px-6 py-3 grid grid-cols-12 gap-4 items-center text-xs hover:bg-muted/20 transition-colors",
                      entry.phiAccessed && "bg-blue-50/20"
                    )}
                    data-testid={`audit-row-${entry.id}`}
                  >
                    <div className="col-span-2 text-muted-foreground whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                    <div className="col-span-2 truncate">
                      <p className="font-medium text-foreground truncate">{entry.userName ?? "—"}</p>
                      <p className="text-muted-foreground truncate">{entry.userEmail ?? "System"}</p>
                    </div>
                    <div className="col-span-1">
                      <span className={cn("px-1.5 py-0.5 rounded-md capitalize font-medium", actionCfg.bg, actionCfg.color)}>
                        {entry.action}
                      </span>
                    </div>
                    <div className="col-span-2 truncate text-foreground">
                      {resourceLabels[entry.resource] ?? entry.resource}
                      {entry.resourceId && <span className="text-muted-foreground"> #{entry.resourceId}</span>}
                    </div>
                    <div className="col-span-2 text-muted-foreground truncate">{entry.details ?? "—"}</div>
                    <div className="col-span-1">
                      {entry.phiAccessed ? (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <Eye size={11} /> Yes
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="col-span-1 text-muted-foreground truncate font-mono text-xs">{entry.ipAddress ?? "—"}</div>
                    <div className="col-span-1 text-muted-foreground">{parseUserAgent(entry.userAgent)}</div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {total > 50 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 50)}</span>
            <button
              disabled={page * 50 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
