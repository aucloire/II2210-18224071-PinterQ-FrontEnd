import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, ShieldCheck, UserCheck, Layers, History, User, TrendingUp, UserX, BookOpen, Search, Loader2, BadgeCheck, Ban, Trash2 } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
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

          <Link to="/history" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft">
            <History className="size-3.5" />
            <span className="hidden sm:inline">Riwayat</span>
          </Link>

          {normalizedRole(user.role) === "MURID" && (
            <Link to="/explore" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft text-primary">
              <Layers className="size-3.5" />
              <span className="hidden sm:inline">Jelajahi</span>
            </Link>
          )}

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
  return role === "USER" ? "MURID" : role;
}

/* ─── Role Dispatcher ─── */

function RoleBasedDashboard({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  if (!user) return null;
  const role = normalizedRole(user.role);

  if (role === "SUPERADMIN") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <AdminPanel />
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

/* ─── Admin Panel (merged from AdminDashboard.tsx) ─── */

type User = {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  role: string;
  approvalStatus: string;
};

function AdminPanel() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [pending, all] = await Promise.all([
          api.getPendingUsers(),
          api.getAllUsers(),
        ]);
        setPendingUsers(pending);
        setAllUsers(all);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleApprove = async (userId: number) => {
    try {
      await api.approveUser(userId);
      setAllUsers(allUsers.map(u => u.id === userId ? { ...u, approvalStatus: "APPROVED" } : u));
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (err) {
      alert("Gagal approve user");
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm("Yakin ingin menolak user ini?")) return;
    try {
      await api.rejectUser(userId);
      setAllUsers(allUsers.filter(u => u.id !== userId));
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (err) {
      alert("Gagal reject user");
    }
  };

  const handleSetRole = async (userId: number, role: string) => {
    try {
      await api.setRole(userId, role);
      setAllUsers(allUsers.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) {
      alert("Gagal mengubah role");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      await api.deleteUser(userId);
      setAllUsers(allUsers.filter(u => u.id !== userId));
    } catch (err) {
      alert("Gagal menghapus pengguna");
    }
  };

  const filteredAll = allUsers.filter(u =>
    u.username.toLowerCase().includes(filter.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(filter.toLowerCase())
  );

  const studentCount = allUsers.filter(u => u.role === "MURID").length;
  const teacherCount = allUsers.filter(u => u.role === "GURU").length;
  const pendingCount = pendingUsers.length;
  const totalUsers = allUsers.length;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <h1 className="text-2xl font-black flex items-center gap-2">
        <ShieldCheck className="size-6 text-primary" />
        Admin Dashboard
      </h1>

      {/* Stats — Side-by-Side 3 boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pengguna"
          value={totalUsers}
          icon={<UserCheck className="size-5" />}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Menunggu Persetujuan"
          value={pendingCount}
          icon={<UserX className="size-5" />}
          color="text-amber-600 bg-amber-50"
        />
        <StatCard
          title="Pertumbuhan Bulan Ini"
          value={studentCount}
          icon={<TrendingUp className="size-5" />}
          color="text-green-600 bg-green-50"
          subtitle="Murid baru"
        />
      </div>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <UserX className="size-5 text-amber-600" />
            User Menunggu Persetujuan ({pendingUsers.length})
          </h2>
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <motion.div key={user.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 p-4 rounded-2xl border border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-secondary flex items-center justify-center">
                    <User className="size-5 text-muted-foreground/30" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{user.fullName || user.username}</p>
                    <p className="text-xs text-muted-foreground">@{user.username} · {user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(user.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs">
                    <UserCheck className="size-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(user.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs">
                    <Ban className="size-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* All Users Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UserCheck className="size-5 text-blue-600" />
            Semua Pengguna
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari pengguna..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="pl-9 w-64 h-10 rounded-xl text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          {filteredAll.map(user => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 p-3 rounded-2xl border border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-secondary flex items-center justify-center">
                  <User className="size-4 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{user.fullName || user.username}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`
                  ${user.role === "SUPERADMIN" ? "bg-purple-100 text-purple-700" :
                    user.role === "GURU" ? "bg-blue-100 text-blue-700" :
                    "bg-green-100 text-green-700"}
                `}>
                  {user.role}
                </Badge>
                {user.approvalStatus === "APPROVED" && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">
                    <BadgeCheck className="size-3 mr-0.5" /> Verified
                  </Badge>
                )}
                {user.approvalStatus === "PENDING" && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px]">
                    Pending
                  </Badge>
                )}
                {user.role !== "SUPERADMIN" && (
                  <>
                    <select
                      value={user.role}
                      onChange={e => handleSetRole(user.id, e.target.value)}
                      className="h-8 px-2 rounded-lg text-xs border bg-white focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="MURID">Murid</option>
                      <option value="GURU">Guru</option>
                      <option value="SUPERADMIN">Admin</option>
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(user.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 size-8 p-0">
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }: {
  title: string; value: number; icon: React.ReactNode; color: string; subtitle?: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`size-12 rounded-2xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black">{value}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
