import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@occumed.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          setLocation("/");
        },
        onError: () => {
          toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-violet-950" />
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
                           radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
                           radial-gradient(ellipse at 60% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)`
        }}
      />
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Glass card */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}>
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shadow-lg">
                <Activity size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg tracking-tight">PacketPath</h1>
                <p className="text-white/40 text-xs">Occu-Med Workflow</p>
              </div>
            </div>
            <h2 className="text-white text-xl font-semibold">Sign in</h2>
            <p className="text-white/50 text-sm mt-1">Access your exam workflow dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Email</label>
              <input
                data-testid="input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all placeholder-white/20"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(99, 102, 241, 0.6)"; e.target.style.background = "rgba(255,255,255,0.10)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                placeholder="you@occumed.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-xs font-medium uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 rounded-xl text-white text-sm outline-none transition-all placeholder-white/20"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(99, 102, 241, 0.6)"; e.target.style.background = "rgba(255,255,255,0.10)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              data-testid="button-submit"
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
              style={{
                background: loginMutation.isPending
                  ? "rgba(99, 102, 241, 0.5)"
                  : "linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
              }}
            >
              {loginMutation.isPending ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>

            <p className="text-white/25 text-xs text-center mt-1">
              Demo: admin@occumed.com / admin123
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
