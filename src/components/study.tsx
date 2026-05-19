import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Trophy } from "lucide-react";

export type Flashcard = { id: number; question: string; answer: string };

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

/* ---------------- Flashcard Carousel ---------------- */

export function FlashcardCarousel({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  const go = (dir: 1 | -1) => {
    setFlipped(false);
    setIndex((i) => (i + dir + cards.length) % cards.length);
  };

  if (!card) return null;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-between w-full max-w-xl mb-3 text-sm">
        <span className="font-medium text-muted-foreground">
          {index + 1} / {cards.length}
        </span>
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
              <div className="absolute inset-0 backface-hidden rounded-3xl glass-strong p-8 shadow-soft flex flex-col justify-between">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--color-oak)" }}
                >
                  Question · #{card.id.toString().padStart(2, "0")}
                </span>
                <p className="text-2xl sm:text-3xl font-bold leading-snug text-foreground">
                  {card.question}
                </p>
                <span className="text-xs text-muted-foreground">Tap to flip →</span>
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
          {cards.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 24 : 8,
                backgroundColor:
                  i === index ? "var(--color-blush)" : "var(--color-border)",
              }}
            />
          ))}
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

export function QuizRunner({ questions }: { questions: QuizQuestion[] }) {
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
      setFinished(true);
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
        <button
          onClick={restart}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-white shadow-glow"
          style={{ backgroundColor: "var(--color-blush)" }}
        >
          <RotateCcw className="size-4" /> Coba lagi
        </button>
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
