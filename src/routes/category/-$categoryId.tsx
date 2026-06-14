import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, FileText, ClipboardCheck, Loader2, BookOpen, Trophy, History, Sparkles, Eye, RotateCcw } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlashcardCarousel, QuizRunner } from "@/components/study";
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
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "quizzes" | "flashcards" | "history">("overview");
  const [activeQuizIndex, setActiveQuizIndex] = useState<number | null>(null);
  const [studyKey, setStudyKey] = useState(0);

  useEffect(() => {
    if (!ready || !user || isNaN(catIdNum)) return;
    setLoading(true);
    const studentId = Number(user.userId);

    const loadCategory = async () => {
      try {
        const all = await api.getCategories(studentId);
        const found = (Array.isArray(all) ? all : []).find((c: any) => c.id === catIdNum);
        setCategory(found || null);
      } catch { setCategory(null); }
    };

    const loadFlashcards = async () => {
      try {
        const data = await api.getFlashcards(catIdNum);
        setFlashcards(Array.isArray(data) ? data : []);
      } catch { setFlashcards([]); }
    };

    const loadQuizzes = async () => {
      try {
        const raw = await api.getQuizzes(catIdNum);
        const mapped: QuizQuestion[] = (Array.isArray(raw) ? raw : []).map((q: any) => ({
          id: q.id,
          question: q.question,
          options: [q.optionA, q.optionB, q.optionC, q.optionD],
          correctIndex: ["A", "B", "C", "D"].indexOf(q.correctAnswer),
          explanation: q.explanation,
          materialId: q.material?.id,
        }));
        setQuizzes(mapped);
      } catch { setQuizzes([]); }
    };

    const loadHistory = async () => {
      try {
        const data = await api.getQuizHistory(studentId);
        // Filter: only history for this category's materials
        const materialIds = new Set(quizzes.map(q => q.materialId).filter(Boolean));
        const filtered = (Array.isArray(data) ? data : []).filter((h: any) =>
          materialIds.has(h.materialId)
        );
        setHistory(filtered);
      } catch { setHistory([]); }
    };

    Promise.all([loadCategory(), loadFlashcards(), loadQuizzes()])
      .then(() => loadHistory())
      .finally(() => setLoading(false));
  }, [catIdNum, ready, user]);

  // Reload history when quizzes change (new quiz loaded)
  useEffect(() => {
    if (!user || history.length === 0) return;
    const studentId = Number(user.userId);
    api.getQuizHistory(studentId)
      .then((data) => {
        const materialIds = new Set(quizzes.map(q => q.materialId).filter(Boolean));
        const filtered = (Array.isArray(data) ? data : []).filter((h: any) =>
          materialIds.has(h.materialId)
        );
        setHistory(filtered);
      })
      .catch(() => {});
  }, [quizzes]);

  const handleQuizComplete = async (score: number) => {
    if (!user || activeQuizIndex === null) return;
    const q = quizzes[activeQuizIndex];
    if (!q?.materialId) return;
    try {
      await api.submitQuizAttempt(Number(user.userId), q.materialId, score);
      setStudyKey(k => k + 1); // refresh history
    } catch (err) {
      console.error("Gagal simpan skor:", err);
    }
  };

  const onGenerateAdaptive = async (difficulty: "HOTS" | "DASAR") => {
    if (!category) return;
    try {
      await api.generateAdaptive(catIdNum, difficulty);
      // Reload flashcards and quizzes after generation
      const [rawCards, rawQuizzes] = await Promise.all([
        api.getFlashcards(catIdNum),
        api.getQuizzes(catIdNum),
      ]);
      setFlashcards(rawCards);
      const mapped: QuizQuestion[] = (Array.isArray(rawQuizzes) ? rawQuizzes : []).map((q: any) => ({
        id: q.id,
        question: q.question,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
        correctIndex: ["A", "B", "C", "D"].indexOf(q.correctAnswer),
        explanation: q.explanation,
        materialId: q.material?.id,
      }));
      setQuizzes(mapped);
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
            {category?.name || "Detail Kategori"}
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
              <p className="text-sm text-muted-foreground mt-1">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px]">Self-Study</Badge>
              </p>
            </motion.div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 glass-strong rounded-xl inline-flex mt-8 flex-wrap">
              {([
                { key: "overview", label: "Overview" },
                { key: "quizzes", label: "Kuis" },
                { key: "flashcards", label: "Flashcard" },
                { key: "history", label: "Riwayat" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setActiveQuizIndex(null); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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
        {/* === OVERVIEW === */}
        {activeTab === "overview" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Kuis" value={quizzes.length} icon={<ClipboardCheck className="size-5" />} color="text-blue-600 bg-blue-50" />
              <StatCard title="Flashcard" value={flashcards.length} icon={<FileText className="size-5" />} color="text-purple-600 bg-purple-50" />
              <StatCard title="Riwayat Pengerjaan" value={history.length} icon={<History className="size-5" />} color="text-green-600 bg-green-50" />
            </div>

            {/* Quick Kuis Preview */}
            {quizzes.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <ClipboardCheck className="size-5 text-blue-600" /> Kuis Terbaru
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quizzes.slice(0, 4).map((q, i) => (
                    <Card key={q.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setActiveTab("quizzes"); setActiveQuizIndex(i); }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-sm">Kuis {i + 1}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{q.question}</p>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">Kuis</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Flashcard Preview */}
            {flashcards.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <FileText className="size-5 text-purple-600" /> Flashcard
                </h2>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <FlashcardCarousel cards={flashcards} />
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}

        {/* === QUIZZES === */}
        {activeTab === "quizzes" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {quizzes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada kuis di kategori ini</p>
            ) : (
              <div className="space-y-3">
                {quizzes.map((q, i) => (
                  <Card key={q.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm">Kuis {i + 1}</h3>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                              HOTS
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{q.question}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setActiveQuizIndex(i)} className="bg-primary hover:bg-primary/90 text-xs">
                            <Eye className="size-3.5 mr-1" /> Kerjakan
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Active Quiz Runner */}
            {activeQuizIndex !== null && quizzes[activeQuizIndex] && (
              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Kuis {activeQuizIndex + 1}</h3>
                  <Button variant="ghost" size="sm" onClick={() => { setActiveQuizIndex(null); }} className="text-muted-foreground text-xs">
                    Tutup
                  </Button>
                </div>
                <QuizRunner
                  questions={[quizzes[activeQuizIndex]]}
                  onGenerateAdaptive={onGenerateAdaptive}
                  onComplete={handleQuizComplete}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* === FLASHCARDS === */}
        {activeTab === "flashcards" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="size-5 text-purple-600" /> Flashcard
              </h2>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">{flashcards.length} kartu</Badge>
            </div>
            {flashcards.length > 0 ? (
              <FlashcardCarousel cards={flashcards} />
            ) : (
              <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada flashcard di kategori ini</p>
            )}
          </motion.div>
        )}

        {/* === HISTORY === */}
        {activeTab === "history" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <History className="size-5 text-green-600" /> Riwayat Pengerjaan
              </h2>
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">{history.length} upaya</Badge>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada riwayat pengerjaan</p>
            ) : (
              <div className="space-y-2">
                {history.map((h: any, idx: number) => (
                  <div key={h.id || idx} className="bg-white/60 p-4 rounded-2xl border border-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-secondary flex items-center justify-center">
                        <History className="size-5 text-muted-foreground/30" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          Kuis #{history.indexOf(h) + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.createdAt).toLocaleString("id-ID", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-2xl font-black ${
                      h.score >= 80 ? "text-green-600" : h.score >= 50 ? "text-amber-600" : "text-red-500"
                    }`}>
                      {h.score}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HOTS Section */}
            <div className="glass-strong rounded-2xl p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-5 text-amber-500" />
                <h3 className="font-bold">Latihan Adaptif (HOTS / DASAR)</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Dapatkan kuis dengan tingkat kesulitan yang disesuaikan berdasarkan hasil kuis terakhir kamu.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => onGenerateAdaptive("HOTS")}
                  className="text-sm"
                  style={{ backgroundColor: "var(--color-blush)" }}
                >
                  <Sparkles className="size-4 mr-1.5" /> Generate Level Analisis (HOTS)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onGenerateAdaptive("DASAR")}
                  style={{ borderColor: "var(--color-sage)", color: "var(--color-oak)" }}
                >
                  <RotateCcw className="size-4 mr-1.5" /> Generate Konsep Dasar
                </Button>
              </div>
            </div>
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
