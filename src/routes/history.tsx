import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronLeft, History as HistoryIcon, Award, Calendar } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getStoredUser()) {
      throw redirect({ to: "/login" });
    }
  },
});

function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getQuizHistory(Number(user.userId))
        .then(setHistory)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  return (
    <main className="min-h-screen w-full">
      <header className="max-w-4xl mx-auto px-5 pt-10 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all">
          <div className="size-8 rounded-full glass flex items-center justify-center shadow-soft">
            <ChevronLeft className="size-4" />
          </div>
          Kembali
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-2xl bg-primary flex items-center justify-center shadow-soft">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">PinterQ</span>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-5 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="size-14 rounded-3xl glass-strong shadow-soft flex items-center justify-center">
            <HistoryIcon className="size-7 text-foreground/80" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Riwayat Belajar</h1>
            <p className="text-muted-foreground text-sm font-medium">Lacak kemajuan belajarmu di sini.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
              className="size-8 border-4 border-primary border-t-transparent rounded-full" 
            />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-24 glass rounded-3xl border border-dashed border-border/50">
            <Award className="size-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground">Belum ada riwayat kuis</h3>
            <p className="text-muted-foreground/70 text-sm mt-1 max-w-xs mx-auto">
              Ayo mulai belajar dan kerjakan kuis pertamamu untuk melihat progresmu!
            </p>
            <Link to="/" className="inline-block mt-8 px-8 py-3 rounded-full bg-primary text-white font-bold shadow-glow transition hover:scale-105 active:scale-95">
              Mulai Belajar
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {history.map((attempt, idx) => (
              <motion.div
                key={attempt.attemptId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, type: "spring", stiffness: 100 }}
                className="glass-strong p-6 rounded-3xl shadow-soft border border-white/20 flex items-center justify-between gap-4 group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center gap-5">
                  <div className="size-14 rounded-2xl bg-sage/10 flex items-center justify-center group-hover:bg-sage/20 transition-colors">
                    <Award className="size-7 text-sage" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl leading-tight">{attempt.materialTitle}</h3>
                    <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-black/5">
                        <Calendar className="size-3" />
                        {new Date(attempt.attemptDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-primary drop-shadow-sm">{Math.round(attempt.score)}%</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Score</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
