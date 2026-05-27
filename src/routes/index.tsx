import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, LogOut, Layers, BookOpen, Wand2, Loader2, ShieldCheck, History } from "lucide-react";
import { FlashcardCarousel, QuizRunner } from "@/components/study";
import { GenerateModal, NewSubjectModal } from "@/components/modals";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Dashboard,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getStoredUser()) {
      throw redirect({ to: "/login" });
    }
  },
});

type Tab = "flashcards" | "quizzes";
type Subject = { id: number; name: string };

function Dashboard() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<number | null>(null);
  
  const [cards, setCards] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [tab, setTab] = useState<Tab>("flashcards");
  const [genOpen, setGenOpen] = useState(false);
  const [subjOpen, setSubjOpen] = useState(false);
  const [studyKey, setStudyKey] = useState(0); 

  useEffect(() => {
    const userId = Number(user?.userId);
    if (userId) {
      api.getCategories(userId).then((cats) => {
        setSubjects(cats);
        if (cats.length > 0 && !activeSubject) setActiveSubject(cats[0].id);
      }).catch(err => console.error(err));
    }
  }, [user]);

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
          materialId: q.material?.id
        }));
        setQuiz(mappedQuizzes);
      }).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [activeSubject, studyKey]);

  if (!ready || !user) return null;

  const activeSubj = subjects.find((s) => s.id === activeSubject) ?? subjects[0];

  return (
    <main className="min-h-screen w-full px-5 sm:px-10 pb-20">
      <header className="max-w-6xl mx-auto pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-primary flex items-center justify-center shadow-soft">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PinterQ</span>
        </div>
        
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link to="/history" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft">
            <History className="size-3.5" />
            <span className="hidden sm:inline">Riwayat</span>
          </Link>
          
          {user.role === "SUPERADMIN" && (
            <Link to="/admin" className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft text-primary">
              <ShieldCheck className="size-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-destructive/5 hover:text-destructive transition shadow-soft"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto pt-14 pb-10">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 text-[10px] font-black uppercase tracking-widest bg-white/40 border border-white/20"
        >
          <Wand2 className="size-3 text-primary" />
          Halo, {user.username} 👋
        </motion.div>
        <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
          Mau belajar apa <br /><span className="text-primary">hari ini?</span>
        </h1>
        <p className="mt-3 text-muted-foreground font-medium max-w-lg text-sm sm:text-base leading-relaxed">
          Pilih subjek, tempel catatanmu, dan biarkan AI meracik kuis adaptif untukmu.
        </p>
      </section>

      <section className="max-w-6xl mx-auto pb-4">
        <div className="flex items-end justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-oak leading-none">
            Mata Kuliah
          </span>
          {user.role !== "USER" && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setGenOpen(true)}
              disabled={subjects.length === 0}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-bold text-white shadow-glow bg-primary disabled:opacity-50"
            >
              <Sparkles className="size-3" />
              Generate
            </motion.button>
          )}
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
          <button
            onClick={() => setSubjOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold border-2 border-dashed border-oak/20 text-oak hover:bg-oak/5 transition-all"
          >
            <Plus className="size-4" />
          </button>
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
                cards.length > 0 ? <FlashcardCarousel cards={cards} /> : <div className="text-center py-20 glass rounded-[32px] border border-dashed border-border/50 text-muted-foreground text-sm font-medium italic">Belum ada flashcard. Silakan generate materi.</div>
              ) : (
                quiz.length > 0 ? (
                  <QuizRunner questions={quiz} onGenerateAdaptive={handleGenerateAdaptive} onComplete={handleSubmitScore} />
                ) : (
                  <div className="text-center py-20 glass rounded-[32px] border border-dashed border-border/50 text-muted-foreground text-sm font-medium italic">Belum ada kuis. Silakan generate materi.</div>
                )
              )}
            </motion.div>
          ) : (
            <div className="text-center py-32 glass rounded-[40px] border border-dashed border-border/50">
               <Plus className="size-12 mx-auto text-muted-foreground/10 mb-4" />
               <h3 className="text-lg font-bold text-muted-foreground/30">Pilih atau buat mata kuliah untuk memulai</h3>
            </div>
          )}
        </AnimatePresence>
      </section>

      <GenerateModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        subjects={subjects}
        defaultSubjectId={activeSubject ?? 0}
        onGenerate={async (id, text) => {
          await api.generateStudyMaterial(Number(user.userId), id, "Materi Baru", text);
          setStudyKey(k => k + 1);
          setTab("flashcards");
        }}
      />
      <NewSubjectModal open={subjOpen} onClose={() => setSubjOpen(false)} onCreate={addSubject} />
    </main>
  );
}
