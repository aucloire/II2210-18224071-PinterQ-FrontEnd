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
    <div className="space-y-10">
      {/* Tab Switcher & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex p-1 bg-secondary rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("class")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "class" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ruang Kelas
          </button>
          <button
            onClick={() => setActiveTab("self")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "self" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Belajar Mandiri
          </button>
        </div>

        {activeTab === "class" ? (
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 px-6 rounded-xl">
                <Plus className="size-4 mr-2" /> Gabung Kelas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Gabung Kelas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4 text-center">
                <Input
                  placeholder="Kode Kelas"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleJoinClass()}
                  className="h-12 rounded-xl text-center font-mono text-lg font-bold tracking-widest"
                />
                <Button onClick={handleJoinClass} disabled={!joinCode.trim() || joining} className="w-full h-11 rounded-xl bg-primary text-white font-bold">
                  {joining ? <Loader2 className="size-4 animate-spin" /> : "Gabung Sekarang"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={createCatOpen} onOpenChange={setCreateCatOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-sage hover:bg-sage/90 text-white font-bold text-xs h-10 px-6 rounded-xl">
                <Plus className="size-4 mr-2" /> Kategori Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Tambah Kategori</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Nama materi (cth: Struktur Data)"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateCategory()}
                  className="h-12 rounded-xl"
                />
                <Button onClick={handleCreateCategory} disabled={!newCatName.trim() || creating} className="w-full h-11 rounded-xl bg-sage text-white font-bold">
                  {creating ? <Loader2 className="size-4 animate-spin" /> : "Tambah"}
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
                    <Card className="border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden bg-white">
                      <CardContent className="p-6">
                         <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-lg bg-sage/10 flex items-center justify-center text-sage">
                               <BookOpen className="size-5" />
                            </div>
                            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-secondary rounded uppercase tracking-wider">Aktif</span>
                         </div>

                        <h3 className="font-bold text-lg leading-tight mb-1">{cls.name}</h3>
                        
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-6">
                          <UsersRound className="size-3.5 text-sage" /> {cls.memberCount} Teman Belajar
                        </p>

                        <div className="flex items-center justify-between">
                           <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              KODE: <span className="text-primary font-mono">{cls.classCode}</span>
                           </div>
                           <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white group-hover:translate-x-1 transition-transform shadow-sm">
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
                    <Card className="border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-xl overflow-hidden bg-white">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-sage/10 flex items-center justify-center text-sage">
                            <Layers className="size-5" />
                          </div>
                          <h3 className="font-bold text-base group-hover:text-primary transition-colors">{cat.name}</h3>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
