import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, FolderOpen, LogOut, ChevronLeft, ChevronRight,
  Shield, Users, ClipboardList, AlertTriangle, PenTool, Mail,
  BarChart2, Webhook, Palette, FileSignature, FileText, ServerCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const WARN_BEFORE_MS = 5 * 60 * 1000;

const navItems = [
  { label: "Dashboard",   icon: LayoutDashboard, href: "/" },
  { label: "All Cases",   icon: FolderOpen,       href: "/cases" },
  { label: "E-Signatures",icon: PenTool,          href: "/esignatures" },
  { label: "Agreements",  icon: ClipboardList,    href: "/agreements" },
  { label: "Templates",   icon: FileSignature,    href: "/signature-templates" },
  { label: "Analytics",   icon: BarChart2,        href: "/analytics" },
];

const adminItems = [
  { label: "Admin",         icon: Shield,        href: "/admin" },
  { label: "Users",         icon: Users,         href: "/users" },
  { label: "Email Settings",icon: Mail,          href: "/email-settings" },
  { label: "Readiness",     icon: ServerCog,     href: "/readiness" },
  { label: "Branding",      icon: Palette,       href: "/branding" },
  { label: "Webhooks",      icon: Webhook,       href: "/webhooks" },
  { label: "Security",      icon: AlertTriangle, href: "/security" },
  { label: "Audit Log",     icon: ClipboardList, href: "/audit" },
];

function NavItem({ item, collapsed, active }: {
  item: { label: string; icon: React.ElementType; href: string };
  collapsed: boolean; active: boolean;
}) {
  const Icon = item.icon;
  const btn = (
    <Link href={item.href}>
      <button className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
        "nav-item",
        active && "active",
        collapsed && "justify-center px-2"
      )}>
        <Icon className={cn("shrink-0", active ? "text-sky-300 w-4 h-4" : "w-4 h-4")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    </Link>
  );
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right" className="glass-modal border-white/10 text-white/90 text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return btn;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showWarn, setShowWarn] = useState(false);
  const lastActivity = useRef(Date.now());
  const warnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resetTimers = useCallback(() => {
    lastActivity.current = Date.now();
    setShowWarn(false);
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    warnTimer.current = setTimeout(() => setShowWarn(true), SESSION_TIMEOUT_MS - WARN_BEFORE_MS);
    logoutTimer.current = setTimeout(() => logout(), SESSION_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    resetTimers();
    const events = ["mousedown","keydown","touchstart","scroll"];
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers));
      clearTimeout(warnTimer.current);
      clearTimeout(logoutTimer.current);
    };
  }, [resetTimers]);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex h-screen overflow-hidden atmo-bg">
      <motion.aside
        animate={{ width: collapsed ? 64 : 224 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="glass-sidebar flex flex-col shrink-0 overflow-hidden relative z-30"
      >
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]",
          collapsed && "justify-center px-2"
        )}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(56,160,255,0.9) 0%, rgba(99,50,220,0.85) 100%)",
              boxShadow: "0 0 16px rgba(56,160,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2)"
            }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white/90 leading-tight truncate">Occu-Med</p>
              <p className="text-[10px] text-white/35 leading-tight truncate">PacketPath</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {!collapsed && (
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-3 mb-2">Workspace</p>
          )}
          {navItems.map(item => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={location === item.href || (item.href !== "/" && location.startsWith(item.href))}
            />
          ))}

          {user?.role === "admin" && (
            <>
              <div className="my-3 border-t border-white/[0.06]" />
              {!collapsed && (
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-3 mb-2">Admin</p>
              )}
              {adminItems.map(item => (
                <NavItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={location.startsWith(item.href)}
                />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-white/[0.06] p-2 space-y-1">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
            collapsed && "justify-center px-2"
          )}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(56,160,255,0.7) 0%, rgba(99,50,220,0.7) 100%)",
                border: "1px solid rgba(255,255,255,0.15)"
              }}>
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white/80 truncate">{user?.name ?? user?.email}</p>
                <p className="text-[10px] text-white/35 capitalize truncate">{user?.role}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} className="text-white/25 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all text-xs gap-1.5"
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <><ChevronLeft className="w-3.5 h-3.5" /><span className="text-[10px]">Collapse</span></>
            }
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showWarn && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 glass-modal rounded-2xl p-4 max-w-sm z-50"
          >
            <p className="text-sm font-semibold text-amber-400 mb-1">Session expiring soon</p>
            <p className="text-xs text-white/50 mb-3">You'll be logged out in 5 minutes due to inactivity.</p>
            <button onClick={resetTimers} className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors">
              Stay logged in →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
