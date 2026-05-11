import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Webhook, Plus, Trash2, Play, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WebhookConfig {
  id: number;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

const EVENT_OPTIONS = [
  { value: "packet.completed", label: "Packet Completed" },
  { value: "packet.voided", label: "Packet Voided" },
  { value: "packet.sent", label: "Packet Sent" },
  { value: "recipient.signed", label: "Recipient Signed" },
  { value: "recipient.declined", label: "Recipient Declined" },
  { value: "case.submitted", label: "Case Submitted" },
];

export default function WebhooksPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[], isActive: true });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/webhooks", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setWebhooks(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const createWebhook = async () => {
    if (!form.name || !form.url || form.events.length === 0) {
      toast({ title: "Fill in all fields and select at least one event", variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setNewSecret(data.secret);
      setShowCreate(false);
      setForm({ name: "", url: "", events: [], isActive: true });
      fetchWebhooks();
      toast({ title: "Webhook created" });
    } else {
      toast({ title: "Failed to create webhook", variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteWebhook = async (id: number) => {
    if (!confirm("Delete this webhook? This cannot be undone.")) return;
    await fetch(`/api/webhooks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchWebhooks();
    toast({ title: "Webhook deleted" });
  };

  const testWebhook = async (id: number) => {
    setTesting(id);
    const res = await fetch(`/api/webhooks/${id}/test`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast({ title: "Test event fired" });
    } else {
      toast({ title: "Test failed", variant: "destructive" });
    }
    setTesting(null);
  };

  const toggleEvent = (event: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter(e => e !== event)
        : [...f.events, event],
    }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Webhook size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Webhooks</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Notify external systems when events occur in PacketPath</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 shadow-sm"
          >
            <Plus size={15} /> Add Webhook
          </button>
        </div>

        {/* New Secret Banner */}
        {newSecret && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Save this signing secret — it will only be shown once!
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono break-all">
                {showSecret ? newSecret : "•".repeat(64)}
              </code>
              <button onClick={() => setShowSecret(s => !s)} className="p-2 rounded-lg border border-amber-200 text-amber-600">
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(newSecret); toast({ title: "Copied!" }); }}
                className="px-3 py-2 text-xs bg-amber-600 text-white rounded-lg font-medium"
              >
                Copy
              </button>
              <button onClick={() => setNewSecret(null)} className="px-3 py-2 text-xs border border-amber-200 text-amber-700 rounded-lg">
                Dismiss
              </button>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Use this secret to verify webhook signatures: <code>X-PacketPath-Signature: sha256=HMAC(secret, body)</code>
            </p>
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4">New Webhook Endpoint</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. EMR Integration"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoint URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://your-system.com/webhook"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Events to Subscribe</label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.events.includes(opt.value)}
                        onChange={() => toggleEvent(opt.value)}
                        className="rounded"
                      />
                      <span className="text-sm text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={createWebhook}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Webhook"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Webhooks List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                <div className="h-4 w-48 bg-muted rounded mb-2" />
                <div className="h-3 w-72 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Webhook size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No webhooks configured</p>
            <p className="text-muted-foreground text-sm mt-1">Add a webhook to notify your EMR/EHR when packets are completed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(hook => (
              <div key={hook.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{hook.name}</h3>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        hook.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                      )}>
                        {hook.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate mb-2">{hook.url}</p>
                    <div className="flex flex-wrap gap-1">
                      {(hook.events as string[]).map(e => (
                        <span key={e} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => testWebhook(hook.id)}
                      disabled={testing === hook.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      <Play size={12} className={testing === hook.id ? "animate-spin" : ""} />
                      Test
                    </button>
                    <button
                      onClick={() => deleteWebhook(hook.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 glass-card rounded-2xl">
          <h3 className="text-sm font-semibold text-foreground mb-2">Webhook Signature Verification</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Every webhook request includes an <code className="bg-muted px-1 rounded">X-PacketPath-Signature</code> header.
            Verify it using HMAC-SHA256 with your signing secret:
          </p>
          <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto font-mono">
{`// Node.js example
const crypto = require('crypto');
const sig = req.headers['x-packetpath-signature'];
const expected = 'sha256=' + crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(req.rawBody)
  .digest('hex');
if (sig !== expected) throw new Error('Invalid signature');`}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}
