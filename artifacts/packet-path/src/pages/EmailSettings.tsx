import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle, XCircle, AlertCircle, Send, Settings, Eye, EyeOff, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SmtpStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  host?: string;
  port?: string;
  user?: string;
  fromAddress?: string;
  vars?: Record<string, boolean>;
}

const PROVIDERS = [
  {
    name: "Gmail",
    host: "smtp.gmail.com",
    port: "587",
    secure: "false",
    helpUrl: "https://support.google.com/accounts/answer/185833",
    helpText: "Use a Gmail App Password (not your regular password). Enable 2FA first, then create an App Password at myaccount.google.com → Security → App Passwords.",
    icon: "📧",
  },
  {
    name: "Outlook / Microsoft 365",
    host: "smtp-mail.outlook.com",
    port: "587",
    secure: "false",
    helpUrl: "https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353",
    helpText: "Use your Outlook email and password. You may need to enable SMTP AUTH in admin settings.",
    icon: "📬",
  },
  {
    name: "SendGrid",
    host: "smtp.sendgrid.net",
    port: "587",
    secure: "false",
    helpUrl: "https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp",
    helpText: "Use 'apikey' as the username, and your SendGrid API key as the password.",
    icon: "⚡",
  },
  {
    name: "Mailgun",
    host: "smtp.mailgun.org",
    port: "587",
    secure: "false",
    helpUrl: "https://documentation.mailgun.com/en/latest/user_manual.html#smtp",
    helpText: "Use your Mailgun SMTP credentials from the domain settings page.",
    icon: "🔫",
  },
  {
    name: "Custom SMTP",
    host: "",
    port: "587",
    secure: "false",
    helpUrl: "",
    helpText: "Enter your custom SMTP server details.",
    icon: "🔧",
  },
];

const ENV_VARS = [
  { key: "SMTP_HOST", label: "SMTP Host", placeholder: "smtp.gmail.com", required: true, secret: false },
  { key: "SMTP_PORT", label: "SMTP Port", placeholder: "587", required: false, secret: false },
  { key: "SMTP_SECURE", label: "Use TLS (port 465)", placeholder: "false", required: false, secret: false },
  { key: "SMTP_USER", label: "SMTP Username / Email", placeholder: "you@example.com", required: true, secret: false },
  { key: "SMTP_PASS", label: "SMTP Password / API Key", placeholder: "••••••••", required: true, secret: true },
  { key: "SMTP_FROM", label: "From Email Address", placeholder: "no-reply@occumed.com", required: false, secret: false },
  { key: "SMTP_FROM_NAME", label: "From Name", placeholder: "Occu-Med PacketPath", required: false, secret: false },
];

