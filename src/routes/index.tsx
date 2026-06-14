import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogOut, ShieldCheck, UserCheck, Layers, History, User, BookOpen } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { Card, CardContent } from "@/components/ui/card";

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
          <Link to="/profile" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="avatar" className="size-4 rounded-full object-cover" />
            ) : (
              <User className="size-3.5" />
            )}
            <span className="hidden sm:inline">Profil</span>
          </Link>

          <Link to="/history" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft">
            <History className="size-3.5" />
            <span className="hidden sm:inline">Riwayat</span>
          </Link>

          {user.role === "MURID" && (
            <Link to="/explore" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft text-primary">
              <Layers className="size-3.5" />
              <span className="hidden sm:inline">Jelajahi</span>
            </Link>
          )}

          {user.role === "SUPERADMIN" && (
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

      {/* Role-Based Dashboard Content */}
      <section className="max-w-6xl mx-auto pt-12 pb-10">
        {user.role === "SUPERADMIN" && (
          <RoleBanner user={user} />
        )}
        {user.role === "MURID" && (
          <RoleBanner user={user} />
        )}
        {user.role === "GURU" && (
          <RoleBanner user={user} />
        )}
      </section>

      <section className="max-w-6xl mx-auto pb-10">
        <RoleBasedDashboard user={user} />
      </section>
    </main>
  );
}

function RoleBanner({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  if (!user) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-gradient-to-r border-0 shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full border-4 border-white shadow-soft flex items-center justify-center overflow-hidden"
              style={user.profileImageUrl ? { backgroundImage: `url(${user.profileImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "var(--color-secondary)" }}>
              {!user.profileImageUrl && <User className="size-8 text-muted-foreground/20" />}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Selamat datang, {user.fullName || user.username}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Role: <span className="font-bold">{user.role}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RoleBasedDashboard({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  if (!user) return null;

  if (user.role === "SUPERADMIN") {
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

  if (user.role === "GURU") {
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

  if (user.role === "MURID") {
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
