import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, Save, RefreshCw, Building2, Mail, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BrandingConfig {
  clinicName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  emailFromName: string;
  emailFromAddress: string | null;
  emailFooterText: string | null;
  signingPageTagline: string | null;
  faviconUrl: string | null;
}

const DEFAULT_BRANDING: BrandingConfig = {
  clinicName: "Occu-Med Occupational Health",
  logoUrl: null,
  primaryColor: "#2563eb",
  accentColor: "#7c3aed",
  emailFromName: "PacketPath",
  emailFromAddress: null,
  emailFooterText: null,
  signingPageTagline: null,
  faviconUrl: null,
};

export default function BrandingPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/branding", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setBranding({ ...DEFAULT_BRANDING, ...data });
        setLoading(false);
      });
  }, [token]);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/branding", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(branding),
    });
    if (res.ok) {
      toast({ title: "Branding saved" });
    } else {
      const err = await res.json();
      toast({ title: err.error ?? "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const update = (key: keyof BrandingConfig, value: string | null) => {
    setBranding(b => ({ ...b, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <Palette size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">White-Label Branding</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Customize the clinic name, colors, and email identity</p>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 shadow-sm disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="space-y-6">
          {/* Clinic Identity */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Building2 size={15} className="text-primary" /> Clinic Identity
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clinic Name</label>
                <input
                  type="text"
                  value={branding.clinicName}
                  onChange={e => update("clinicName", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  placeholder="Acme Occupational Health"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Logo URL</label>
                <input
                  type="url"
                  value={branding.logoUrl ?? ""}
                  onChange={e => update("logoUrl", e.target.value || null)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                  placeholder="https://your-clinic.com/logo.png"
                />
                <p className="text-xs text-muted-foreground mt-1">Displayed on the patient signing page and in emails</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Signing Page Tagline</label>
                <input
                  type="text"
                  value={branding.signingPageTagline ?? ""}
                  onChange={e => update("signingPageTagline", e.target.value || null)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  placeholder="Secure, HIPAA-compliant document signing"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Palette size={15} className="text-primary" /> Brand Colors
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primary Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={e => update("primaryColor", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={e => update("primaryColor", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                    placeholder="#2563eb"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accent Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.accentColor}
                    onChange={e => update("accentColor", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.accentColor}
                    onChange={e => update("accentColor", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                    placeholder="#7c3aed"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="mt-4 p-4 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="flex gap-2">
                <div
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Primary Button
                </div>
                <div
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: branding.accentColor }}
                >
                  Accent Button
                </div>
              </div>
            </div>
          </div>

          {/* Email Identity */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Mail size={15} className="text-primary" /> Email Identity
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From Name</label>
                <input
                  type="text"
                  value={branding.emailFromName}
                  onChange={e => update("emailFromName", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  placeholder="Acme Health"
                />
                <p className="text-xs text-muted-foreground mt-1">Shown as the sender name in signing request emails</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From Email Address (optional override)</label>
                <input
                  type="email"
                  value={branding.emailFromAddress ?? ""}
                  onChange={e => update("emailFromAddress", e.target.value || null)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                  placeholder="noreply@your-clinic.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave blank to use the SMTP default address</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Footer Text</label>
                <textarea
                  value={branding.emailFooterText ?? ""}
                  onChange={e => update("emailFooterText", e.target.value || null)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                  placeholder="Acme Occupational Health · 123 Main St · (555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
