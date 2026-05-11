import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield, AlertTriangle, Eye, Users, Activity, Lock, Clock,
  CheckCircle, XCircle, LogOut, RefreshCw, Trash2, Monitor,
  Globe, TrendingUp, ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SecurityStats {
  totalPhiAccess: number;
  phiAccessToday: number;
  failedLoginsToday: number;
  activeSessions: number;
  recentEvents: SecurityEvent[];
  topPhiUsers: { email: string; name: string; count: number }[];
}

interface SecurityEvent {
  id: number;
  eventType: string;
  email: string | null;
  ipAddress: string | null;
  details: string | null;
  severity: string;
  createdAt: string;
}

interface Session {
  id: number;
  ipAddress: string | null;
  userAgent: string | null;
  lastActivityAt: string;
  expiresAt: string;
  createdAt: string;
  isCurrent: boolean;
}

const severityConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  info: { color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle },
  warn: { color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
  error: { color: "text-red-600", bg: "bg-red-50", icon: XCircle },
};

const eventTypeLabels: Record<string, string> = {
  login_success: "Login Success",
  login_failed: "Login Failed",
  login_locked: "Account Locked",
  logout: "Logout",
  session_expired: "Session Expired",
  unauthorized_access: "Unauthorized Access",
  phi_export: "PHI Export",
  case_submitted: "Case Submitted",
  admin_action: "Admin Action",
  session_revoked: "Session Revoked",
};

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Chrome")) return "Chrome Browser";
  if (ua.includes("Firefox")) return "Firefox Browser";
  if (ua.includes("Safari")) return "Safari Browser";
  if (ua.includes("Edge")) return "Edge Browser";
  if (ua.includes("curl")) return "API Client";
  return "Browser";
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SecurityPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "events" | "mfa">("overview");

  // MFA state
  const [mfaStatus, setMfaStatus] = useState<{ enabled: boolean; verifiedAt: string | null } | null>(null);
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; uri: string; backupCodes: string[] } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const fetchMfaStatus = useCallback(async () => {
    const res = await fetch("/api/mfa/status", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setMfaStatus(await res.json());
  }, [token]);

  const startMfaSetup = async () => {
    setMfaLoading(true);
    const res = await fetch("/api/mfa/setup", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setMfaSetup(data);
      setShowBackupCodes(true);
    } else {
      toast({ title: "Failed to start MFA setup", variant: "destructive" });
    }
    setMfaLoading(false);
  };

  const enableMfa = async () => {
    if (!mfaCode || mfaCode.length !== 6) { toast({ title: "Enter a 6-digit code", variant: "destructive" }); return; }
    setMfaLoading(true);
    const res = await fetch("/api/mfa/enable", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code: mfaCode }),
    });
    if (res.ok) {
      toast({ title: "MFA enabled successfully" });
      setMfaSetup(null);
      setMfaCode("");
      fetchMfaStatus();
    } else {
      const err = await res.json();
      toast({ title: err.error ?? "Invalid code", variant: "destructive" });
    }
    setMfaLoading(false);
  };

  const disableMfa = async () => {
    const code = prompt("Enter your current TOTP code to disable MFA:");
    if (!code) return;
    const res = await fetch("/api/mfa/disable", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      toast({ title: "MFA disabled" });
      fetchMfaStatus();
    } else {
      toast({ title: "Invalid code", variant: "destructive" });
    }
  };

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/security/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setStats(await res.json());
  }, [token]);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/security/sessions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSessions(await res.json());
  }, [token]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchSessions(), fetchMfaStatus()]).finally(() => setLoading(false));
  }, [fetchStats, fetchSessions, fetchMfaStatus]);

  const revokeSession = async (id: number) => {
    setRevoking(id);
    const res = await fetch(`/api/security/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast({ title: "Session revoked" });
      fetchSessions();
    } else {
      toast({ title: "Failed to revoke session", variant: "destructive" });
    }
    setRevoking(null);
  };

  const revokeAll = async () => {
    if (!confirm("Revoke all other active sessions? You will need to log in again on other devices.")) return;
    const res = await fetch("/api/auth/sessions/revoke-all", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast({ title: "All sessions revoked" });
      fetchSessions();
    }
  };

  const statCards = [
    {
      label: "PHI Accesses Today",
      value: stats?.phiAccessToday ?? 0,
      sub: `${stats?.totalPhiAccess ?? 0} total`,
      icon: Eye,
      gradient: "from-blue-500 to-indigo-600",
      alert: false,
    },
    {
      label: "Failed Logins Today",
      value: stats?.failedLoginsToday ?? 0,
      sub: "Last 24 hours",
      icon: AlertTriangle,
      gradient: stats?.failedLoginsToday && stats.failedLoginsToday > 3 ? "from-red-500 to-rose-600" : "from-amber-500 to-orange-500",
      alert: (stats?.failedLoginsToday ?? 0) > 3,
    },
    {
      label: "Active Sessions",
      value: stats?.activeSessions ?? 0,
      sub: "Across all users",
      icon: Monitor,
      gradient: "from-emerald-500 to-teal-600",
      alert: false,
    },
    {
      label: "HIPAA Status",
      value: "Active",
      sub: "Audit logging enabled",
      icon: Shield,
      gradient: "from-violet-500 to-purple-600",
      alert: false,
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Security & PHI Compliance</h1>
              <p className="text-muted-foreground text-sm mt-0.5">HIPAA audit trail · Session management · Threat monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Audit Logging Active
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass-card rounded-xl mb-6 w-fit">
          {(["overview", "sessions", "events", "mfa"] as const).map(tab => (
            <button
              key={tab}
              data-testid={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn("glass-card rounded-2xl p-5", s.alert && "border border-red-200 bg-red-50/30")}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{s.label}</p>
                      <p className="text-foreground text-2xl font-semibold mt-1.5 tracking-tight">{s.value}</p>
                      {s.sub && <p className="text-muted-foreground text-xs mt-1">{s.sub}</p>}
                    </div>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", s.gradient)}>
                      <s.icon size={18} className="text-white" />
                    </div>
                  </div>
                  {s.alert && (
                    <div className="mt-3 flex items-center gap-1.5 text-red-600 text-xs">
                      <AlertTriangle size={12} /> Elevated activity detected
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent security events */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Activity size={15} className="text-primary" /> Recent Security Events
                  </h2>
                  <button
                    onClick={() => setActiveTab("events")}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight size={11} />
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="px-6 py-3 flex items-center gap-3 animate-pulse">
                        <div className="w-7 h-7 bg-muted rounded-lg" />
                        <div className="flex-1"><div className="h-3 w-32 bg-muted rounded mb-1.5" /><div className="h-2.5 w-20 bg-muted rounded" /></div>
                      </div>
                    ))
                  ) : stats?.recentEvents?.length === 0 ? (
                    <div className="px-6 py-8 text-center text-muted-foreground text-sm">No events yet</div>
                  ) : (
                    stats?.recentEvents?.slice(0, 8).map(event => {
                      const cfg = severityConfig[event.severity] ?? severityConfig.info;
                      const Icon = cfg.icon;
                      return (
                        <div key={event.id} className="px-6 py-3 flex items-start gap-3">
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                            <Icon size={13} className={cfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {eventTypeLabels[event.eventType] ?? event.eventType}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {event.email ?? "Unknown"} · {event.ipAddress ?? "unknown IP"}
                            </p>
                            {event.details && <p className="text-xs text-muted-foreground/70 truncate">{event.details}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{timeSince(event.createdAt)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Top PHI users */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Eye size={15} className="text-primary" /> PHI Access — Top Users (7 days)
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-3 w-32 bg-muted rounded mb-2" />
                        <div className="h-2 w-full bg-muted rounded" />
                      </div>
                    ))
                  ) : stats?.topPhiUsers?.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">No PHI access recorded yet</p>
                  ) : (
                    stats?.topPhiUsers?.map((u, i) => {
                      const maxCount = stats.topPhiUsers[0]?.count ?? 1;
                      const pct = Math.round((u.count / maxCount) * 100);
                      return (
                        <div key={u.email}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <div>
                              <span className="text-foreground font-medium">{u.name}</span>
                              <span className="text-muted-foreground ml-1.5">{u.email}</span>
                            </div>
                            <span className="text-muted-foreground font-medium">{u.count}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, delay: i * 0.1 }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* HIPAA compliance checklist */}
                <div className="px-6 pb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-2">HIPAA Compliance</h3>
                  {[
                    { label: "PHI Access Logging", status: true },
                    { label: "Audit Trail Enabled", status: true },
                    { label: "Session Timeout (8h)", status: true },
                    { label: "Failed Login Lockout", status: true },
                    { label: "Role-Based Access Control", status: true },
                    { label: "Encrypted Data Transport (HTTPS)", status: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <CheckCircle size={13} /> Active
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{sessions.length} active session{sessions.length !== 1 ? "s" : ""}</p>
              {sessions.filter(s => !s.isCurrent).length > 0 && (
                <button
                  onClick={revokeAll}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={13} /> Revoke all other sessions
                </button>
              )}
            </div>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                  <div className="h-4 w-40 bg-muted rounded mb-2" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              ))
            ) : sessions.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Monitor size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">No active sessions</p>
              </div>
            ) : (
              sessions.map(session => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "glass-card rounded-2xl p-5 flex items-start justify-between gap-4",
                    session.isCurrent && "border border-primary/30 bg-primary/3"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      session.isCurrent ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Monitor size={17} className={session.isCurrent ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-sm">
                          {parseUserAgent(session.userAgent)}
                        </p>
                        {session.isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Current</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Globe size={11} /> {session.ipAddress ?? "Unknown IP"}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> Active {timeSince(session.lastActivityAt)}</span>
                        <span className="flex items-center gap-1"><CheckCircle size={11} /> Expires {new Date(session.expiresAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      data-testid={`btn-revoke-session-${session.id}`}
                      onClick={() => revokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {revoking === session.id ? (
                        <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      Revoke
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === "events" && (
          <SecurityEvents token={token} />
        )}
        {/* MFA Tab */}
        {activeTab === "mfa" && (
          <div className="space-y-6">
            {/* MFA Status Card */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mfaStatus?.enabled ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <Lock size={18} className={mfaStatus?.enabled ? 'text-emerald-600' : 'text-amber-600'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Multi-Factor Authentication (TOTP)</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {mfaStatus?.enabled
                        ? `Enabled · Verified ${mfaStatus.verifiedAt ? new Date(mfaStatus.verifiedAt).toLocaleDateString() : 'recently'}`
                        : 'Not enabled — your account uses password-only authentication'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  mfaStatus?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {mfaStatus?.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {!mfaStatus?.enabled && !mfaSetup && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 mb-3">
                    <strong>Recommended for HIPAA compliance.</strong> MFA adds a second layer of security using a TOTP authenticator app (Google Authenticator, Authy, 1Password, etc.).
                  </p>
                  <button
                    onClick={startMfaSetup}
                    disabled={mfaLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {mfaLoading ? 'Setting up...' : 'Set Up MFA'}
                  </button>
                </div>
              )}

              {mfaSetup && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Step 1: Enter this secret in your authenticator app</p>
                    <div className="font-mono text-sm bg-white border border-blue-200 rounded-lg p-3 break-all select-all">
                      {mfaSetup.secret}
                    </div>
                  </div>
                  <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                    <p className="text-sm font-semibold text-violet-800 mb-2">Step 2: Save these backup codes (single-use, store safely)</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {mfaSetup.backupCodes.map((code, i) => (
                        <code key={i} className="text-xs bg-white border border-violet-200 rounded px-2 py-1 font-mono">{code}</code>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-sm font-semibold text-emerald-800 mb-2">Step 3: Enter the 6-digit code from your app to confirm</p>
                    <div className="flex gap-2">
                      <input
                        type="text" inputMode="numeric" maxLength={6}
                        value={mfaCode}
                        onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-32 px-3 py-2 rounded-lg border border-border text-center font-mono text-lg tracking-widest bg-background"
                      />
                      <button onClick={enableMfa} disabled={mfaLoading || mfaCode.length !== 6}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                        {mfaLoading ? 'Verifying...' : 'Enable MFA'}
                      </button>
                      <button onClick={() => { setMfaSetup(null); setMfaCode(''); }}
                        className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {mfaStatus?.enabled && (
                <div className="mt-4 flex items-center gap-3">
                  <button onClick={disableMfa}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                    Disable MFA
                  </button>
                  <span className="text-xs text-muted-foreground">Requires your current TOTP code</span>
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Security Checklist</h3>
              <div className="space-y-3">
                {[
                  { label: 'Multi-Factor Authentication', done: mfaStatus?.enabled ?? false, desc: 'TOTP-based second factor for all logins' },
                  { label: 'HIPAA Audit Logging', done: true, desc: 'All PHI access logged with user, IP, and timestamp' },
                  { label: 'Session Management', done: true, desc: 'Active sessions visible and revocable' },
                  { label: 'Login Rate Limiting', done: true, desc: 'Account lockout after 5 failed attempts' },
                  { label: 'Document Tamper Detection', done: true, desc: 'SHA-256 hash stored at time of send' },
                  { label: 'Encrypted Signing Tokens', done: true, desc: '48-byte cryptographically random tokens per recipient' },
                  { label: 'Field-Level PHI Encryption', done: true, desc: 'AES-256-GCM encryption for patient data at rest' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.done ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}>
                      {item.done ? <CheckCircle size={12} className="text-emerald-600" /> : <AlertTriangle size={12} className="text-amber-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SecurityEvents({ token }: { token: string | null }) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (severity) params.set("severity", severity);
    const res = await fetch(`/api/security/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
      setTotal(data.total);
    }
    setLoading(false);
  }, [token, severity, page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={severity}
            onChange={e => { setSeverity(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary text-foreground"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
          <button onClick={fetchEvents} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
        <span className="text-sm text-muted-foreground">{total} total events</span>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-3 animate-pulse">
                <div className="w-7 h-7 bg-muted rounded-lg" />
                <div className="flex-1"><div className="h-3 w-32 bg-muted rounded mb-1.5" /><div className="h-2.5 w-48 bg-muted rounded" /></div>
              </div>
            ))
          ) : events.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground text-sm">No events found</div>
          ) : (
            events.map(event => {
              const cfg = severityConfig[event.severity] ?? severityConfig.info;
              const Icon = cfg.icon;
              return (
                <div key={event.id} className="px-6 py-3.5 flex items-start gap-3">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                    <Icon size={13} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        {eventTypeLabels[event.eventType] ?? event.eventType}
                      </p>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-md capitalize", cfg.bg, cfg.color)}>
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.email ?? "Unknown user"} · {event.ipAddress ?? "Unknown IP"}
                    </p>
                    {event.details && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{event.details}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {total > 50 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <button
            disabled={page * 50 >= total}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
