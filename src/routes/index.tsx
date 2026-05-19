import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, LogOut, Layers, BookOpen, Wand2 } from "lucide-react";
import { FlashcardCarousel, QuizRunner } from "@/components/study";
import { GenerateModal, NewSubjectModal } from "@/components/modals";
import { getStoredUser, useAuth } from "@/lib/auth";
import {
  DEFAULT_SUBJECTS,
  getCardsForSubject,
  getQuizForSubject,
  loadSubjects,
  saveSubjects,
  type Subject,
} from "@/lib/mock-data";

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
      { name: "description", content: "Flashcards & kuis interaktif untuk mahasiswa Sistem Informasi & Teknologi." },
    ],
  }),
});

type Tab = "flashcards" | "quizzes";

function Dashboard() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [activeSubject, setActiveSubject] = useState<string>(DEFAULT_SUBJECTS[0].id);
  const [tab, setTab] = useState<Tab>("flashcards");
  const [genOpen, setGenOpen] = useState(false);
  const [subjOpen, setSubjOpen] = useState(false);
  const [studyKey, setStudyKey] = useState(0); // reset components after generate

  useEffect(() => {
    setSubjects(loadSubjects());
  }, []);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  const cards = useMemo(() => getCardsForSubject(activeSubject), [activeSubject]);
  const quiz = useMemo(() => getQuizForSubject(activeSubject), [activeSubject]);

  const addSubject = (name: string, emoji: string) => {
    const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).slice(2, 6);
    const next = [...subjects, { id, name, emoji }];
    setSubjects(next);
    saveSubjects(next);
    setActiveSubject(id);
  };

  const handleGenerate = (subjectId: string) => {
    setActiveSubject(subjectId);
    setStudyKey((k) => k + 1);
    setTab("flashcards");
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  if (!ready || !user) return null;

  const activeSubj = subjects.find((s) => s.id === activeSubject) ?? subjects[0];

  return (
    <main className="min-h-screen w-full">
      {/* Header */}
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
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs text-muted-foreground">Logged in as</span>
            <span className="text-sm font-semibold">@{user.username}</span>
          </div>
          <div
            className="size-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-soft"
            style={{ backgroundColor: "var(--color-oak)" }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full glass text-sm font-medium hover:bg-white/70 transition"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-4 text-xs font-semibold"
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-foreground)" }}
        >
          <Wand2 className="size-3.5" />
          Halo, {user.username} 👋
        </motion.div>
        <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
          Mau belajar apa <span style={{ color: "var(--color-blush)" }}>hari ini?</span>
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          Pilih subjek, atau tempel materi baru — PinterQ akan ramu jadi flashcard & kuis interaktif.
        </p>
      </section>

      {/* Subject chips */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-oak)" }}>
            Study subjects
          </span>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setGenOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold text-white shadow-glow"
            style={{ backgroundColor: "var(--color-blush)" }}
          >
            <Sparkles className="size-3.5" />
            Generate New
          </motion.button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {subjects.map((s) => {
            const active = s.id === activeSubject;
            return (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setActiveSubject(s.id);
                  setStudyKey((k) => k + 1);
                }}
                className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? "var(--color-oak)" : "var(--color-secondary)",
                  color: active ? "white" : "var(--color-foreground)",
                  boxShadow: active ? "var(--shadow-soft)" : "none",
                }}
              >
                <span>{s.emoji}</span>
                <span>{s.name}</span>
              </motion.button>
            );
          })}
          <button
            onClick={() => setSubjOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-medium border border-dashed transition hover:bg-white/50"
            style={{ borderColor: "var(--color-oak)", color: "var(--color-oak)" }}
          >
            <Plus className="size-4" /> New Subject
          </button>
        </div>
      </section>

      {/* Study room */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-oak)" }}>
              Now studying
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1 flex items-center gap-2">
              <span>{activeSubj.emoji}</span>
              {activeSubj.name}
            </h2>
          </div>

          {/* Tabs */}
          <div
            className="relative inline-flex p-1 rounded-full"
            style={{ backgroundColor: "var(--color-secondary)" }}
          >
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
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab + "-" + activeSubject + "-" + studyKey}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
          >
            {tab === "flashcards" ? (
              <FlashcardCarousel cards={cards} />
            ) : (
              <QuizRunner questions={quiz} />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="max-w-6xl mx-auto px-5 sm:px-8 py-10 text-center text-xs text-muted-foreground">
        Made with care · PinterQ © {new Date().getFullYear()}
      </footer>

      <GenerateModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        subjects={subjects}
        defaultSubjectId={activeSubject}
        onGenerate={handleGenerate}
      />
      <NewSubjectModal open={subjOpen} onClose={() => setSubjOpen(false)} onCreate={addSubject} />
    </main>
  );
}
