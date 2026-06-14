import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, BookOpen, Copy, Loader2, Trash2, UsersRound, Award, ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface ClassItem {
  id: number;
  name: string;
  classCode: string;
  memberCount: number;
  createdAt: string;
}

export function TeacherDashboard({ teacherId }: { teacherId: number }) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);
  const [classMembers, setClassMembers] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (!teacherId) return;
    loadClasses();
  }, [teacherId]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await api.getTeacherClasses(teacherId);
      setClasses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    setCreating(true);
    try {
      await api.createClass(newClassName.trim(), teacherId);
      setNewClassName("");
      setCreateClassOpen(false);
      loadClasses();
    } catch (err) {
      alert("Gagal membuat kelas");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (!confirm("Yakin ingin menghapus kelas ini?")) return;
    try {
      await api.deleteClass(classId);
      setClasses(classes.filter(c => c.id !== classId));
    } catch (err) {
      alert("Gagal menghapus kelas");
    }
  };

  const loadMembers = async (classId: number) => {
    if (classMembers[classId]) return;
    try {
      const members = await api.getClassMembers(classId);
      setClassMembers(prev => ({ ...prev, [classId]: members }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const totalStudents = Object.values(classMembers).flat().length;

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
        <StatCard title="Total Kelas" value={classes.length} icon={<BookOpen className="size-5" />} color="text-blue-600 bg-blue-50" />
        <StatCard title="Total Murid" value={totalStudents} icon={<UsersRound className="size-5" />} color="text-green-600 bg-green-50" />
        <StatCard title="Rata-rata Nilai" value="-" icon={<Award className="size-5" />} color="text-purple-600 bg-purple-50" />
      </div>

      {/* Kelas Saya Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="size-5 text-blue-600" />
          Kelas Saya
        </h2>
        <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white text-sm">
              <Plus className="size-4 mr-1.5" /> Buat Kelas Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Buat Kelas Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Nama kelas (cth. Informatika A)"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateClass()}
              />
              <Button onClick={handleCreateClass} disabled={!newClassName.trim() || creating} className="w-full">
                {creating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
                Buat Kelas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class List */}
      {classes.length === 0 && (
        <div className="text-center py-16 glass rounded-2xl border border-dashed">
          <BookOpen className="size-10 mx-auto text-muted-foreground/10 mb-3" />
          <h3 className="text-sm font-bold text-muted-foreground/30 italic">Belum ada kelas</h3>
          <p className="text-xs text-muted-foreground mt-1">Buat kelas pertama untuk mulai mengajar</p>
        </div>
      )}

      <div className="space-y-3">
        {classes.map(cls => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 p-4 rounded-2xl border border-black/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-base">{cls.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Kode Kelas: <code className="bg-secondary px-1.5 py-0.5 rounded font-mono text-xs">{cls.classCode}</code>
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleCopyCode(cls.classCode)}
                className="text-muted-foreground hover:text-foreground">
                <Copy className="size-3.5 mr-1" /> Copy Kode
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersRound className="size-4" />
                <span>{cls.memberCount} murid</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadMembers(cls.id)}
                  className="text-primary border-primary/30 hover:bg-primary/5 text-xs"
                >
                  Lihat Detail <ArrowRight className="size-3 ml-1" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteClass(cls.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Quick Members Preview */}
            {classMembers[cls.id]?.length > 0 && (
              <details className="text-xs mt-3">
                <summary className="cursor-pointer font-medium text-muted-foreground">Lihat murid ({classMembers[cls.id].length})</summary>
                <ul className="mt-1 space-y-1 pl-2 border-l-2 border-gray-200">
                  {classMembers[cls.id].map((m: any) => (
                    <li key={m.id} className="text-muted-foreground">
                      @{m.username} — {m.fullName || "-"}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </motion.div>
        ))}
      </div>
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
