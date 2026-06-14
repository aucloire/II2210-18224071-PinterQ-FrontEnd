import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Plus, BookOpen, FileText, Copy, Loader2, Sparkles, ArrowRight, Trophy, Eye, UsersRound
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { FlashcardCarousel, QuizRunner } from "@/components/study";
import type { QuizQuestion } from "@/components/study";

interface JoinedClass {
  id: number;
  name: string;
  classCode: string;
  memberCount: number;
  createdAt: string;
}

interface MaterialItem {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  category?: { id: number; name: string };
}

interface FlashcardItem {
  id: number;
  question: string;
  answer: string;
}

export function StudentDashboard({ studentId, studentName }: { studentId: number; studentName: string }) {
  // Classes section
  const [joinedClasses, setJoinedClasses] = useState<JoinedClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  // Self-Study section
  const [selfStudyCategories, setSelfStudyCategories] = useState<{ id: number; name: string }[]>([]);
  const [selfLoading, setSelfLoading] = useState(true);

  // Active study selection
  const [activeTab, setActiveTab] = useState<"class" | "self">("class");

  // Join class modal
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Self-study create modal
  const [createCatOpen, setCreateCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    loadJoinedClasses();
    loadSelfStudyCategories();
  }, [studentId]);

  const loadJoinedClasses = async () => {
    setClassesLoading(true);
    try {
      const data = await api.getStudentJoinedClasses(studentId);
      setJoinedClasses(data);
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setClassesLoading(false);
    }
  };

  const loadSelfStudyCategories = async () => {
    setSelfLoading(true);
    try {
      const cats = await api.getCategories(studentId);
      setSelfStudyCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setSelfLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await api.joinClass(studentId, joinCode.trim().toUpperCase());
      setJoinCode("");
      setJoinOpen(false);
      loadJoinedClasses();
    } catch (err: any) {
      alert(err.message || "Gagal bergabung ke kelas");
    } finally {
      setJoining(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreating(true);
    try {
      const newCat = await api.createCategory(studentId, newCatName.trim());
      setSelfStudyCategories(prev => [...prev, { id: newCat.id, name: newCat.name }]);
      setNewCatName("");
      setCreateCatOpen(false);
    } catch (err) {
      alert("Gagal membuat kategori self-study");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Tab Switcher & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex p-1 glass-strong rounded-[18px] shadow-soft border border-white/20 w-fit">
          <button
            onClick={() => setActiveTab("class")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "class" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ruang Kelas
          </button>
          <button
            onClick={() => setActiveTab("self")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "self" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Belajar Mandiri
          </button>
        </div>

        {activeTab === "class" ? (
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-soft hover:brightness-105 transition-all">
                <Plus className="size-4" /> Gabung Kelas
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm rounded-[32px] border-white/20 glass-strong">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-center">Gabung Kelas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4 text-center">
                <Input
                  placeholder="MASUKKAN KODE KELAS"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleJoinClass()}
                  className="h-14 rounded-2xl border-black/5 bg-white text-center font-mono text-xl font-black tracking-[0.3em] focus:ring-sage/20 uppercase"
                />
                <Button onClick={handleJoinClass} disabled={!joinCode.trim() || joining} className="w-full h-12 rounded-xl bg-primary font-black uppercase tracking-widest shadow-soft">
                  {joining ? <Loader2 className="size-4 animate-spin" /> : "GABUNG SEKARANG"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={createCatOpen} onOpenChange={setCreateCatOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-sage text-white font-black text-[10px] uppercase tracking-widest shadow-soft hover:brightness-105 transition-all">
                <Plus className="size-4" /> Kategori Baru
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm rounded-[32px] border-white/20 glass-strong">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Tambah Kategori</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Nama materi (cth: Struktur Data)"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateCategory()}
                  className="h-12 rounded-xl border-black/5 bg-white font-bold"
                />
                <Button onClick={handleCreateCategory} disabled={!newCatName.trim() || creating} className="w-full h-12 rounded-xl bg-sage text-white font-black uppercase tracking-widest">
                  {creating ? <Loader2 className="size-4 animate-spin" /> : "TAMBAH"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Classes Section */}
        {activeTab === "class" && (
          <motion.section
            key="classes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {classesLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="size-8 animate-spin text-primary/30" /></div>
            ) : joinedClasses.length === 0 ? (
              <div className="text-center py-24 glass rounded-[40px] border border-dashed border-border/50">
                <BookOpen className="size-16 mx-auto text-muted-foreground/10 mb-4" />
                <h3 className="text-base font-bold text-muted-foreground/40 italic">Belum ada kelas yang diikuti</h3>
                <p className="text-xs text-muted-foreground/30 mt-1">Gunakan kode dari gurumu untuk bergabung</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {joinedClasses.map(cls => (
                  <Link
                    key={cls.id}
                    to="/class/student/$classId"
                    params={{ classId: String(cls.id) }}
                    className="block group"
                  >
                    <Card className="border-0 shadow-soft bg-white/60 hover:bg-white/80 transition-all cursor-pointer rounded-[28px] overflow-hidden">
                      <CardContent className="p-7">
                         <div className="flex items-center justify-between mb-6">
                            <div className="size-12 rounded-2xl bg-sage/10 flex items-center justify-center text-sage group-hover:scale-110 transition-transform">
                               <BookOpen className="size-6" />
                            </div>
                            <span className="text-[10px] font-black bg-secondary/30 px-2 py-0.5 rounded-md uppercase tracking-widest text-primary">Aktif</span>
                         </div>

                        <h3 className="font-black text-xl leading-tight mb-2 group-hover:text-primary transition-colors">{cls.name}</h3>
                        
                        <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2 mb-8">
                          <UsersRound className="size-3.5 text-sage" /> {cls.memberCount} Teman Belajar
                        </p>

                        <div className="flex items-center justify-between">
                           <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                              Kode: <span className="text-primary font-mono">{cls.classCode}</span>
                           </div>
                           <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white shadow-soft group-hover:translate-x-1 transition-transform">
                              <ArrowRight className="size-4" />
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* Self-Study Section */}
        {activeTab === "self" && (
          <motion.section
            key="self"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {selfLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="size-8 animate-spin text-primary/30" /></div>
            ) : selfStudyCategories.length === 0 ? (
              <div className="text-center py-24 glass rounded-[40px] border border-dashed border-border/50">
                <Sparkles className="size-16 mx-auto text-muted-foreground/10 mb-4" />
                <p className="text-sm font-bold text-muted-foreground/40 italic">Mulai perjalanan belajar mandirimu</p>
                <p className="text-xs text-muted-foreground/30 mt-1">Buat kategori pertama untuk mengumpulkan materi</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selfStudyCategories.map(cat => (
                  <Link
                    key={cat.id}
                    to="/category/$categoryId"
                    params={{ categoryId: String(cat.id) }}
                    className="block group"
                  >
                    <Card className="border-0 shadow-soft bg-white/60 hover:bg-white/80 transition-all cursor-pointer rounded-[24px] overflow-hidden border-b-4 border-sage/20">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-sage/10 flex items-center justify-center text-sage">
                              <Layers className="size-5" />
                            </div>
                            <h3 className="font-black text-lg group-hover:text-primary transition-colors">{cat.name}</h3>
                          </div>
                          <div className="size-8 rounded-full glass flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                            <ArrowRight className="size-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
