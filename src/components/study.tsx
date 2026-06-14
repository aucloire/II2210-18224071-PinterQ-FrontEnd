import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useEffect } from "react";

export type Flashcard = { id: number; question: string; answer: string };

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  materialId?: number;
};

/* ---------------- Flashcard Carousel ---------------- */

export function FlashcardCarousel({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hideMemorized, setHideMemorized] = useState(false);
  
  const [memorizedCards, setMemorizedCards] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pinterq_memorized");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("pinterq_memorized", JSON.stringify(memorizedCards));
  }, [memorizedCards]);

  const displayCards = hideMemorized
    ? cards.filter((c) => !memorizedCards.includes(c.id))
    : cards;
  
  useEffect(() => {
    if (index >= displayCards.length) setIndex(0);
  }, [displayCards.length, index]);

  const card = displayCards[index];

  const go = (dir: 1 | -1) => {
    setFlipped(false);
    setIndex((i) => (i + dir + displayCards.length) % displayCards.length);
  };

  const toggleMemorized = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (memorizedCards.includes(card.id)) {
      setMemorizedCards(memorizedCards.filter(id => id !== card.id));
    } else {
      setMemorizedCards([...memorizedCards, card.id]);
    }
  };

  if (displayCards.length === 0 && cards.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div
          className="size-16 rounded-full flex items-center justify-center mb-4 shadow-glow"
          style={{ backgroundColor: "var(--color-sage)" }}
        >
          <Trophy className="size-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold">Luar Biasa!</h3>
        <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
          Kamu sudah menghafal semua kartu di materi ini. Siap untuk ujian!
        </p>
        <button
          onClick={() => setHideMemorized(false)}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-soft transition hover:scale-105"
          style={{ backgroundColor: "var(--color-blush)" }}
        >
          Ulangi Semua Kartu
        </button>
      </div>
    );
  }

  if (!card) return null;

  const isMemorized = memorizedCards.includes(card.id);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-between w-full max-w-xl mb-3 text-sm">
        <span className="font-medium text-muted-foreground">
          {index + 1} / {displayCards.length}
        </span>

        <div className="flex items-center gap-4">
          {/* Toggle Mode Fokus */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={hideMemorized}
              onChange={(e) => setHideMemorized(e.target.checked)}
              className="rounded size-4 border-gray-300"
              style={{ accentColor: "var(--color-sage)" }}
            />
            Fokus Belum Hafal
          </label>

          <button
            onClick={() => {
              setFlipped(false);
              setIndex(0);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full glass hover:bg-white/70 transition"
          >
            <RotateCcw className="size-3" /> Restart
          </button>
        </div>
      </div>

      <div className="w-full max-w-xl perspective-1000 h-72 sm:h-80">
        <AnimatePresence mode="wait" initial={false}>
          <motion.button
            key={card.id}
            onClick={() => setFlipped((f) => !f)}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            className="relative w-full h-full preserve-3d cursor-pointer text-left"
          >
            <motion.div
              className="absolute inset-0 preserve-3d"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 80, damping: 14 }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 backface-hidden rounded-3xl glass-strong p-8 shadow-soft flex flex-col justify-between"
                style={{ border: isMemorized ? "2px solid var(--color-sage)" : "none" }}
              >
                <div className="flex justify-between items-start">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--color-oak)" }}
                  >
                    Question · #{card.id.toString().padStart(2, "0")}
                  </span>
                  {isMemorized && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm text-white"
                      style={{ backgroundColor: "var(--color-sage)" }}
                    >
                      <Check className="size-3" /> Hafal
                    </span>
                  )}
                </div>
                <p className="text-2xl sm:text-3xl font-bold leading-snug text-foreground">
                  {card.question}
                </p>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-muted-foreground">Tap to flip →</span>
                  <button
                    onClick={toggleMemorized}
                    className="z-20 text-xs font-bold px-4 py-2 rounded-full border shadow-sm transition hover:scale-105"
                    style={{
                      backgroundColor: isMemorized ? "var(--color-secondary)" : "white",
                      color: isMemorized ? "var(--color-blush)" : "var(--color-foreground)",
                      borderColor: "var(--color-border)"
                    }}
                  >
                    {isMemorized ? "Batal Hafal" : "Tandai Hafal"}
                  </button>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-8 shadow-soft flex flex-col justify-between"
                style={{ backgroundColor: "var(--color-sage)", color: "white" }}
              >
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                  Answer
                </span>
                <p className="text-xl sm:text-2xl font-semibold leading-snug">{card.answer}</p>
                <span className="text-xs opacity-70">Tap to flip back ↺</span>
              </div>
            </motion.div>
          </motion.button>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => go(-1)}
          className="size-12 rounded-full glass shadow-soft flex items-center justify-center hover:bg-white/70 transition"
        >
          <ChevronLeft className="size-5" />
        </motion.button>
        <div className="flex gap-1.5">
          {displayCards.map((c, i) => {
            const isMem = memorizedCards.includes(c.id);
            return (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all shrink-0"
                style={{
                  width: i === index ? 24 : 8,
                  backgroundColor:
                    i === index
                      ? "var(--color-blush)"
                      : isMem
                      ? "var(--color-sage)"
                      : "var(--color-border)",
                }}
              />
            );
          })}
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => go(1)}
          className="size-12 rounded-full shadow-glow flex items-center justify-center text-white"
          style={{ backgroundColor: "var(--color-blush)" }}
        >
          <ChevronRight className="size-5" />
        </motion.button>
      </div>
    </div>
  );
}

