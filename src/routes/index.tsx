import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogOut, ShieldCheck, UserCheck, User, BookOpen, Bell } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { NotificationDropdown } from "@/components/NotificationDropdown";

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
    <main className="min-h-screen w-full px-5 sm:px-10 pb-20">
      {/* Header */}
      <header className="max-w-6xl mx-auto pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-primary flex items-center justify-center shadow-soft">
            <BookOpen className="size-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PinterQ</span>
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded-lg">
            {user.role}
          </span>
        </div>

        <nav className="flex items-center gap-2 sm:gap-3">
          {/* Notification Bell */}
          <NotificationDropdown userId={user.userId} />

          <Link to="/profile" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="avatar" className="size-4 rounded-full object-cover" />
            ) : (
              <User className="size-3.5" />
            )}
            <span className="hidden sm:inline">Profil</span>
          </Link>

          {normalizedRole(user.role) === "SUPERADMIN" && (
            <Link to="/admin" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft text-primary">
              <ShieldCheck className="size-3.5" />
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>
          )}

          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-destructive/5 hover:text-destructive transition shadow-soft"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </header>

      {/* Natural Greeting — no box */}
      <section className="max-w-6xl mx-auto pt-12 pb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Halo, {user.fullName || user.username}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {normalizedRole(user.role) === "SUPERADMIN" && "Kelola pengguna dan setelan platform."}
            {normalizedRole(user.role) === "GURU" && "Kelola kelas dan materi ajar kamu."}
            {normalizedRole(user.role) === "MURID" && "Mau belajar apa hari ini?"}
          </p>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto pb-10">
        <RoleBasedDashboard user={user} />
      </section>
    </main>
  );
}

function normalizedRole(role: string): string {
  // "USER" from login stub should be treated as "MURID"
  return role === "USER" ? "MURID" : role;
}

function RoleBasedDashboard({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  if (!user) return null;
  const role = normalizedRole(user.role);

  if (role === "SUPERADMIN") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          Admin Dashboard
        </h1>
        <AdminDashboard />
      </motion.div>
    );
  }

  if (role === "GURU") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          <UserCheck className="size-6 text-primary" />
          Guru Dashboard
        </h1>
        <TeacherDashboard teacherId={Number(user.userId)} />
      </motion.div>
    );
  }

  if (role === "MURID") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          Murid Dashboard
        </h1>
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
