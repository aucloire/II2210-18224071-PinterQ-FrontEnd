import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, FileText, ClipboardCheck, Loader2, BookOpen, 
  History, Sparkles, Award, Plus, Trash2, Edit3, ArrowRight,
  Target, Zap, LayoutGrid
} from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";

export const Route = createFileRoute("/category/$categoryId")({
  component: CategoryDetailPage,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getStoredUser()) {
      throw redirect({ to: "/login" });
    }
  },
});

interface CategoryItem {
  id: number;
  name: string;
  userId: number;
}

interface QuizHistoryItem {
  id: number;
  materialId: number;
  score: number;
  createdAt: string;
}

function CategoryDetailPage() {
  const { user, ready } = useAuth();
  const { categoryId } = Route.useParams();
  const catIdNum = Number(categoryId);

  const [category, setCategory] = useState<CategoryItem | null>(null);
  const [groupedMaterials, setGroupedMaterials] = useState<Record<number, { id: number; title: string; quizzes: any[]; flashcards: any[]; bestScore?: number }>>({});
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Topic Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = async () => {
    if (!ready || !user || isNaN(catIdNum)) return;
    setLoading(true);
    const studentId = Number(user.userId);
    try {
      const [allCats, flashcardsData, quizzesData, historyData, materialsData] = await Promise.all([
        api.getCategories(studentId),
        api.getFlashcards(catIdNum),
        api.getQuizzes(catIdNum),
        api.getQuizHistory(studentId),
        api.getMaterials(catIdNum)
      ]);

      const found = (Array.isArray(allCats) ? allCats : []).find((c: any) => c.id === catIdNum);
      setCategory(found || null);

      const groups: Record<number, { id: number; title: string; quizzes: any[]; flashcards: any[]; bestScore?: number }> = {};
      
      // Initialize groups with materials
      (Array.isArray(materialsData) ? materialsData : []).forEach((m: any) => {
        groups[m.id] = { id: m.id, title: m.title, quizzes: [], flashcards: [] };
      });

      (Array.isArray(quizzesData) ? quizzesData : []).forEach((q: any) => {
        const mId = q.material?.id;
        if (!mId) return;
        if (!groups[mId]) groups[mId] = { id: mId, title: q.material.title, quizzes: [], flashcards: [] };
        groups[mId].quizzes.push(q);
      });

      (Array.isArray(flashcardsData) ? flashcardsData : []).forEach((f: any) => {
        const mId = f.material?.id;
        if (!mId) return;
        if (!groups[mId]) groups[mId] = { id: mId, title: f.material.title, quizzes: [], flashcards: [] };
        groups[mId].flashcards.push(f);
      });

      (Array.isArray(historyData) ? historyData : []).forEach((h: any) => {
        if (groups[h.materialId]) {
          if (!groups[h.materialId].bestScore || h.score > groups[h.materialId].bestScore!) {
            groups[h.materialId].bestScore = h.score;
          }
        }
      });

      const categoryMaterialIds = Object.keys(groups).map(Number);
      const categoryHistory = (Array.isArray(historyData) ? historyData : []).filter(h => 
        categoryMaterialIds.includes(h.materialId)
      );

      setGroupedMaterials(groups);
      setHistory(categoryHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [catIdNum, ready, user]);

  const handleAddTopic = async (ai: boolean) => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsCreating(true);
    try {
      if (ai) {
        await api.generateStudyMaterial(Number(user?.userId), catIdNum, newTitle, newContent);
      } else {
        await api.createMaterial(Number(user?.userId), catIdNum, newTitle, newContent);
      }
      setNewTitle("");
      setNewContent("");
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      alert("Gagal menambah topik");
    } finally {
      setIsCreating(false);
    }
  };

  const onGenerateAdaptive = async (difficulty: "HOTS" | "DASAR") => {
    try {
      await api.generateAdaptive(catIdNum, difficulty);
      fetchData();
    } catch (err) {
      alert("Gagal generate kuis adaptif");
    }
  };

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between glass-strong rounded-[24px] px-6 h-16 shadow-soft border border-white/20">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
            <ChevronLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2.5 text-sage">
            <Sparkles className="size-4" />
            <span className="font-black tracking-tight text-sm">{category?.name || "Self-Study"}</span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Header Section */}
          <section>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                <div className="space-y-4">
                  <Badge className="bg-sage/10 text-sage border-0 font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                    Belajar Mandiri
                  </Badge>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">{category?.name}</h1>
                  <p className="text-muted-foreground font-medium text-base">Kembangkan pemahamanmu secara mendalam.</p>
                </div>

                <div className="flex gap-3">
                   <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                      <DialogTrigger asChild>
                         <button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-glow hover:brightness-105 transition-all flex items-center gap-2">
                            <Plus className="size-5" /> Materi Baru
                         </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xl rounded-[40px] bg-background border-white/20 p-8 shadow-xl">
                         <DialogHeader>
                            <DialogTitle className="text-3xl font-black">Tambah Materi</DialogTitle>
                            <DialogDescription className="text-base font-medium">Tempelkan teks materi atau tulis sendiri untuk dipelajari.</DialogDescription>
                         </DialogHeader>
                         <div className="space-y-6 pt-6">
                            <Input placeholder="Judul Materi..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-12 rounded-xl" />
                            <Textarea placeholder="Isi materi..." value={newContent} onChange={e => setNewContent(e.target.value)} className="min-h-[150px] rounded-2xl" />
                            <div className="grid grid-cols-2 gap-4">
                               <Button variant="outline" onClick={() => handleAddTopic(false)} disabled={isCreating} className="h-12 rounded-xl font-black uppercase">Manual</Button>
                               <Button onClick={() => handleAddTopic(true)} disabled={isCreating} className="h-12 rounded-xl bg-primary font-black uppercase shadow-soft gap-2">
                                  {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} AI Generate
                               </Button>
                            </div>
                         </div>
                      </DialogContent>
                   </Dialog>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Topics List */}
          <section className="space-y-12">
            <div className="flex items-center gap-3">
              <LayoutGrid className="size-5 text-sage" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sage">Daftar Modul Belajar</span>
              <div className="h-px flex-1 bg-black/5"></div>
            </div>

            {loading ? (
               <div className="flex justify-center py-20"><Loader2 className="size-10 animate-spin text-primary/20" /></div>
            ) : Object.keys(groupedMaterials).length === 0 ? (
               <div className="text-center py-24 glass rounded-[40px] border border-dashed border-border/50 text-muted-foreground/30">
                  <p className="font-bold italic">Belum ada materi di kategori ini.</p>
               </div>
            ) : (
               <div className="grid gap-8">
                  {Object.entries(groupedMaterials).map(([mId, data]) => (
                    <Card key={mId} className="border-0 shadow-soft bg-background rounded-[40px] overflow-hidden group hover:bg-white transition-all">
                       <CardContent className="p-0">
                          <div className="p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                             <div className="flex items-center gap-8 flex-1">
                                <div className={`size-20 rounded-[32px] flex items-center justify-center shadow-sm ${data.bestScore ? 'bg-sage/10 text-sage' : 'bg-primary/5 text-primary/30'}`}>
                                   {data.bestScore ? <Award className="size-10" /> : <BookOpen className="size-10 opacity-20" />}
                                </div>
                                <div>
                                   <h3 className="text-2xl font-black tracking-tight">{data.title}</h3>
                                   <div className="flex gap-4 mt-2">
                                      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                         <ClipboardCheck className="size-4" /> {data.quizzes.length} Soal
                                      </span>
                                      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                         <FileText className="size-4" /> {data.flashcards.length} Flashcard
                                      </span>
                                   </div>
                                </div>
                             </div>

                             <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                {data.bestScore !== undefined && (
                                   <div className="text-center sm:text-right mr-4 px-6 border-r border-black/5 hidden sm:block">
                                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Skor Terbaik</p>
                                      <p className="text-3xl font-black text-primary">{Math.round(data.bestScore)}%</p>
                                   </div>
                                )}
                                <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
                                   <Link to="/study/flashcard/$id" params={{ id: String(mId) }} search={{ categoryId: catIdNum }} className="h-12 px-6 rounded-2xl border border-primary/10 text-primary font-black text-[11px] uppercase tracking-widest flex items-center justify-center hover:bg-primary/5 transition-all">Hafalkan</Link>
                                   <Link to="/study/quiz/$id" params={{ id: String(mId) }} search={{ categoryId: catIdNum }} className="h-12 px-8 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-glow flex items-center justify-center gap-2">Mulai Kuis <ArrowRight className="size-4" /></Link>
                                </div>
                             </div>
                          </div>

                          {/* Adaptive Logic Area — Only show if basic is done */}
                          {data.bestScore !== undefined && (
                             <div className="px-8 pb-8 pt-0 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-black/[0.03] mt-2">
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 py-4 hidden md:block">Tingkatkan Pemahaman:</div>
                                <Button 
                                  size="sm" 
                                  onClick={() => onGenerateAdaptive("HOTS")} 
                                  className="h-10 px-6 rounded-xl bg-sage/10 text-sage hover:bg-sage/20 border-0 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                                >
                                   <Target className="size-3.5" /> Level Up: HOTS
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => onGenerateAdaptive("DASAR")} 
                                  className="h-10 px-6 rounded-xl border-black/5 text-muted-foreground hover:bg-black/5 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                                >
                                   <Zap className="size-3.5" /> Re-Fundamental
                                </Button>
                             </div>
                          )}
                       </CardContent>
                    </Card>
                  ))}
               </div>
            )}
          </section>

          {/* History Footer */}
          {history.length > 0 && (
             <section className="pt-10 border-t border-black/5">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-lg font-black uppercase tracking-widest text-muted-foreground">Riwayat Terakhir</h2>
                   <History className="size-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {history.slice(0, 3).map((h, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white/30 border border-black/5 flex items-center justify-between">
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Percobaan #{history.length - i}</p>
                            <p className="text-xs font-bold truncate mt-0.5">Topik ID: {h.materialId}</p>
                         </div>
                         <span className="text-xl font-black text-primary">{Math.round(h.score)}%</span>
                      </div>
                   ))}
                </div>
             </section>
          )}

        </div>
      </main>
    </div>
  );
}
