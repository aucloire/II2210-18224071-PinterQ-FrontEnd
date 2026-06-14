import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ClipboardCheck, Loader2, BookOpen, Trophy, Award, Sparkles } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { QuizRunner } from "@/components/study";
import type { QuizQuestion } from "@/components/study";
import { z } from "zod";

const studySearchSchema = z.object({
  categoryId: z.number().optional(),
});

export const Route = createFileRoute("/study/quiz/$id")({
  validateSearch: studySearchSchema,
  component: StudyQuizPage,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getStoredUser()) {
      throw redirect({ to: "/login" });
    }
  },
});

function StudyQuizPage() {
  const { user, ready } = useAuth();
  const { id } = Route.useParams();
  const { categoryId } = Route.useSearch();
  const materialId = Number(id);

  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialTitle, setMaterialTitle] = useState("");
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    if (!ready || !user || isNaN(materialId)) return;
    setLoading(true);

    const loadQuizzes = async () => {
      try {
        // If we have categoryId, we fetch all quizzes for that category and filter by materialId
        if (categoryId) {
          const raw = await api.getQuizzes(categoryId);
          const filtered = (Array.isArray(raw) ? raw : []).filter((q: any) => q.material?.id === materialId);
          
          if (filtered.length > 0) {
            setMaterialTitle(filtered[0].material.title);
          }

          const mapped: QuizQuestion[] = filtered.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: [q.optionA, q.optionB, q.optionC, q.optionD],
            correctIndex: ["A", "B", "C", "D"].indexOf(q.correctAnswer),
            explanation: q.explanation,
            materialId: q.material?.id,
          }));
          setQuizzes(mapped);
        } else {
          // Fallback if no categoryId (less efficient, but handles direct links if we add an API later)
          console.error("No categoryId provided for quiz study");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [materialId, categoryId, ready, user]);

  const handleComplete = async (score: number) => {
    setFinalScore(score);
    setCompleted(true);
    if (!user) return;
    try {
      await api.submitQuizAttempt(Number(user.userId), materialId, score);
    } catch (err) {
      console.error("Gagal simpan skor:", err);
    }
  };

  if (!ready || !user) return null;

  return (
    <main className="min-h-screen w-full px-5 sm:px-10 pb-20">
      <header className="max-w-3xl mx-auto pt-8 flex items-center justify-between">
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
        >
          <div className="size-8 rounded-full glass flex items-center justify-center shadow-soft">
            <ChevronLeft className="size-3.5" />
          </div>
          Kembali
        </button>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-2xl bg-primary flex items-center justify-center shadow-soft text-white">
            <ClipboardCheck className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">
            Kuis Materi
          </span>
        </div>
      </header>

      <section className="max-w-3xl mx-auto pt-12">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-primary/30" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20 glass rounded-[32px] border border-dashed border-border/50">
            <ClipboardCheck className="size-12 mx-auto text-muted-foreground/10 mb-4" />
            <h3 className="text-sm font-bold text-muted-foreground/30 italic">Tidak ada soal ditemukan untuk materi ini.</h3>
          </div>
        ) : !completed ? (
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{materialTitle}</h1>
              <p className="text-xs text-muted-foreground mt-2 font-black uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" /> {quizzes.length} Pertanyaan
              </p>
            </motion.div>

            <div className="glass-strong rounded-[40px] p-6 sm:p-10 border border-white/20 shadow-soft">
              <QuizRunner
                questions={quizzes}
                onGenerateAdaptive={() => {}}
                onComplete={handleComplete}
              />
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 glass-strong rounded-[40px] border border-primary/20 shadow-glow"
          >
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Trophy className="size-10 text-primary" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Kuis Selesai!</h2>
            <p className="text-muted-foreground font-medium mb-8">Hasil pengerjaan kamu telah disimpan.</p>
            
            <div className="inline-block px-10 py-6 bg-white/50 rounded-3xl border border-black/5 mb-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Skor Akhir</p>
              <p className="text-6xl font-black text-primary">{Math.round(finalScore)}%</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-6">
              <Button onClick={() => window.history.back()} className="w-full sm:w-auto h-12 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white">
                Kembali ke Kelas
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full sm:w-auto h-12 px-8 rounded-2xl font-bold border-primary/20 text-primary hover:bg-primary/5">
                Coba Lagi
              </Button>
            </div>
          </motion.div>
        )}
      </section>
    </main>
  );
}
