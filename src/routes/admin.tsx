import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronLeft, ShieldCheck, UserCheck, UserX, User as UserIcon, Loader2, BadgeCheck } from "lucide-react";
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

  return (
    <main className="min-h-screen w-full px-5 sm:px-8">
      <header className="max-w-5xl mx-auto pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all">
          <div className="size-8 rounded-full glass flex items-center justify-center shadow-soft">
            <ChevronLeft className="size-4" />
          </div>
          Dashboard
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-2xl bg-primary flex items-center justify-center shadow-soft text-white">
            <ShieldCheck className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground">Admin Panel</span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              User <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-2 text-sm">Verifikasi pendaftaran dan kelola hak akses platform.</p>
          </div>

          <div className="flex p-1 glass-strong rounded-2xl shadow-soft border border-white/20">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "pending" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "all" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Semua User
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-10 animate-spin text-primary/40" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 glass rounded-[40px] border border-dashed border-border/50">
            <UserIcon className="size-12 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-bold text-muted-foreground/40 italic">Tidak ada user {activeTab === "pending" ? "pending" : ""}</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {users.map((u, idx) => (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white/40 p-5 rounded-[28px] border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="size-14 rounded-2xl bg-white flex items-center justify-center relative shadow-sm border border-black/5">
                      <UserIcon className="size-7 text-foreground/20" />
                      {u.approvalStatus === "APPROVED" && (
                        <div className="absolute -top-1.5 -right-1.5 size-6 bg-sage rounded-full border-2 border-white flex items-center justify-center shadow-soft">
                          <BadgeCheck className="size-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-xl text-foreground">@{u.username}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.1em] ${
                          u.role === "SUPERADMIN" ? "bg-purple-100 text-purple-700" :
                          u.role === "GURU" ? "bg-blue-100 text-blue-700" : "bg-oak/10 text-oak"
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground mt-0.5">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {activeTab === "pending" ? (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 h-11 rounded-2xl bg-sage text-white font-bold text-sm shadow-soft hover:brightness-105 active:scale-95 transition"
                        >
                          <UserCheck className="size-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(u.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 h-11 rounded-2xl glass border border-destructive/20 text-destructive font-bold text-sm hover:bg-destructive/5 active:scale-95 transition"
                        >
                          <UserX className="size-4" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                         <div className="relative group">
                            <select
                              value={u.role}
                              onChange={(e) => handleSetRole(u.id, e.target.value)}
                              className="appearance-none h-11 pl-5 pr-10 rounded-2xl glass border-none text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/30 transition shadow-inner cursor-pointer hover:bg-blue-50/50"
                            >
                              <option value="USER">USER</option>
                              <option value="GURU">GURU</option>
                              <option value="SUPERADMIN">SUPERADMIN</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-blue-500 transition-colors">
                               <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                               </svg>
                            </div>
                         </div>
                         
                         {u.approvalStatus === "PENDING" && (
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="px-5 h-11 rounded-2xl bg-sage text-white font-bold text-sm shadow-soft active:scale-95 transition"
                            >
                              Approve
                            </button>
                         )}
                      </div>
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
