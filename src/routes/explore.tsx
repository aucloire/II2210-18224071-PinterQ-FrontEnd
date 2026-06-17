import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Layers, BookOpen, Loader2 } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { FlashcardCarousel, QuizRunner } from "@/components/study";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getStoredUser()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Jelajahi — PinterQ" },
      { name: "description", content: "Jelajahi materi dan kuis dari berbagai mata kuliah." },
    ],
  }),
});

type Tab = "flashcards" | "quizzes";
type Subject = { id: number; name: string };

function ExplorePage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<number | null>(null);
  const [cards, setCards] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [tab, setTab] = useState<Tab>("flashcards");
  const [studyKey, setStudyKey] = useState(0);

  useEffect(() => {
    api.getPublicCategories().then((cats) => {
      setSubjects(cats);
      if (cats.length > 0 && !activeSubject) setActiveSubject(cats[0].id);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (activeSubject) {
      setIsLoadingData(true);
      Promise.all([
        api.getFlashcards(activeSubject),
        api.getQuizzes(activeSubject)
      ]).then(([rawCards, rawQuizzes]) => {
        setCards(rawCards);
        const mappedQuizzes = rawQuizzes.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: [q.optionA, q.optionB, q.optionC, q.optionD],
          correctIndex: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer),
          explanation: q.explanation,
          materialId: q.materialId
        }));        setQuiz(mappedQuizzes);
      }).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [activeSubject, studyKey]);

  const handleSubmitScore = async (score: number) => {
    if (!user || quiz.length === 0) return;
    const materialId = (quiz[0] as any).materialId;
    if (!materialId) return;
    try {
      await api.submitQuizAttempt(Number(user.userId), materialId, score);
    } catch (err) {
      console.error("Gagal simpan skor:", err);
    }
  };

  const activeSubj = subjects.find((s) => s.id === activeSubject) ?? subjects[0];

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
            <Layers className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">Jelajahi</span>
        </div>
      </header>

      <section className="max-w-6xl mx-auto pt-14 pb-10">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 text-[10px] font-black uppercase tracking-widest bg-white/40 border border-white/20"
        >
          <span className="text-primary">Jelajahi</span> Materi & Kuis
        </motion.div>
        <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
          Mau belajar apa <br /><span className="text-primary">hari ini?</span>
        </h1>
        <p className="mt-3 text-muted-foreground font-medium max-w-lg text-sm sm:text-base leading-relaxed">
          Pilih mata kuliah, lalu kerjakan flashcard atau kuis yang sudah dibuat oleh Guru.
        </p>
      </section>

      <section className="max-w-6xl mx-auto pb-4">
        <div className="flex items-end justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-oak leading-none">
            Mata Kuliah
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {subjects.map((s) => {
            const active = s.id === activeSubject;
            return (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveSubject(s.id)}
                className={`shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold transition-all ${
                  active ? "bg-primary text-white shadow-soft" : "glass hover:bg-white/70 text-foreground"
                }`}
              >
                <span>{s.name}</span>
              </motion.button>
            );
          })}
          {subjects.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Belum ada mata kuliah tersedia.</p>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto pt-6">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-oak leading-none">
              Ruang Belajar
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1.5 tracking-tight">
              {activeSubj?.name || "Pilih Materi"}
            </h2>
          </div>

          {activeSubj && (
            <div className="p-1 glass-strong rounded-xl shadow-soft flex gap-1">
              {(["flashcards", "quizzes"] as Tab[]).map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative inline-flex items-center gap-2 px-5 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      active ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "flashcards" ? <Layers className="size-3.5" /> : <BookOpen className="size-3.5" />}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isLoadingData ? (
             <div className="flex justify-center items-center py-20">
               <Loader2 className="size-8 animate-spin text-primary/30" />
             </div>
          ) : activeSubj ? (
            <motion.div
              key={tab + "-" + activeSubject + "-" + studyKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "flashcards" ? (
                cards.length > 0 ? <FlashcardCarousel cards={cards} /> : <div className="text-center py-20 glass rounded-[32px] border border-dashed border-border/50 text-muted-foreground text-sm font-medium italic">Belum ada flashcard.</div>
              ) : (
                quiz.length > 0 ? (
                  <QuizRunner questions={quiz} onGenerateAdaptive={() => {}} onComplete={handleSubmitScore} />
                ) : (
                  <div className="text-center py-20 glass rounded-[32px] border border-dashed border-border/50 text-muted-foreground text-sm font-medium italic">Belum ada kuis.</div>
                )
              )}
            </motion.div>
          ) : (
            <div className="text-center py-32 glass rounded-[40px] border border-dashed border-border/50">
              <p className="text-lg font-bold text-muted-foreground/30">Belum ada mata kuliah untuk dieksplorasi</p>
            </div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
