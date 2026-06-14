import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronLeft, ShieldCheck, UserCheck, UserX, Trash2, User as UserIcon, Loader2, BadgeCheck } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  beforeLoad: () => {
    const user = getStoredUser();
    if (typeof window !== "undefined" && (!user || user.role !== "SUPERADMIN")) {
      throw redirect({ to: "/" });
    }
  },
});

function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = activeTab === "pending" ? await api.getPendingUsers() : await api.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch (err) {
      alert("Gagal approve user");
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm("Yakin ingin menolak user ini?")) return;
    try {
      await api.rejectUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert("Gagal reject user");
    }
  };

  const handleSetRole = async (userId: number, role: string) => {
    try {
      await api.setRole(userId, role);
      fetchUsers();
    } catch (err) {
      alert("Gagal mengubah role");
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`Yakin ingin menghapus pengguna @${username}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert("Gagal menghapus pengguna");
    }
  };

  return (
    <main className="min-h-screen w-full px-5 sm:px-10 pb-20">
      <header className="max-w-5xl mx-auto pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
          <div className="size-8 rounded-full glass flex items-center justify-center shadow-soft">
            <ChevronLeft className="size-3.5" />
          </div>
          Dashboard
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-2xl bg-primary flex items-center justify-center shadow-soft text-white">
            <ShieldCheck className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">Admin Panel</span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-none">
              User <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-2 text-xs uppercase tracking-widest">Kontrol Akses Platform</p>
          </div>

          <div className="flex p-1 glass-strong rounded-xl shadow-soft border border-white/20">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "pending" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "all" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Semua User
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary/30" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 glass rounded-[32px] border border-dashed border-border/50">
            <UserIcon className="size-12 mx-auto text-muted-foreground/10 mb-4" />
            <h3 className="text-sm font-bold text-muted-foreground/30 italic">Tidak ada data user</h3>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {users.map((u, idx) => (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white/40 p-4 rounded-[20px] border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-white flex items-center justify-center relative shadow-sm border border-black/5">
                      <UserIcon className="size-6 text-foreground/10" />
                      {u.approvalStatus === "APPROVED" && (
                        <div className="absolute -top-1.5 -right-1.5 size-5 bg-sage rounded-full border-2 border-white flex items-center justify-center shadow-soft">
                          <BadgeCheck className="size-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {u.fullName && (
                          <span className="font-bold text-sm text-foreground leading-none">{u.fullName}</span>
                        )}
                        <span className="text-[11px] font-semibold text-muted-foreground">@{u.username}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.1em] ${
                          u.role === "SUPERADMIN" ? "bg-purple-100 text-purple-700" :
                          u.role === "GURU" ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-muted-foreground mt-1 leading-none">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {activeTab === "pending" ? (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl bg-sage text-white font-bold text-[10px] uppercase tracking-widest shadow-soft hover:brightness-105 active:scale-95 transition"
                        >
                          <UserCheck className="size-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(u.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl glass border border-destructive/20 text-destructive font-bold text-[10px] uppercase tracking-widest hover:bg-destructive/5 active:scale-95 transition"
                        >
                          <UserX className="size-3.5" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                         <div className="relative group">
                            <select
                              value={u.role}
                              onChange={(e) => handleSetRole(u.id, e.target.value)}
                              className="appearance-none h-9 pl-4 pr-9 rounded-xl glass border-none text-[11px] font-bold text-foreground focus:ring-2 focus:ring-primary/30 transition shadow-inner cursor-pointer hover:bg-blue-50/50"
                            >
                              <option value="MURID">MURID</option>
                              <option value="GURU">GURU</option>
                              <option value="SUPERADMIN">SUPERADMIN</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-blue-500 transition-colors">
                               <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                               </svg>
                            </div>
                         </div>
                         
                         {u.approvalStatus === "PENDING" && (
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="px-4 h-9 rounded-xl bg-sage text-white font-bold text-[10px] uppercase tracking-widest shadow-soft active:scale-95 transition"
                            >
                              Approve
                            </button>
                         )}
                      </div>
                    )}

                    {/* Delete button always visible in "all" tab */}
                    {activeTab === "all" && u.role !== "SUPERADMIN" && (
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl glass border border-destructive/20 text-destructive font-bold text-[10px] uppercase tracking-widest hover:bg-destructive/5 active:scale-95 transition"
                      >
                        <Trash2 className="size-3" />
                        Hapus
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
}
