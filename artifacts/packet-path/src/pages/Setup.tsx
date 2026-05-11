import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SetupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<"org" | "admin" | "done">("org");
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOrgNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (orgName.trim()) setStep("admin");
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName: orgName.trim(), name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast({ title: data.error ?? "Setup failed", variant: "destructive" });
        return;
      }
      setStep("done");
    } catch {
      toast({ title: "Network error — please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const bg = (
    <>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(135deg, #0a0e27 0%, #0f1538 25%, #141a42 50%, #0d1230 75%, #080c22 100%)",
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(ellipse at 25% 30%, rgba(56, 140, 255, 0.25) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 20%, rgba(100, 80, 255, 0.20) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 75%, rgba(0, 180, 220, 0.15) 0%, transparent 55%)
        `
      }} />
      <div className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse"
        style={{ background: "radial-gradient(circle, rgba(56, 140, 255, 0.4) 0%, transparent 70%)", top: "10%", left: "15%", filter: "blur(60px)" }} />
    </>
  );

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.07) 100%)",
    backdropFilter: "blur(60px) saturate(180%) brightness(1.1)",
    WebkitBackdropFilter: "blur(60px) saturate(180%) brightness(1.1)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    boxShadow: "0 32px 80px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.1) inset",
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(56, 140, 255, 0.5)";
    e.target.style.background = "rgba(255,255,255,0.09)";
    e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.2), 0 0 0 3px rgba(56, 140, 255, 0.15)";
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.10)";
    e.target.style.background = "rgba(255,255,255,0.06)";
    e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.2)";
  };

  const btnStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(56, 140, 255, 0.85), rgba(100, 80, 255, 0.85))",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 4px 20px rgba(56, 140, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
  };

  const labelClass = "text-white/50 text-xs font-medium uppercase tracking-wider";
  const inputClass = "w-full px-4 py-3 rounded-2xl text-white text-sm outline-none transition-all duration-200 placeholder-white/20";

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {bg}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          className="relative w-full max-w-sm mx-4">
          <div className="rounded-3xl overflow-hidden relative" style={cardStyle}>
            <div className="px-8 py-10 text-center flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.8))", boxShadow: "0 4px 20px rgba(34, 197, 94, 0.3)" }}>
                <CheckCircle size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-xl font-semibold">You're all set</h2>
                <p className="text-white/45 text-sm mt-1">
                  <span className="text-white/70 font-medium">{orgName}</span> is ready to go.
                </p>
              </div>
              <button onClick={() => setLocation("/login")} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-white text-sm font-semibold" style={btnStyle}>
                Go to sign in <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {bg}
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm mx-4">
        <div className="rounded-3xl overflow-hidden relative" style={cardStyle}>
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(56, 140, 255, 0.8), rgba(120, 80, 255, 0.8))", boxShadow: "0 4px 20px rgba(56, 140, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
                <Activity size={19} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg tracking-tight">PacketPath</h1>
                <p className="text-white/35 text-xs font-light">Initial Setup</p>
              </div>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              {["org", "admin"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step === s ? "bg-blue-500 text-white" : step === "admin" && s === "org" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40"}`}>
                    {step === "admin" && s === "org" ? <CheckCircle size={12} /> : i + 1}
                  </div>
                  {i < 1 && <div className="flex-1 h-px w-8" style={{ background: step === "admin" ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)" }} />}
                </div>
              ))}
            </div>
            {step === "org" ? (
              <>
                <h2 className="text-white text-xl font-semibold tracking-tight">Welcome to PacketPath</h2>
                <p className="text-white/45 text-sm mt-1 font-light">Let's get your organization set up.</p>
              </>
            ) : (
              <>
                <h2 className="text-white text-xl font-semibold tracking-tight">Create your admin account</h2>
                <p className="text-white/45 text-sm mt-1 font-light">This will be the primary administrator for <span className="text-white/70">{orgName}</span>.</p>
              </>
            )}
          </div>

          {/* Step 1 — Org name */}
          {step === "org" && (
            <form onSubmit={handleOrgNext} className="px-8 py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Organization name</label>
                <input
                  autoFocus
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="Acme Medical Group"
                />
              </div>
              <button type="submit" className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-white text-sm font-semibold" style={btnStyle}>
                Continue <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* Step 2 — Admin account */}
          {step === "admin" && (
            <form onSubmit={handleAdminSubmit} className="px-8 py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Your name</label>
                <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} required
                  className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Jane Smith" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="jane@yourcompany.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                    className={`${inputClass} pr-11`} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-white text-sm font-semibold disabled:opacity-60"
                style={loading ? { ...btnStyle, background: "rgba(56, 140, 255, 0.4)" } : btnStyle}>
                {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <><span>Create account</span><ArrowRight size={15} /></>}
              </button>
              <button type="button" onClick={() => setStep("org")} className="text-white/30 text-xs text-center hover:text-white/50 transition-colors">
                ← Back
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