/* ---------------- Quiz Runner (1-by-1) ---------------- */

export function QuizRunner({ 
  questions, 
  onGenerateAdaptive,
  onComplete
}: { 
  questions: QuizQuestion[], 
  onGenerateAdaptive?: (difficulty: "HOTS" | "DASAR") => void,
  onComplete?: (score: number) => void
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const letters = ["A", "B", "C", "D"];
  const q = questions[index];

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      const finalScore = score + (selected === q.correctIndex ? 1 : 0);
      const pct = Math.round((finalScore / questions.length) * 100);
      setFinished(true);
      if (onComplete) onComplete(pct);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl glass-strong p-10 shadow-soft text-center max-w-xl mx-auto"
      >
        <div
          className="mx-auto size-16 rounded-2xl flex items-center justify-center shadow-glow mb-4"
          style={{ backgroundColor: "var(--color-sage)" }}
        >
          <Trophy className="size-7 text-white" />
        </div>
        <h3 className="text-3xl font-bold">Quiz selesai!</h3>
        <p className="mt-2 text-muted-foreground">
          Skor kamu: <span className="font-semibold text-foreground">{score}</span> / {questions.length} ({pct}%)
        </p>

        <div className="mt-8 flex flex-col gap-3 max-w-sm mx-auto">
          {pct >= 80 && onGenerateAdaptive && (
            <div className="mb-2">
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-oak)" }}>
                Kamu menguasai materi ini!
              </p>
              <button
                onClick={() => onGenerateAdaptive("HOTS")}
                className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-white shadow-glow transition hover:scale-105"
                style={{ backgroundColor: "var(--color-blush)" }}
              >
                🔥 Generate Level Analisis (HOTS)
              </button>
            </div>
          )}

          {pct <= 50 && onGenerateAdaptive && (
            <div className="mb-2">
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-oak)" }}>
                Masih bingung? Ayo matangkan dasarnya.
              </p>
              <button
                onClick={() => onGenerateAdaptive("DASAR")}
                className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-white shadow-glow transition hover:scale-105"
                style={{ backgroundColor: "var(--color-sage)" }}
              >
                💡 Generate Konsep Dasar
              </button>
            </div>
          )}

          <button
            onClick={restart}
            className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-2xl font-bold text-foreground border-2 transition hover:scale-105"
            style={{ borderColor: "var(--color-border)", backgroundColor: "transparent" }}
          >
            <RotateCcw className="size-4" /> Coba lagi
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* progress bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          Question {index + 1} of {questions.length}
        </span>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Score {score}
        </span>
      </div>
      <div className="h-2 rounded-full mb-6 overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
        <motion.div
          initial={false}
          animate={{ width: `${((index + (selected !== null ? 1 : 0)) / questions.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="h-full rounded-full"
          style={{ backgroundColor: "var(--color-blush)" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="rounded-3xl glass-strong p-6 sm:p-8 shadow-soft"
        >
          <div className="flex items-start gap-3 mb-6">
            <span
              className="shrink-0 size-9 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: "var(--color-oak)" }}
            >
              {index + 1}
            </span>
            <h3 className="text-lg sm:text-xl font-semibold leading-snug pt-1">{q.question}</h3>
          </div>

          <div className="grid gap-2.5">
            {q.options.map((opt, i) => {
              const isSel = selected === i;
              const reveal = selected !== null;
              const isCorrect = reveal && i === q.correctIndex;
              const isWrong = reveal && isSel && i !== q.correctIndex;

              let bg = "var(--color-input)";
              let color = "var(--color-foreground)";
              if (isCorrect) {
                bg = "var(--color-sage)";
                color = "white";
              } else if (isWrong) {
                bg = "var(--color-blush)";
                color = "white";
              } else if (reveal) {
                bg = "var(--color-input)";
                color = "var(--color-muted-foreground)";
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleSelect(i)}
                  whileHover={{ scale: selected === null ? 1.01 : 1 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={selected !== null}
                  className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left transition-colors disabled:cursor-default"
                  style={{ backgroundColor: bg, color }}
                >
                  <span
                    className="shrink-0 size-8 rounded-full flex items-center justify-center text-xs font-bold border"
                    style={{
                      borderColor: isCorrect || isWrong ? "rgba(255,255,255,0.5)" : "var(--color-border)",
                    }}
                  >
                    {letters[i]}
                  </span>
                  <span className="text-sm sm:text-base font-medium flex-1">{opt}</span>
                  <AnimatePresence>
                    {isCorrect && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check className="size-4" />
                      </motion.span>
                    )}
                    {isWrong && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <X className="size-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence initial={false}>
            {selected !== null && q.explanation && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 20 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-2xl p-4 sm:p-5 flex gap-3"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  <Sparkles
                    className="size-5 mt-0.5 shrink-0"
                    style={{ color: "var(--color-oak)" }}
                  />
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "var(--color-oak)" }}
                    >
                      {selected === q.correctIndex ? "Tepat sekali!" : "Penjelasan"}
                    </div>
                    <p className="text-sm leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next button */}
          <AnimatePresence>
            {selected !== null && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 flex justify-end"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-white shadow-glow"
                  style={{ backgroundColor: "var(--color-blush)" }}
                >
                  {index + 1 >= questions.length ? "Lihat hasil" : "Next Question"}
                  <ChevronRight className="size-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
