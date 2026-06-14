import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, UserX, Trash2, User as UserIcon, Loader2,
  BadgeCheck, Search, Users, TrendingUp, ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type User = {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  role: string;
  approvalStatus: string;
};

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsersCount, setAllUsersCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  const fetchStats = async () => {
    try {
      const all = await api.getAllUsers();
      const pending = await api.getPendingUsers();
      setAllUsersCount(all.length);
      setPendingCount(pending.length);
      setStudentCount(all.filter((u: User) => u.role === "MURID").length);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = activeTab === "pending" ? await api.getPendingUsers() : await api.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const handleApprove = async (userId: number) => {
    try {
      await api.approveUser(userId);
      if (activeTab === "pending") {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        fetchUsers();
      }
      fetchStats();
    } catch (err) {
      alert("Gagal approve user");
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm("Yakin ingin menolak user ini?")) return;
    try {
      await api.rejectUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      fetchStats();
    } catch (err) {
      alert("Gagal reject user");
    }
  };

  const handleSetRole = async (userId: number, role: string) => {
    try {
      await api.setRole(userId, role);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert("Gagal mengubah role");
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`Yakin ingin menghapus pengguna @${username}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      fetchStats();
    } catch (err) {
      alert("Gagal menghapus pengguna");
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(filter.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Manajemen Platform</h2>
          <p className="text-xs text-muted-foreground font-medium">Kontrol Pengguna & Hak Akses</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pengguna"
          value={allUsersCount}
          icon={<Users className="size-5" />}
          color="text-primary/70 bg-primary/5"
        />
        <StatCard
          title="Menunggu"
          value={pendingCount}
          icon={<UserX className="size-5" />}
          color="text-amber-600/70 bg-amber-50"
        />
        <StatCard
          title="Murid Aktif"
          value={studentCount}
          icon={<TrendingUp className="size-5" />}
          color="text-sage/70 bg-sage/5"
        />
      </div>

      {/* User Management Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex p-1 bg-secondary rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "pending" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "all" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Semua User
            </button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Search className="size-4.5" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary/30" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 glass rounded-[32px] border border-dashed border-border/50">
            <UserIcon className="size-12 mx-auto text-muted-foreground/10 mb-4" />
            <h3 className="text-sm font-bold text-muted-foreground/30 italic">Tidak ada data user</h3>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((u, idx) => (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white p-4 rounded-xl border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-secondary flex items-center justify-center relative border border-black/5">
                      <UserIcon className="size-5 text-muted-foreground/30" />
                      {u.approvalStatus === "APPROVED" && (
                        <div className="absolute -top-1 -right-1 size-4 bg-sage rounded-full border border-white flex items-center justify-center shadow-sm">
                          <BadgeCheck className="size-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {u.fullName && (
                          <span className="font-bold text-sm text-foreground">{u.fullName}</span>
                        )}
                        <span className="text-xs font-medium text-muted-foreground">@{u.username}</span>
                        <Badge variant="secondary" className={`text-[9px] font-bold px-1.5 h-4 border-0 ${
                          u.role === "SUPERADMIN" ? "bg-indigo-50 text-indigo-400/80" :
                          u.role === "GURU" ? "bg-slate-100 text-slate-500" :
                          "bg-sage/10 text-sage/70"
                        }`}>
                          {u.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(u.id)}
                          className="bg-sage hover:bg-sage/90 text-white font-bold text-xs h-9 px-4 rounded-lg"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(u.id)}
                          className="text-destructive hover:bg-destructive/5 font-bold text-xs h-9 px-4 rounded-lg"
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                         <select
                            value={u.role}
                            onChange={(e) => handleSetRole(u.id, e.target.value)}
                            className="h-9 px-3 rounded-lg border border-border bg-white text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                          >
                            <option value="MURID">MURID</option>
                            <option value="GURU">GURU</option>
                            <option value="SUPERADMIN">ADMIN</option>
                          </select>
                         
                         {u.approvalStatus === "PENDING" && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(u.id)}
                              className="bg-sage hover:bg-sage/90 text-white font-bold text-xs h-9 px-4 rounded-lg"
                            >
                              Approve
                            </Button>
                         )}
                      </div>
                    )}

                    {/* Delete button always visible in "all" tab */}
                    {activeTab === "all" && u.role !== "SUPERADMIN" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(u.id, u.username)}
                        className="text-destructive hover:bg-destructive/5 size-9 rounded-lg"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string; value: number | string; icon: React.ReactNode; color: string;
}) {
  return (
    <Card className="border border-black/5 shadow-sm bg-white">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`size-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
