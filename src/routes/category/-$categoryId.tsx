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
      const [allCats, flashcardsData, quizzesData, historyData] = await Promise.all([
        api.getCategories(studentId),
        api.getFlashcards(catIdNum),
        api.getQuizzes(catIdNum),
        api.getQuizHistory(studentId)
      ]);

      const found = (Array.isArray(allCats) ? allCats : []).find((c: any) => c.id === catIdNum);
      setCategory(found || null);

      const groups: Record<number, { id: number; title: string; quizzes: any[]; flashcards: any[]; bestScore?: number }> = {};
      
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

      setGroupedMaterials(groups);
      setHistory(Array.isArray(historyData) ? historyData : []);
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
    <div className="min-h-screen w-full bg-[#FBF9F6]">
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
                      <DialogContent className="sm:max-w-xl rounded-[40px] glass-strong border-white/20 p-8">
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

          {/* Adaptive Actions */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="p-8 rounded-[32px] bg-white border border-black/5 shadow-soft flex flex-col gap-6 group hover:border-primary/20 transition-all">
                <div className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Target className="size-7" />
                </div>
                <div>
                   <h3 className="text-xl font-black">Level Up: HOTS</h3>
                   <p className="text-sm text-muted-foreground mt-1 font-medium">Generate soal tantangan berpikir kritis dari materi terakhir.</p>
                </div>
                <Button onClick={() => onGenerateAdaptive("HOTS")} className="w-full h-12 rounded-xl bg-primary font-black uppercase tracking-widest">Generate HOTS</Button>
             </div>
             <div className="p-8 rounded-[32px] bg-sage/5 border border-sage/10 shadow-soft flex flex-col gap-6 group hover:border-sage/30 transition-all">
                <div className="size-14 rounded-2xl bg-sage/10 text-sage flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Zap className="size-7" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-sage">Fundamental</h3>
                   <p className="text-sm text-muted-foreground mt-1 font-medium">Perkuat konsep dasar jika kamu merasa masih kesulitan.</p>
                </div>
                <Button onClick={() => onGenerateAdaptive("DASAR")} variant="outline" className="w-full h-12 rounded-xl border-sage/20 text-sage font-black uppercase tracking-widest">Generate Dasar</Button>
             </div>
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
               <div className="grid gap-6">
                  {Object.entries(groupedMaterials).map(([mId, data]) => (
                    <Card key={mId} className="border-0 shadow-soft bg-white/40 rounded-[32px] overflow-hidden group hover:bg-white/60 transition-all">
                       <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                          <div className="flex items-center gap-6 flex-1">
                             <div className={`size-16 rounded-2xl flex items-center justify-center shadow-sm ${data.bestScore ? 'bg-sage/10 text-sage' : 'bg-primary/5 text-primary/30'}`}>
                                {data.bestScore ? <Award className="size-8" /> : <BookOpen className="size-8 opacity-20" />}
                             </div>
                             <div>
                                <h3 className="text-xl font-black">{data.title}</h3>
                                <div className="flex gap-4 mt-1">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{data.quizzes.length} Soal</span>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{data.flashcards.length} Flashcard</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4 w-full md:w-auto">
                             {data.bestScore !== undefined && (
                                <div className="text-right mr-4 hidden sm:block">
                                   <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Skor Terbaik</p>
                                   <p className="text-2xl font-black text-primary">{Math.round(data.bestScore)}%</p>
                                </div>
                             )}
                             <Link to="/study/flashcard/$id" params={{ id: String(mId) }} search={{ categoryId: catIdNum }} className="flex-1 md:flex-none h-11 px-6 rounded-xl border border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-primary/5 transition-all">Hafalkan</Link>
                             <Link to="/study/quiz/$id" params={{ id: String(mId) }} search={{ categoryId: catIdNum }} className="flex-1 md:flex-none h-11 px-8 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-glow flex items-center justify-center gap-2">Mulai <ArrowRight className="size-3.5" /></Link>
                          </div>
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
