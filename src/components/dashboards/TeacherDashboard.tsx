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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
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
    loadClasses();
  }, [teacherId]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await api.getTeacherClasses(teacherId);
      setClasses(Array.isArray(data) ? data : []);
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
    <div className="space-y-10">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Ruang Kelas</h2>
            <p className="text-xs text-muted-foreground font-medium">Kelola Pengajaran & Materi</p>
          </div>
        </div>

        <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 px-6 rounded-xl">
              <Plus className="size-4 mr-2" />
              Buat Kelas Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Buat Kelas</DialogTitle>
              <DialogDescription className="text-sm">Berikan nama untuk kelas baru Anda.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Contoh: Pemrograman Java"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateClass()}
                className="h-12 rounded-xl"
              />
              <Button 
                onClick={handleCreateClass} 
                disabled={!newClassName.trim() || creating}
                className="w-full h-11 rounded-xl bg-primary text-white font-bold"
              >
                {creating ? <Loader2 className="size-4 animate-spin" /> : "Buat Sekarang"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Cards */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daftar Kelas</span>
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
                  <Card className="border border-black/5 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="size-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage">
                           <BookOpen className="size-6" />
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kode</p>
                           <p className="text-base font-mono font-bold text-primary">{cls.classCode}</p>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold tracking-tight mb-1 line-clamp-1">{cls.name}</h3>
                      
                      <div className="flex items-center gap-2 text-muted-foreground mb-6">
                        <UsersRound className="size-3.5" />
                        <span className="text-xs font-medium">{cls.memberCount} Murid Bergabung</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to="/class/teacher/$classId"
                          params={{ classId: cls.id.toString() }}
                          className="flex-1 inline-flex items-center justify-center h-10 rounded-lg bg-primary text-white font-bold text-xs hover:brightness-105 active:scale-95 transition"
                        >
                          Buka Kelas
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClass(cls.id)}
                          className="size-10 rounded-lg text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="size-4" />
                        </Button>
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
