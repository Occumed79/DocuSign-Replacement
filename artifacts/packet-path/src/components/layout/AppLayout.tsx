import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, FolderOpen, Plus, LogOut, ChevronLeft, ChevronRight,
  Activity, Shield, User, Users, ClipboardList, AlertTriangle, Clock, PenTool, Mail,
  BarChart2, Webhook, Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const WARN_BEFORE_MS = 5 * 60 * 1000;

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "All Cases", icon: FolderOpen, href: "/cases" },
  { label: "E-Signatures", icon: PenTool, href: "/esignatures" },
  { label: "Analytics", icon: BarChart2, href: "/analytics" },
];

const adminItems = [
  { label: "Admin", icon: Shield, href: "/admin" },
  { label: "Users", icon: Users, href: "/users" },
  { label: "Email Settings", icon: Mail, href: "/email-settings" },
  { label: "Branding", icon: Palette, href: "/branding" },
  { label: "Webhooks", icon: Webhook, href: "/webhooks" },
  { label: "Security", icon: AlertTriangle, href: "/security" },
  { label: "Audit Log", icon: ClipboardList, href: "/audit" },
];

function NavItem({
  item,
  collapsed,
  active,
}: {
  item: { label: string; icon: React.ElementType; href: string };
  collapsed: boolean;
  active: boolean;
}) {
  const content = (
    <Link href={item.href}>
      <button
        data-testid={`nav-${item.label.toLowerCase().replace(/ /g, "-")}`}
        className={cn(
          "transition-all duration-200",
          collapsed
            ? "w-10 h-10 rounded-2xl flex items-center justify-center"
            : "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-left",
          active
            ? "text-white font-medium"
            : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
        )}
        style={active ? {
          background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
        } : undefined}
      >
        <item.icon size={collapsed ? 17 : 16} />
        {!collapsed && item.label}
      </button>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

function SessionTimeoutWarning({ minutesLeft, onDismiss }: { minutesLeft: number; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 glass-card rounded-xl p-4 max-w-sm shadow-xl border border-amber-200"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Session Expiring</p>
            <p className="text-muted-foreground text-xs mt-1">
              Your session expires in {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""}. Please save your work.
            </p>
          </div>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sessionWarning, setSessionWarning] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const loginTimeRef = useRef(Date.now());
  const lastActivityRef = useRef(Date.now());

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setDismissed(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = SESSION_TIMEOUT_MS - (now - loginTimeRef.current);
      if (timeLeft <= 0) { logout(); return; }
      if (timeLeft <= WARN_BEFORE_MS && !dismissed) {
        setSessionWarning(Math.ceil(timeLeft / 60000));
      } else {
        setSessionWarning(null);
      }
    }, 30000);

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [logout, dismissed, handleActivity]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sessionWarning !== null && !dismissed && (
        <SessionTimeoutWarning minutesLeft={sessionWarning} onDismiss={() => setDismissed(true)} />
      )}

      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col h-full shrink-0 relative z-10"
        style={{
          background: "linear-gradient(180deg, rgba(18, 22, 48, 0.92) 0%, rgba(10, 14, 35, 0.96) 100%)",
          backdropFilter: "blur(60px) saturate(180%)",
          WebkitBackdropFilter: "blur(60px) saturate(180%)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.20), inset -1px 0 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(56, 140, 255, 0.75), rgba(120, 80, 255, 0.75))",
              boxShadow: "0 4px 16px rgba(56, 140, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}>
            <Activity size={15} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-white font-semibold text-sm tracking-tight">PacketPath</p>
                <p className="text-white/40 text-xs">Occu-Med</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New Case CTA */}
        <div className="px-3 py-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/cases/new">
                  <button
                    data-testid="btn-new-case-collapsed"
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                    style={{
                      background: "linear-gradient(135deg, rgba(56, 140, 255, 0.8), rgba(100, 80, 255, 0.8))",
                      boxShadow: "0 2px 12px rgba(56, 140, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                    }}
                  >
                    <Plus size={16} className="text-white" />
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">New Case</TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/cases/new">
              <button
                data-testid="btn-new-case"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-white text-sm font-medium transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(56, 140, 255, 0.8), rgba(100, 80, 255, 0.8))",
                  boxShadow: "0 2px 12px rgba(56, 140, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <Plus size={15} />
                <span>New Case</span>
              </button>
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-1 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return <NavItem key={item.href} item={item} collapsed={collapsed} active={active} />;
          })}

          {user?.role === "admin" && (
            <div className="mt-2 pt-2 border-t border-white/[0.06] flex flex-col gap-1">
              {!collapsed && (
                <p className="text-white/25 text-xs font-semibold uppercase tracking-widest px-3 py-1">Security</p>
              )}
              {adminItems.map((item) => {
                const active = location.startsWith(item.href);
                return <NavItem key={item.href} item={item} collapsed={collapsed} active={active} />;
              })}
            </div>
          )}
        </nav>

        {/* PHI badge */}
        {!collapsed && (
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-2xl" style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.15)",
            boxShadow: "inset 0 1px 0 rgba(16, 185, 129, 0.05)",
          }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-emerald-300 text-xs font-medium">HIPAA Audit Active</p>
            </div>
            <p className="text-emerald-400/60 text-xs mt-0.5">All PHI access is logged</p>
          </div>
        )}

        {/* User footer */}
        <div className="px-3 pb-4 pt-2 border-t border-white/[0.06]">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  data-testid="btn-logout"
                  onClick={logout}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/8 transition-all"
                >
                  <LogOut size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(56, 140, 255, 0.7), rgba(120, 80, 255, 0.7))",
                  boxShadow: "0 2px 8px rgba(56, 140, 255, 0.2)",
                }}>
                <User size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-xs font-medium truncate">{user?.name}</p>
                <p className="text-white/40 text-xs truncate capitalize">{user?.role}</p>
              </div>
              <button
                data-testid="btn-logout"
                onClick={logout}
                className="text-white/30 hover:text-white/60 transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          data-testid="btn-collapse-sidebar"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border shadow flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-20"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto luminous-gradient" style={{ position: "relative" }}>
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
