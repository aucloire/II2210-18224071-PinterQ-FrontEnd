import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, UserX, Trash2, User as UserIcon, Loader2,
  BadgeCheck, Ban, Search, Users, TrendingUp
} from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type User = {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  role: string;
  approvalStatus: string;
};

export function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const pending = await api.getPendingUsers();
        setPendingUsers(Array.isArray(pending) ? pending : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const handleApprove = async (userId: number) => {
    try {
      await api.approveUser(userId);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (err) {
      alert("Gagal approve user");
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm("Yakin ingin menolak user ini?")) return;
    try {
      await api.rejectUser(userId);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (err) {
      alert("Gagal reject user");
    }
  };

  const pendingCount = pendingUsers.length;
  const totalUsers = pendingCount; // Full user count requires a separate endpoint

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats — 3 box side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pengguna"
          value={totalUsers}
          icon={<Users className="size-5" />}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Menunggu Persetujuan"
          value={pendingCount}
          icon={<UserX className="size-5" />}
          color="text-amber-600 bg-amber-50"
        />
        <StatCard
          title="Pertumbuhan Pengguna"
          value="+"
          icon={<TrendingUp className="size-5" />}
          color="text-green-600 bg-green-50"
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
                className="bg-white/60 p-4 rounded-2xl border border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-secondary flex items-center justify-center">
                    <UserIcon className="size-5 text-muted-foreground/30" />
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

      {pendingUsers.length === 0 && (
        <div className="text-center py-16 glass rounded-2xl border border-dashed">
          <UserCheck className="size-10 mx-auto text-muted-foreground/10 mb-3" />
          <h3 className="text-sm font-bold text-muted-foreground/30 italic">Tidak ada user menunggu persetujuan</h3>
          <p className="text-xs text-muted-foreground mt-1">Semua pendaftaran sudah ditangani</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string; value: number | string; icon: React.ReactNode; color: string;
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
        </div>
      </CardContent>
    </Card>
  );
}
