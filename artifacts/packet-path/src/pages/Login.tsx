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
      {/* Tahoe-style animated mesh background */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(135deg, #0a0e27 0%, #0f1538 25%, #141a42 50%, #0d1230 75%, #080c22 100%)",
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(ellipse at 25% 30%, rgba(56, 140, 255, 0.25) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 20%, rgba(100, 80, 255, 0.20) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 75%, rgba(0, 180, 220, 0.15) 0%, transparent 55%),
          radial-gradient(ellipse at 15% 80%, rgba(120, 60, 255, 0.12) 0%, transparent 45%)
        `
      }} />
      {/* Floating light orbs */}
      <div className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(56, 140, 255, 0.4) 0%, transparent 70%)",
          top: "10%",
          left: "15%",
          filter: "blur(60px)",
        }}
      />
      <div className="absolute w-80 h-80 rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
          bottom: "15%",
          right: "20%",
          filter: "blur(50px)",
          animation: "pulse 4s ease-in-out infinite alternate",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Liquid Glass login card */}
        <div className="rounded-3xl overflow-hidden relative glass-highlight"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.07) 100%)",
            backdropFilter: "blur(60px) saturate(180%) brightness(1.1)",
            WebkitBackdropFilter: "blur(60px) saturate(180%) brightness(1.1)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.1) inset",
          }}>
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(56, 140, 255, 0.8), rgba(120, 80, 255, 0.8))",
                  boxShadow: "0 4px 20px rgba(56, 140, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}>
                <Activity size={19} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg tracking-tight">PacketPath</h1>
                <p className="text-white/35 text-xs font-light">Occu-Med Workflow</p>
              </div>
            </div>
            <h2 className="text-white text-xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-white/45 text-sm mt-1 font-light">Access your exam workflow dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-white/50 text-xs font-medium uppercase tracking-wider">Email</label>
              <input
                data-testid="input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none transition-all duration-200 placeholder-white/20"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(56, 140, 255, 0.5)";
                  e.target.style.background = "rgba(255,255,255,0.09)";
                  e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.2), 0 0 0 3px rgba(56, 140, 255, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.10)";
                  e.target.style.background = "rgba(255,255,255,0.06)";
                  e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.2)";
                }}
                placeholder="you@occumed.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-white/50 text-xs font-medium uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 rounded-2xl text-white text-sm outline-none transition-all duration-200 placeholder-white/20"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(56, 140, 255, 0.5)";
                    e.target.style.background = "rgba(255,255,255,0.09)";
                    e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.2), 0 0 0 3px rgba(56, 140, 255, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.10)";
                    e.target.style.background = "rgba(255,255,255,0.06)";
                    e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.2)";
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              data-testid="button-submit"
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-60"
              style={{
                background: loginMutation.isPending
                  ? "rgba(56, 140, 255, 0.4)"
                  : "linear-gradient(135deg, rgba(56, 140, 255, 0.85), rgba(100, 80, 255, 0.85))",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 4px 20px rgba(56, 140, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {loginMutation.isPending ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>

            <p className="text-white/20 text-xs text-center mt-1 font-light">
              Demo: admin@occumed.com / admin123
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