export default function EmailSettingsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<SmtpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<(typeof PROVIDERS)[0] | null>(null);
  const [showProvider, setShowProvider] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/signature-settings/smtp-status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const checkConnection = async () => {
    setChecking(true);
    await fetchStatus();
    setChecking(false);
    toast({ title: status?.connected ? "SMTP connection verified ✓" : "SMTP connection failed" });
  };

  const sendTestEmail = async () => {
    setSending(true);
    const res = await fetch("/api/signature-settings/test-email", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ testEmail }),
    });
    const data = await res.json();
    if (data.sent) {
      toast({ title: `Test email sent to ${data.toEmail}` });
    } else {
      toast({ title: `Email failed: ${data.error}`, variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Mail size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Email Delivery</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Configure SMTP to send signing links to recipients automatically</p>
          </div>
        </div>

        {/* Status card */}
        <div className={cn(
          "glass-card rounded-2xl p-5 mb-6 border",
          loading ? "border-border" :
            status?.connected ? "border-emerald-200/60" :
            status?.configured ? "border-amber-200/60" :
            "border-red-200/40"
        )}>
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            ) : status?.connected ? (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
            ) : status?.configured ? (
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle size={20} className="text-red-500" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">
                {loading ? "Checking status..." :
                  status?.connected ? "Email delivery is active" :
                  status?.configured ? "SMTP configured but connection failed" :
                  "Email delivery not configured"}
              </p>
              {status && <p className="text-xs text-muted-foreground mt-0.5">{status.message}</p>}
              {status?.host && (
                <p className="text-xs text-muted-foreground mt-1">
                  {status.user} → {status.host}:{status.port} · From: {status.fromAddress}
                </p>
              )}
            </div>
            <button
              onClick={checkConnection}
              disabled={checking || loading}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {checking ? "Checking..." : "Re-check"}
            </button>
          </div>
        </div>

        {/* How to configure */}
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => setShowProvider(!showProvider)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings size={15} className="text-indigo-500" />
              <span className="font-semibold text-foreground text-sm">Setup Instructions</span>
            </div>
            {showProvider ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
          </button>

          {showProvider && (
            <div className="px-5 pb-5 border-t border-border">
              <p className="text-sm text-muted-foreground mt-4 mb-4">
                Add these as <strong>Secrets</strong> in the Replit Secrets panel (the 🔒 icon in the left sidebar). They will be picked up automatically on the next restart.
              </p>

              {/* Provider quick-fill */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick-fill for common providers</p>
                <div className="flex flex-wrap gap-2">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedProvider(selectedProvider?.name === p.name ? null : p)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                        selectedProvider?.name === p.name
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-border text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{p.icon}</span> {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedProvider && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/40"
                >
                  <p className="text-xs font-semibold text-indigo-700 mb-1">{selectedProvider.icon} {selectedProvider.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{selectedProvider.helpText}</p>
                  {selectedProvider.helpUrl && (
                    <a href={selectedProvider.helpUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                      <ExternalLink size={10} /> View documentation
                    </a>
                  )}
                  {selectedProvider.host && (
                    <div className="mt-3 p-3 rounded-lg bg-white/60 border border-indigo-200/30">
                      <p className="text-xs font-mono text-slate-700">SMTP_HOST = {selectedProvider.host}</p>
                      <p className="text-xs font-mono text-slate-700">SMTP_PORT = {selectedProvider.port}</p>
                      <p className="text-xs font-mono text-slate-700">SMTP_SECURE = {selectedProvider.secure}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Required secrets table */}
              <div className="space-y-2">
                {ENV_VARS.map(v => (
                  <div key={v.key} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono font-bold text-indigo-700">{v.key}</code>
                        {v.required && <span className="text-red-500 text-xs">required</span>}
                        {v.secret && <span className="text-amber-600 text-xs">🔒 secret</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{v.label}</p>
                      {selectedProvider?.host && v.key === "SMTP_HOST" && selectedProvider.host && (
                        <p className="text-xs text-indigo-600 font-mono mt-0.5">→ {selectedProvider.host}</p>
                      )}
                      {selectedProvider?.port && v.key === "SMTP_PORT" && (
                        <p className="text-xs text-indigo-600 font-mono mt-0.5">→ {selectedProvider.port}</p>
                      )}
                    </div>
                    {status?.vars && (
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        status.vars[v.key] ? "bg-emerald-100" : "bg-muted"
                      )}>
                        {status.vars[v.key]
                          ? <CheckCircle size={12} className="text-emerald-600" />
                          : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-border">
                <p className="text-xs font-semibold text-foreground mb-2">After adding secrets:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to the Replit Secrets panel (🔒 in sidebar)</li>
                  <li>Add each variable above</li>
                  <li>Restart the API Server workflow</li>
                  <li>Come back here and click "Re-check"</li>
                  <li>Send a test email to verify delivery</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Test email */}
        {status?.configured && (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <h3 className="font-semibold text-foreground text-sm mb-1 flex items-center gap-2">
              <Send size={14} className="text-indigo-500" /> Send Test Email
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Send a sample signing request email to verify delivery and appearance.</p>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="Enter email address (leave blank to use your account email)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-indigo-400 transition-colors"
              />
              <button
                onClick={sendTestEmail}
                disabled={sending || !status.configured}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
              >
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={13} />}
                Send Test
              </button>
            </div>
          </div>
        )}

        {/* What happens when emails are sent */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Mail size={14} className="text-indigo-500" /> How Email Delivery Works
          </h3>
          <div className="space-y-3">
            {[
              { step: "1", title: "Create a signature request", desc: "After filling the 3-step wizard, signing emails are sent automatically to each recipient." },
              { step: "2", title: "Recipient receives a branded email", desc: "A professional HTML email with the document title, message, and a prominent signing button." },
              { step: "3", title: "Secure link", desc: "Each link is unique per recipient with a 48-byte random token. Links expire on the date you set." },
              { step: "4", title: "Reminder emails", desc: "Click 'Send Reminder' on any pending request to re-email all unsigned recipients instantly." },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
