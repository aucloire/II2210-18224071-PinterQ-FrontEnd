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
    <main className="min-h-screen w-full bg-[#f8f9fa]">
      <header className="max-w-5xl mx-auto px-5 pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition">
          <ChevronLeft className="size-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#e07a5f]" />
          <span className="font-bold tracking-tight">PinterQ Admin</span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-5 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[#3d405b] shadow-soft flex items-center justify-center">
              <ShieldCheck className="size-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#3d405b]">User Management</h1>
              <p className="text-muted-foreground font-medium">Approve registrasi dan kelola role pengguna.</p>
            </div>
          </div>

          <div className="flex p-1 bg-white rounded-2xl shadow-soft border border-black/5">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "pending" ? "bg-[#e07a5f] text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "all" ? "bg-[#e07a5f] text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              Semua User
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="size-10 animate-spin text-[#e07a5f]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[40px] shadow-soft border border-dashed border-gray-200">
            <UserIcon className="size-16 mx-auto text-gray-200 mb-6" />
            <h3 className="text-xl font-bold text-gray-400">Tidak ada user {activeTab === "pending" ? "pending" : ""}</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {users.map((u) => (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-6 rounded-[32px] shadow-soft border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-5">
                    <div className="size-14 rounded-2xl bg-[#f4f1de] flex items-center justify-center relative">
                      <UserIcon className="size-7 text-[#3d405b]" />
                      {u.approvalStatus === "APPROVED" && (
                        <div className="absolute -top-1 -right-1 size-5 bg-[#81b29a] rounded-full border-2 border-white flex items-center justify-center">
                          <BadgeCheck className="size-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-[#3d405b]">@{u.username}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          u.role === "SUPERADMIN" ? "bg-purple-100 text-purple-700" :
                          u.role === "GURU" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {activeTab === "pending" ? (
                      <>
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 h-11 rounded-2xl bg-[#81b29a] text-white font-bold text-sm shadow-soft hover:brightness-105 transition"
                        >
                          <UserCheck className="size-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(u.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 h-11 rounded-2xl bg-white border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition"
                        >
                          <UserX className="size-4" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                         <select
                           value={u.role}
                           onChange={(e) => handleSetRole(u.id, e.target.value)}
                           className="h-11 px-4 rounded-2xl bg-[#f4f1de] border-none text-sm font-bold text-[#3d405b] focus:ring-2 focus:ring-[#e07a5f] transition"
                         >
                           <option value="USER">USER</option>
                           <option value="GURU">GURU</option>
                           <option value="SUPERADMIN">SUPERADMIN</option>
                         </select>
                         {u.approvalStatus === "PENDING" && (
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="px-4 h-11 rounded-2xl bg-[#81b29a] text-white font-bold text-sm"
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
