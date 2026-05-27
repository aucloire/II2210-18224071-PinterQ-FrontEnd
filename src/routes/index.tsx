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
  head: () => ({
    meta: [
      { title: "PinterQ — AI Study Assistant" },
      { name: "description", content: "Platform belajar adaptif berbasis AI." },
    ],
  }),
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

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  const addSubject = async (name: string, emoji: string) => {
    try {
      const userId = Number(user?.userId);
      const fullName = `${emoji} ${name}`; 
      const newCat = await api.createCategory(userId, fullName);
      setSubjects([...subjects, { id: newCat.id, name: newCat.name }]);
      setActiveSubject(newCat.id);
    } catch (err) {
      alert("Gagal menambahkan mata kuliah.");
    }
  };

  const handleGenerate = async (subjectId: number, text: string) => {
    try {
      const userId = Number(user?.userId);
      await api.generateStudyMaterial(userId, subjectId, "Materi Baru", text);
      setActiveSubject(subjectId);
      setStudyKey((k) => k + 1); 
      setTab("flashcards");
    } catch (err) {
      alert("Gagal mengenerate materi.");
      throw err; 
    }
  };

  const handleGenerateAdaptive = async (difficulty: "HOTS" | "DASAR") => {
    if (!activeSubject) return;
    setIsLoadingData(true);
    try {
      await api.generateAdaptive(activeSubject, difficulty);
      setStudyKey((k) => k + 1);
      setTab("quizzes");
    } catch (err) {
      alert("Gagal mengenerate kuis adaptif.");
    } finally {
      setIsLoadingData(false);
    }
  };

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

  if (!ready || !user) return null;

  const activeSubj = subjects.find((s) => s.id === activeSubject) ?? subjects[0];

  return (
    <main className="min-h-screen w-full px-5 sm:px-8">
      <header className="max-w-6xl mx-auto pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-primary flex items-center justify-center shadow-soft">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PinterQ</span>
        </div>
        
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link to="/history" className="inline-flex items-center gap-2 px-4 h-10 rounded-full glass text-sm font-bold hover:bg-white/70 transition shadow-soft">
            <History className="size-4" />
            <span className="hidden sm:inline">Riwayat Belajar</span>
          </Link>
          
          {user.role === "SUPERADMIN" && (
            <Link to="/admin" className="inline-flex items-center gap-2 px-4 h-10 rounded-full glass text-sm font-bold hover:bg-white/70 transition shadow-soft text-primary">
              <ShieldCheck className="size-4" />
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>
          )}
          
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full glass text-sm font-bold hover:bg-destructive/5 hover:text-destructive transition shadow-soft"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 text-[11px] font-black uppercase tracking-widest bg-white/40 border border-white/20"
        >
          <Wand2 className="size-3.5 text-primary" />
          Halo, {user.username} 👋
        </motion.div>
        <h1 className="text-4xl sm:text-6xl font-black leading-[0.95] tracking-tighter">
          Mau belajar apa <br /><span className="text-primary">hari ini?</span>
        </h1>
        <p className="mt-4 text-muted-foreground font-medium max-w-lg">
          Pilih subjek, tempel catatanmu, dan biarkan AI meracik kuis adaptif khusus untukmu.
        </p>
      </section>

      <section className="max-w-6xl mx-auto pb-4">
        <div className="flex items-end justify-between mb-4">
          <span className="text-sm font-black uppercase tracking-widest text-oak leading-none">
            Mata Kuliah
          </span>
          {user.role !== "USER" && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setGenOpen(true)}
              disabled={subjects.length === 0}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm font-bold text-white shadow-glow bg-primary disabled:opacity-50"
            >
              <Sparkles className="size-3.5" />
              Generate Materi
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
                className={`shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-bold transition-all ${
                  active ? "bg-primary text-white shadow-soft" : "glass hover:bg-white/70 text-foreground"
                }`}
              >
                <span>{s.name}</span>
              </motion.button>
            );
          })}
          <button
            onClick={() => setSubjOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-bold border-2 border-dashed border-oak/30 text-oak hover:bg-oak/5 transition-all"
          >
            <Plus className="size-4" /> Tambah Matkul
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto pt-6 pb-24">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
          <div>
            <span className="text-sm font-black uppercase tracking-widest text-oak leading-none">
              Ruang Belajar
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
              {activeSubj?.name || "Belum ada materi"}
            </h2>
          </div>

          {activeSubj && (
            <div className="p-1.5 glass-strong rounded-2xl shadow-soft flex gap-1">
              {(["flashcards", "quizzes"] as Tab[]).map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative inline-flex items-center gap-2 px-6 h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      active ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "flashcards" ? <Layers className="size-3.5" /> : <BookOpen className="size-3.5" />}
                    <span className="capitalize">{t}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isLoadingData ? (
             <div className="flex justify-center items-center py-20">
               <Loader2 className="size-8 animate-spin text-primary/40" />
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
                cards.length > 0 ? <FlashcardCarousel cards={cards} /> : <div className="text-center py-20 glass rounded-[32px] border border-dashed border-border/50 text-muted-foreground font-bold">Belum ada flashcard. Silakan generate materi.</div>
              ) : (
                quiz.length > 0 ? (
                  <QuizRunner questions={quiz} onGenerateAdaptive={handleGenerateAdaptive} onComplete={handleSubmitScore} />
                ) : (
                  <div className="text-center py-20 glass rounded-[32px] border border-dashed border-border/50 text-muted-foreground font-bold">Belum ada kuis. Silakan generate materi.</div>
                )
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <GenerateModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        subjects={subjects}
        defaultSubjectId={activeSubject ?? 0}
        onGenerate={handleGenerate}
      />
      <NewSubjectModal open={subjOpen} onClose={() => setSubjOpen(false)} onCreate={addSubject} />
    </main>
  );
}
