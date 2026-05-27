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
      { title: "PinterQ — Study Dashboard" },
      { name: "description", content: "Flashcards & kuis interaktif untuk mahasiswa." },
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
        if (cats.length > 0) setActiveSubject(cats[0].id);
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
      alert("Gagal mengenerate materi. Pastikan API key valid & backend menyala.");
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

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  if (!ready || !user) return null;

  const activeSubj = subjects.find((s) => s.id === activeSubject) ?? subjects[0];

  return (
    <main className="min-h-screen w-full">
      <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="size-9 rounded-2xl flex items-center justify-center shadow-soft"
            style={{ backgroundColor: "var(--color-blush)" }}
          >
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PinterQ</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight mr-2">
            <span className="text-xs text-muted-foreground">Logged in as</span>
            <span className="text-sm font-semibold">@{user.username} ({user.role})</span>
          </div>
          <Link to="/history" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full glass text-sm font-medium hover:bg-white/70 transition">
            <History className="size-3.5" />
            <span className="hidden sm:inline">Riwayat</span>
          </Link>
          {user.role === "SUPERADMIN" && (
            <Link to="/admin" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full glass text-sm font-medium hover:bg-white/70 transition text-[#3d405b]">
              <ShieldCheck className="size-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full glass text-sm font-medium hover:bg-white/70 transition"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-4 text-xs font-semibold bg-white/50 border border-black/5"
        >
          <Wand2 className="size-3.5" />
          Halo, {user.username} 👋
        </motion.div>
        <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
          Mau belajar apa <span style={{ color: "var(--color-blush)" }}>hari ini?</span>
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          Pilih subjek, tempel catatan kuliahmu, lalu biarkan PinterQ meraciknya jadi kuis dan flashcard AI.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-oak)" }}>
            Mata Kuliah
          </span>
          {user.role !== "USER" && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setGenOpen(true)}
              disabled={subjects.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold text-white shadow-glow disabled:opacity-50"
              style={{ backgroundColor: "var(--color-blush)" }}
            >
              <Sparkles className="size-3.5" />
              Generate Materi
            </motion.button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {subjects.map((s) => {
            const active = s.id === activeSubject;
            return (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveSubject(s.id)}
                className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? "var(--color-oak)" : "var(--color-secondary)",
                  color: active ? "white" : "var(--color-foreground)",
                  boxShadow: active ? "var(--shadow-soft)" : "none",
                }}
              >
                <span>{s.name}</span>
              </motion.button>
            );
          })}
          <button
            onClick={() => setSubjOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-medium border border-dashed transition hover:bg-white/50"
            style={{ borderColor: "var(--color-oak)", color: "var(--color-oak)" }}
          >
            <Plus className="size-4" /> Tambah Matkul
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-oak)" }}>
              Ruang Belajar
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1 flex items-center gap-2">
              {activeSubj?.name || "Belum ada mata kuliah"}
            </h2>
          </div>

          {activeSubj && (
            <div className="relative inline-flex p-1 rounded-full" style={{ backgroundColor: "var(--color-secondary)" }}>
              {(["flashcards", "quizzes"] as Tab[]).map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="relative z-10 inline-flex items-center gap-2 px-4 h-9 rounded-full text-sm font-semibold transition-colors"
                    style={{ color: active ? "white" : "var(--color-foreground)" }}
                  >
                    {active && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-full -z-10"
                        style={{ backgroundColor: "var(--color-blush)" }}
                        transition={{ type: "spring", stiffness: 250, damping: 26 }}
                      />
                    )}
                    {t === "flashcards" ? <Layers className="size-4" /> : <BookOpen className="size-4" />}
                    <span className="capitalize">{t}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isLoadingData ? (
             <div className="flex justify-center items-center py-20 text-muted-foreground">
               <Loader2 className="size-8 animate-spin" />
             </div>
          ) : activeSubj ? (
            <motion.div
              key={tab + "-" + activeSubject + "-" + studyKey}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
            >
              {tab === "flashcards" ? (
                cards.length > 0 ? <FlashcardCarousel cards={cards} /> : <div className="text-center py-10 opacity-60">Belum ada flashcard. Silakan generate materi.</div>
              ) : (
                quiz.length > 0 ? (
                  <QuizRunner questions={quiz} onGenerateAdaptive={handleGenerateAdaptive} onComplete={handleSubmitScore} />
                ) : (
                  <div className="text-center py-10 opacity-60">Belum ada kuis. Silakan generate materi.</div>
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
