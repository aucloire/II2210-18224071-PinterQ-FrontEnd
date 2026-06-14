import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, ShieldCheck, UserCheck, Layers, History, User, TrendingUp, UserX, BookOpen, Search, Loader2, BadgeCheck, Ban, Trash2 } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  component: Dashboard,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getStoredUser()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "PinterQ — AI Study Assistant" },
      { name: "description", content: "Platform belajar adaptif berbasis AI." },
    ],
  }),
});

function Dashboard() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen w-full bg-[#FBF9F6]">
      {/* Header — Fixed with glass effect */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between glass-strong rounded-[28px] px-6 h-16 shadow-soft border border-white/20">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center shadow-soft">
              <BookOpen className="size-4.5 text-white" />
            </div>
            <span className="font-black tracking-tighter text-xl text-foreground">
              Pinter<span className="text-primary">Q</span>
            </span>
            <Badge variant="secondary" className="hidden sm:inline-flex bg-sage/10 text-sage border-0 font-black text-[9px] uppercase tracking-widest px-2.5 h-5 rounded-full">
              {normalizedRole(user.role)}
            </Badge>
          </div>

          <nav className="flex items-center gap-2">
            <NotificationDropdown userId={user.userId} />

            <Link to="/profile" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="avatar" className="size-4 rounded-full object-cover" />
              ) : (
                <User className="size-3.5" />
              )}
              <span className="hidden sm:inline">Profil</span>
            </Link>

            <button
              onClick={() => { logout(); navigate({ to: "/login" }); }}
              className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-destructive/5 hover:text-destructive transition shadow-soft"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline text-destructive">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-32 pb-24 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Natural Greeting */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Halo, {user.fullName?.split(' ')[0] || user.username}! 👋
            </h1>
            <p className="text-base text-muted-foreground mt-2 font-medium max-w-lg">
              {normalizedRole(user.role) === "SUPERADMIN" && "Selamat datang di pusat kendali PinterQ."}
              {normalizedRole(user.role) === "GURU" && "Siap untuk memberikan dampak positif hari ini?"}
              {normalizedRole(user.role) === "MURID" && "Ayo lanjutkan perjalanan belajarmu sekarang!"}
            </p>
          </motion.section>

          <RoleBasedDashboard user={user} />
        </div>
      </main>
    </div>
  );
}

function normalizedRole(role: string): string {
  return role === "USER" ? "MURID" : role;
}

/* ─── Role Dispatcher ─── */

function RoleBasedDashboard({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  if (!user) return null;
  const role = normalizedRole(user.role);

  if (role === "SUPERADMIN") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <AdminDashboard />
      </motion.div>
    );
  }

  if (role === "GURU") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <TeacherDashboard teacherId={Number(user.userId)} />
      </motion.div>
    );
  }

  if (role === "MURID") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <StudentDashboard studentId={Number(user.userId)} studentName={user.fullName || user.username} />
      </motion.div>
    );
  }

  return (
    <div className="text-center py-20 glass rounded-2xl">
      <p className="text-muted-foreground">Role tidak dikenal. Hubungi administrator.</p>
    </div>
  );
}


