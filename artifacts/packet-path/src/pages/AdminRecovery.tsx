import { useState } from "react";
import { Link } from "wouter";
import { Activity, ArrowLeft, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminRecoveryPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin-access-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recoveryToken, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast({ title: "Recovery failed", description: result.error, variant: "destructive" });
        return;
      }
      setComplete(true);
    } catch {
      toast({ title: "Recovery failed", description: "The server could not be reached.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c22] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-blue-950/80 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/80"><Activity size={19} /></div>
          <div><h1 className="text-lg font-semibold">PacketPath</h1><p className="text-xs text-white/45">Secure administrator recovery</p></div>
        </div>

        {complete ? (
          <div className="space-y-5">
            <KeyRound className="text-emerald-400" size={34} />
            <div><h2 className="text-xl font-semibold">Access restored</h2><p className="mt-2 text-sm text-white/60">Remove <code>ADMIN_RECOVERY_EMAIL</code> and <code>ADMIN_RECOVERY_TOKEN</code> from Render, redeploy, then sign in with your new password.</p></div>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-blue-300"><ArrowLeft size={15} /> Return to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div><h2 className="text-xl font-semibold">Recover admin access</h2><p className="mt-1 text-sm text-white/50">Use the email and temporary token configured in your Render environment.</p></div>
            <label className="block text-xs text-white/60">Admin email<input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none focus:border-blue-400" /></label>
            <label className="block text-xs text-white/60">Recovery token<input type="password" required autoComplete="off" value={recoveryToken} onChange={e => setRecoveryToken(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none focus:border-blue-400" /></label>
            <label className="block text-xs text-white/60">New password<input type="password" required minLength={12} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none focus:border-blue-400" /></label>
            <label className="block text-xs text-white/60">Confirm new password<input type="password" required minLength={12} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none focus:border-blue-400" /></label>
            <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 font-semibold disabled:opacity-60">{loading ? "Restoring access…" : "Reset password and MFA"}</button>
            <Link href="/login" className="flex items-center justify-center gap-2 text-xs text-white/50"><ArrowLeft size={13} /> Back to sign in</Link>
          </form>
        )}
      </div>
    </div>
  );
}
