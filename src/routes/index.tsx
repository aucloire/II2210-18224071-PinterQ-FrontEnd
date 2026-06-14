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
    <div className="min-h-screen w-full bg-white">
      {/* Header — Simple & Professional */}
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between max-w-6xl mx-auto border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
            <Sparkles className="size-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">PinterQ</span>
        </div>

        <nav className="flex items-center gap-3 sm:gap-6">
          <NotificationDropdown userId={user.userId} />

          <Link to="/profile" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="avatar" className="size-5 rounded-full object-cover" />
            ) : (
              <User className="size-5" />
            )}
            <span className="hidden sm:inline">Profil</span>
          </Link>

          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="flex items-center gap-2 text-sm font-semibold text-destructive hover:opacity-80 transition-opacity"
          >
            <LogOut className="size-5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="px-6 sm:px-10 py-12">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Greeting */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black tracking-tight">
              Halo, {user.fullName || user.username}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {normalizedRole(user.role) === "SUPERADMIN" && "Panel kontrol administrator sistem."}
              {normalizedRole(user.role) === "GURU" && "Kelola pengajaran dan kuis interaktif Anda."}
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
  
  // Extract numeric ID safely (handles "u_123" -> 123)
  const numericId = Number(user.userId.replace(/\D/g, '')) || 0;

  if (role === "SUPERADMIN") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <AdminDashboard />
      </motion.div>
    );
  }

  if (role === "GURU") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <TeacherDashboard teacherId={numericId} />
      </motion.div>
    );
  }

  if (role === "MURID") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <StudentDashboard studentId={numericId} studentName={user.fullName || user.username} />
      </motion.div>
    );
  }

  return (
    <div className="text-center py-20 glass rounded-2xl">
      <p className="text-muted-foreground">Role tidak dikenal. Hubungi administrator.</p>
    </div>
  );
}


