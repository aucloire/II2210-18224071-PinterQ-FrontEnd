import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, FileText, ClipboardCheck, Loader2, BookOpen, Trophy, History, Sparkles, Award, RotateCcw } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlashcardCarousel } from "@/components/study";
import type { QuizQuestion } from "@/components/study";

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
  const [groupedMaterials, setGroupedMaterials] = useState<Record<number, { title: string; quizzes: any[]; flashcards: any[] }>>({});
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "study" | "history">("overview");

  useEffect(() => {
    if (!ready || !user || isNaN(catIdNum)) return;
    setLoading(true);
    const studentId = Number(user.userId);

    const fetchData = async () => {
      try {
        const [allCats, flashcardsData, quizzesData, historyData] = await Promise.all([
          api.getCategories(studentId),
          api.getFlashcards(catIdNum),
          api.getQuizzes(catIdNum),
          api.getQuizHistory(studentId)
        ]);

        const found = (Array.isArray(allCats) ? allCats : []).find((c: any) => c.id === catIdNum);
        setCategory(found || null);

        // Grouping logic
        const groups: Record<number, { title: string; quizzes: any[]; flashcards: any[] }> = {};
        
        const mappedQuizzes: QuizQuestion[] = (Array.isArray(quizzesData) ? quizzesData : []).map((q: any) => {
          const mId = q.material?.id;
          if (mId) {
            if (!groups[mId]) groups[mId] = { title: q.material.title, quizzes: [], flashcards: [] };
            groups[mId].quizzes.push(q);
          }
          return {
            id: q.id,
            question: q.question,
            options: [q.optionA, q.optionB, q.optionC, q.optionD],
            correctIndex: ["A", "B", "C", "D"].indexOf(q.correctAnswer),
            explanation: q.explanation,
            materialId: q.material?.id,
          };
        });

        (Array.isArray(flashcardsData) ? flashcardsData : []).forEach((f: any) => {
          const mId = f.material?.id;
          if (!mId) return;
          if (!groups[mId]) groups[mId] = { title: f.material.title, quizzes: [], flashcards: [] };
          groups[mId].flashcards.push(f);
        });

        setGroupedMaterials(groups);

        const materialIds = new Set(mappedQuizzes.map(q => q.materialId).filter(Boolean));
        setHistory((Array.isArray(historyData) ? historyData : []).filter((h: any) => materialIds.has(h.materialId)));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [catIdNum, ready, user]);

  const onGenerateAdaptive = async (difficulty: "HOTS" | "DASAR") => {
    if (!category) return;
    try {
      await api.generateAdaptive(catIdNum, difficulty);
      window.location.reload();
    } catch (err) {
      alert("Gagal generate kuis adaptif");
    }
  };

  if (!ready || !user) return null;

  return (
    <main className="min-h-screen w-full px-5 sm:px-10 pb-20">
      <header className="max-w-6xl mx-auto pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
          <div className="size-8 rounded-full glass flex items-center justify-center shadow-soft">
            <ChevronLeft className="size-3.5" />
          </div>
          Dashboard
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-2xl bg-primary flex items-center justify-center shadow-soft text-white">
            <BookOpen className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">
            {category?.name || "Self-Study"}
          </span>
        </div>
      </header>

      <section className="max-w-6xl mx-auto pt-10 pb-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-primary/30" />
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{category?.name || `Kategori #${catIdNum}`}</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 font-medium">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px]">Self-Study</Badge>
              </p>
            </motion.div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 glass-strong rounded-xl inline-flex mt-10 flex-wrap">
              {([
                { key: "overview", label: "Overview" },
                { key: "study", label: "Materi & Belajar" },
                { key: "history", label: "Riwayat Skor" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === key ? "bg-primary text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="max-w-6xl mx-auto pb-10">
        {activeTab === "overview" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Materi" value={Object.keys(groupedMaterials).length} icon={<BookOpen className="size-5" />} color="text-blue-600 bg-blue-50" />
              <StatCard title="Riwayat" value={history.length} icon={<History className="size-5" />} color="text-green-600 bg-green-50" />
              <div className="glass-strong rounded-2xl p-5 border border-primary/20 flex flex-col justify-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Target Berikutnya</p>
                 <Button onClick={() => onGenerateAdaptive("HOTS")} size="sm" className="bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase">Generate HOTS</Button>
              </div>
            </div>

            {/* Recent History */}
            {history.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <History className="size-5 text-green-600" /> Skor Terakhir
                </h2>
                <div className="space-y-3">
                  {history.slice(0, 3).map((h, i) => (
                    <div key={i} className="bg-white/40 p-4 rounded-2xl border border-black/5 flex items-center justify-between">
                       <span className="font-bold text-sm">Percobaan #{history.length - i}</span>
                       <span className="text-xl font-black text-primary">{Math.round(h.score)}%</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {activeTab === "study" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
            {Object.keys(groupedMaterials).length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-12 glass rounded-2xl text-center">Belum ada materi untuk kategori ini</p>
            ) : (
              <div className="space-y-14">
                {Object.entries(groupedMaterials).map(([mId, data]) => (
                  <div key={mId} className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-black/5"></div>
                      <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground shrink-0">{data.title}</h3>
                      <div className="h-px flex-1 bg-black/5"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-blue-600/60 flex items-center gap-2 px-1">
                          <ClipboardCheck className="size-3.5" /> Kuis
                        </h4>
                        <div className="grid gap-3">
                          {data.quizzes.map((q, i) => (
                            <Card key={q.id} className="border-0 shadow-soft bg-white/60 group hover:bg-white/80 transition-all">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                   <div className="flex items-start gap-3 flex-1">
                                      <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 text-[10px] font-black">
                                        Q{i + 1}
                                      </div>
                                      <p className="text-xs font-bold leading-relaxed line-clamp-2">{q.question}</p>
                                   </div>
                                   <Link
                                      to="/study/quiz/$id"
                                      params={{ id: String(mId) }}
                                      search={{ categoryId: catIdNum }}
                                      className="inline-flex items-center justify-center px-4 h-8 rounded-lg bg-primary text-white font-black text-[9px] uppercase tracking-widest shadow-soft opacity-0 group-hover:opacity-100 transition-opacity"
                                   >
                                      Kerjakan
                                   </Link>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-purple-600/60 flex items-center gap-2 px-1">
                          <FileText className="size-3.5" /> Flashcard
                        </h4>
                        {data.flashcards.length > 0 ? (
                          <div className="bg-white/40 p-6 rounded-[32px] border border-black/5 shadow-soft flex flex-col items-center justify-center text-center gap-4">
                             <div className="size-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <FileText className="size-8" />
                             </div>
                             <div>
                                <p className="font-bold text-sm">Flashcard Belajar</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{data.flashcards.length} kartu tersedia</p>
                             </div>
                             <Link
                                to="/study/flashcard/$id"
                                params={{ id: String(mId) }}
                                search={{ categoryId: catIdNum }}
                                className="mt-2 inline-flex items-center justify-center px-6 h-9 rounded-xl bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest shadow-soft hover:brightness-110 transition"
                             >
                                Buka Flashcard
                             </Link>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic px-1">Tidak ada flashcard.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "history" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold flex items-center gap-2">
                 <History className="size-6 text-green-600" /> Riwayat Lengkap
               </h2>
               <Badge className="bg-green-100 text-green-700 font-bold">{history.length} Upaya</Badge>
             </div>
             {history.length === 0 ? (
               <p className="text-sm text-muted-foreground italic py-12 text-center">Belum ada riwayat pengerjaan.</p>
             ) : (
               <div className="grid gap-4">
                 {history.map((h, i) => (
                   <div key={i} className="bg-white/50 p-6 rounded-3xl border border-black/5 flex items-center justify-between shadow-soft">
                      <div className="flex items-center gap-4">
                         <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <Award className="size-6 text-primary/40" />
                         </div>
                         <div>
                            <p className="font-bold text-base">Percobaan #{history.length - i}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                               {new Date(h.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                         </div>
                      </div>
                      <div className="text-4xl font-black text-primary">{Math.round(h.score)}%</div>
                   </div>
                 ))}
               </div>
             )}
          </motion.div>
        )}
      </section>
    </main>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string; value: number | string; icon: React.ReactNode; color: string;
}) {
  return (
    <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`size-12 rounded-2xl flex items-center justify-center shadow-sm ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
