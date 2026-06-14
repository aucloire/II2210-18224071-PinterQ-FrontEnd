import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
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

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shadow-soft text-white shrink-0">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Ruang Kelas</h2>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Kelola Pengajaran & Materi</p>
          </div>
        </div>

        <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-glow hover:brightness-105 active:scale-95 transition-all">
              <Plus className="size-4" />
              Buat Kelas Baru
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[32px] border-white/20 glass-strong">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Buat Kelas</DialogTitle>
              <DialogDescription className="text-sm font-medium">Berikan nama untuk kelas baru Anda.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Nama Kelas</label>
                <Input
                  placeholder="Contoh: Pemrograman Java Lanjut"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateClass()}
                  className="h-12 rounded-2xl border-black/5 bg-white/50 text-sm font-bold focus:ring-sage/20 transition-all"
                />
              </div>
              <Button 
                onClick={handleCreateClass} 
                disabled={!newClassName.trim() || creating}
                className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-soft"
              >
                {creating ? <Loader2 className="size-4 animate-spin" /> : "Buat Sekarang"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Cards */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sage">Daftar Kelas</span>
          <div className="h-px flex-1 bg-black/5"></div>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-24 glass rounded-[40px] border border-dashed border-border/50">
            <BookOpen className="size-16 mx-auto text-muted-foreground/10 mb-4" />
            <h3 className="text-base font-bold text-muted-foreground/40 italic">Belum ada kelas yang dibuat</h3>
            <p className="text-xs text-muted-foreground/30 mt-1">Klik tombol di atas untuk mulai mengajar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {classes.map((cls) => (
                <motion.div
                  key={cls.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-0 shadow-soft bg-white/60 hover:bg-white/80 transition-all rounded-[32px] overflow-hidden group">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-8">
                        <div className="size-14 rounded-2xl bg-sage/10 flex items-center justify-center text-sage">
                           <BookOpen className="size-7" />
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kode Kelas</p>
                           <p className="text-lg font-mono font-black text-primary">{cls.classCode}</p>
                        </div>
                      </div>

                      <h3 className="text-xl font-black tracking-tight mb-2 line-clamp-1">{cls.name}</h3>
                      
                      <div className="flex items-center gap-2 text-muted-foreground mb-10">
                        <UsersRound className="size-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">{cls.memberCount} Murid Bergabung</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          to="/class/teacher/$classId"
                          params={{ classId: cls.id.toString() }}
                          className="flex-1 inline-flex items-center justify-center px-6 h-11 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-soft hover:brightness-105 active:scale-95 transition"
                        >
                          Lihat Detail <ArrowRight className="size-3.5 ml-2" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="size-11 flex items-center justify-center rounded-xl glass border border-destructive/10 text-destructive hover:bg-destructive/5 transition"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
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
