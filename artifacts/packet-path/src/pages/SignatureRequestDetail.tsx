import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  PenTool, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle,
  Eye, Copy, Users, FileText, Shield, Calendar, Globe, Monitor,
  Send, Hash, ChevronDown, ChevronUp, Download
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RequestDetail {
  id: number;
  title: string;
  message: string | null;
  status: string;
  documentContent: string;
  documentHash: string;
  expiresAt: string | null;
  completedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  patientName: string | null;
  caseId: number | null;
  recipients: {
    id: number;
    name: string;
    email: string;
    role: string;
    order: number;
    status: string;
    token: string;
    viewedAt: string | null;
    signedAt: string | null;
    declinedAt: string | null;
    declineReason: string | null;
    ipAddress: string | null;
    userAgent: string | null;
  }[];
  formResponses: {
    recipientId: number;
    recipientName: string;
    submittedAt: string | null;
    responses: { fieldId?: string; label?: string; name?: string; value: string | boolean }[];
  }[];
  completedSignatures: {
    id: number;
    recipientId: number;
    signatureType: string;
    fullName: string;
    documentHash: string;
    signatureHash: string;
    signedAt: string;
    ipAddress: string | null;
  }[];
  auditEvents: {
    id: number;
    action: string;
    details: string | null;
    createdAt: string;
  }[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100", icon: FileText },
  pending: { label: "Pending", color: "text-[#8dbeb5]", bg: "bg-[#8dbeb5]/15", icon: Clock },
  partially_signed: { label: "In Progress", color: "text-[#8dbeb5]", bg: "bg-[#8dbeb5]/15", icon: PenTool },
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
  voided: { label: "Voided", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
  expired: { label: "Expired", color: "text-slate-500", bg: "bg-slate-100", icon: AlertCircle },
};

const recipientStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-slate-500", bg: "bg-slate-100" },
  viewed: { label: "Viewed", color: "text-[#8dbeb5]", bg: "bg-[#8dbeb5]/15" },
  signed: { label: "Signed", color: "text-emerald-600", bg: "bg-emerald-50" },
  declined: { label: "Declined", color: "text-red-600", bg: "bg-red-50" },
};

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Browser";
}

