"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  Bell,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Navigation2,
  Settings,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Live Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Navigation", href: "/dashboard", icon: Navigation2 },
  { label: "Queue Predictor", href: "/dashboard", icon: Activity },
];

const adminItems = [
  { label: "Admin Panel", href: "/admin", icon: ShieldCheck },
  { label: "User Management", href: "/admin", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { liveAlert } = useSocket();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-64 min-h-screen bg-[#0a0d16] border-r border-white/5 flex flex-col fixed left-0 top-0 z-30"
    >
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-tight">SmartVenue</p>
            <p className="text-violet-400 text-xs font-medium">AI Platform</p>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3 px-2">Dashboard</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} className={`sidebar-link ${isActive ? "active" : ""}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {user?.isAdmin && (
          <>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3 px-2 pt-5">Admin</p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.label} href={item.href} className={`sidebar-link ${isActive ? "active" : ""}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Alert indicator */}
      {liveAlert && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <Bell className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0 animate-bounce" />
          <p className="text-red-300 text-xs leading-relaxed line-clamp-2">{liveAlert}</p>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
          {user?.isAdmin && <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] px-1.5">Admin</Badge>}
        </div>
        <button
          onClick={logout}
          className="mt-1 sidebar-link w-full text-red-500/70 hover:text-red-400 hover:bg-red-950/30"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}