export default function SignatureRequestDetailPage({ requestId }: { requestId: number }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDoc, setShowDoc] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchDetail = useCallback(async () => {
    const res = await fetch(`/api/signature-requests/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setDetail(await res.json());
    setLoading(false);
  }, [token, requestId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const copyLink = async (recipientToken: string) => {
    const link = `${window.location.origin}/sign/${recipientToken}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Signing link copied" });
  };

  const sendReminder = async () => {
    setSendingReminder(true);
    const res = await fetch(`/api/signature-requests/${requestId}/remind`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const payload = await res.json().catch(() => null);
      const failed = Array.isArray(payload?.perRecipient)
        ? payload.perRecipient.filter((r: { sent?: boolean }) => !r.sent).length
        : 0;
      toast({
        title: failed > 0 ? "Reminder sent with some failures" : "Reminder sent to pending signers",
        description: payload?.emailsTotal ? `${payload.emailsSent}/${payload.emailsTotal} email(s) sent` : undefined,
      });
      fetchDetail();
    }
    setSendingReminder(false);
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/signature-requests/${requestId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ?? `PacketPath_document.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "PDF download failed", variant: "destructive" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="glass-card rounded-2xl p-6"><div className="h-32 bg-muted rounded" /></div>
        </div>
      </div>
    );
  }

  if (!detail) return (
    <div className="p-8 text-center text-muted-foreground">Request not found.</div>
  );

  const cfg = statusConfig[detail.status] ?? statusConfig.draft;
  const StatusIcon = cfg.icon;
  const progress = detail.recipients.length > 0
    ? Math.round((detail.recipients.filter(r => r.status === "signed").length / detail.recipients.length) * 100)
    : 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Back nav */}
        <Link href="/esignatures">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to E-Signatures
          </button>
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8dbeb5]/15 to-[#527b78]/15 flex items-center justify-center border border-white/20">
              <PenTool size={18} className="text-[#8dbeb5]" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-semibold text-foreground">{detail.title}</h1>
                <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
                  <StatusIcon size={11} /> {cfg.label}
                </span>
              </div>
              {detail.patientName && <p className="text-sm text-muted-foreground mt-0.5">Patient: {detail.patientName}</p>}
              <p className="text-xs text-muted-foreground mt-1">Created {new Date(detail.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(detail.status === "pending" || detail.status === "partially_signed") && (
              <button
                onClick={sendReminder}
                disabled={sendingReminder}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/25 text-[#8dbeb5] text-sm hover:bg-[#8dbeb5]/10 transition-colors"
              >
                <Send size={13} /> Send Reminder
              </button>
            )}
            <button
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/25 text-[#8dbeb5] text-sm hover:bg-[#8dbeb5]/10 transition-colors disabled:opacity-50"
            >
              <Download size={13} className={downloadingPdf ? "animate-bounce" : ""} />
              {downloadingPdf ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="glass-card rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Signing Progress</p>
            <span className="text-sm text-muted-foreground">{detail.recipients.filter(r => r.status === "signed").length} of {detail.recipients.length} signed</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", detail.status === "completed" ? "bg-emerald-500" : "bg-gradient-to-r from-[#8dbeb5] to-[#527b78]")}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          {detail.completedAt && (
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle size={11} /> Fully executed {new Date(detail.completedAt).toLocaleString()}
            </p>
          )}
          {detail.voidReason && (
            <p className="text-xs text-red-600 mt-2">Voided: {detail.voidReason}</p>
          )}
        </div>

        {/* Recipients */}
        <div className="glass-card rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Users size={15} className="text-[#8dbeb5]" />
            <h2 className="font-semibold text-foreground text-sm">Recipients</h2>
          </div>
          <div className="divide-y divide-border">
            {detail.recipients.map(r => {
              const rCfg = recipientStatusConfig[r.status] ?? recipientStatusConfig.pending;
              const sig = detail.completedSignatures.find(s => s.recipientId === r.id);
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8dbeb5] to-[#527b78] flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{r.name}</p>
                        <p className="text-muted-foreground text-xs">{r.email} · <span className="capitalize">{r.role}</span></p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                          {r.viewedAt && <span className="flex items-center gap-1"><Eye size={10} /> Viewed {new Date(r.viewedAt).toLocaleString()}</span>}
                          {r.signedAt && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={10} /> Signed {new Date(r.signedAt).toLocaleString()}</span>}
                          {r.declinedAt && <span className="flex items-center gap-1 text-red-600"><XCircle size={10} /> Declined — "{r.declineReason}"</span>}
                          {r.ipAddress && r.status === "signed" && <span className="flex items-center gap-1"><Globe size={10} /> {r.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", rCfg.bg, rCfg.color)}>
                        {rCfg.label}
                      </span>
                      {r.status !== "signed" && r.status !== "declined" && (
                        <button
                          onClick={() => copyLink(r.token)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy size={11} /> Copy Link
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Signature certificate */}
                  {sig && (
                    <div className="mt-3 ml-12 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/40">
                      <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                        <Shield size={11} /> Signature Certificate
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span>Type: <strong className="text-foreground capitalize">{sig.signatureType}</strong></span>
                        <span>Name: <strong className="text-foreground">{sig.fullName}</strong></span>
                        <span className="flex items-center gap-1"><Calendar size={9} /> {new Date(sig.signedAt).toLocaleString()}</span>
                        {sig.ipAddress && <span className="flex items-center gap-1"><Globe size={9} /> {sig.ipAddress}</span>}
                        <span className="col-span-2 flex items-center gap-1 font-mono text-xs truncate">
                          <Hash size={9} /> Doc hash: {sig.documentHash.slice(0, 16)}...
                        </span>
                        <span className="col-span-2 flex items-center gap-1 font-mono text-xs truncate">
                          <Hash size={9} /> Sig hash: {sig.signatureHash.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* Captured form responses */}
        <div className="glass-card rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FileText size={15} className="text-[#8dbeb5]" />
            <h2 className="font-semibold text-foreground text-sm">Captured Form Responses</h2>
          </div>
          <div className="p-5">
            {detail.formResponses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No form field responses captured yet.</p>
            ) : (
              <div className="space-y-4">
                {detail.formResponses.map((entry, idx) => (
                  <div key={`${entry.recipientId}-${idx}`} className="rounded-xl border border-white/15 bg-[#031219]/35 p-4">
                    <p className="text-sm font-semibold text-foreground">{entry.recipientName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Submitted {entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : "Unknown"}</p>
                    <div className="mt-3 grid gap-2">
                      {entry.responses.map((resp, rIdx) => (
                        <div key={rIdx} className="text-xs text-[#c8d2d1] flex justify-between gap-3">
                          <span>{resp.label || resp.name || resp.fieldId || `Field ${rIdx + 1}`}</span>
                          <span className="text-[#f4f7f6]">{String(resp.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Document content toggle */}
        <div className="glass-card rounded-2xl overflow-hidden mb-5">
          <button
            onClick={() => setShowDoc(!showDoc)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-[#8dbeb5]" />
              <span className="font-semibold text-foreground text-sm">Document Content</span>
              <span className="text-xs text-muted-foreground font-mono ml-2">SHA-256: {detail.documentHash.slice(0, 12)}...</span>
            </div>
            {showDoc ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
          </button>
          {showDoc && (
            <div
              className="px-6 py-5 border-t border-border prose prose-sm max-w-none text-foreground"
              style={{ fontFamily: "Georgia, serif", lineHeight: 1.8, fontSize: 14 }}
              dangerouslySetInnerHTML={{ __html: detail.documentContent }}
            />
          )}
        </div>

        {/* Audit trail */}
        {detail.auditEvents.length > 0 && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Shield size={15} className="text-[#8dbeb5]" />
              <h2 className="font-semibold text-foreground text-sm">Audit Trail</h2>
            </div>
            <div className="divide-y divide-border">
              {detail.auditEvents.map(event => (
                <div key={event.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8dbeb5] shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground capitalize">{event.action.replace(/_/g, " ")}</p>
                    {event.details && <p className="text-xs text-muted-foreground">{event.details}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
