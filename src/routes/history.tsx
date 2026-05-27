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
    <main className="min-h-screen w-full px-5 sm:px-10 pb-20">
      <header className="max-w-4xl mx-auto pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
          <div className="size-8 rounded-full glass flex items-center justify-center shadow-soft">
            <ChevronLeft className="size-3.5" />
          </div>
          Kembali
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-2xl bg-primary flex items-center justify-center shadow-soft">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">PinterQ</span>
        </div>
      </header>

      <section className="max-w-4xl mx-auto py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="size-14 rounded-3xl glass-strong shadow-soft flex items-center justify-center">
            <HistoryIcon className="size-7 text-foreground/80" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-foreground">Riwayat Belajar</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2">Log Aktivitas Kamu</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
              className="size-8 border-4 border-primary border-t-transparent rounded-full" 
            />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-24 glass rounded-[40px] border border-dashed border-border/50">
            <Award className="size-16 mx-auto text-muted-foreground/10 mb-4" />
            <h3 className="text-sm font-bold text-muted-foreground/30 italic">Belum ada riwayat kuis</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((attempt, idx) => (
              <motion.div
                key={attempt.attemptId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass-strong p-5 sm:p-6 rounded-[28px] shadow-soft border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group"
              >
                <div className="flex items-center gap-5">
                  <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <Award className="size-6 text-primary/40" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight text-foreground">{attempt.materialTitle}</h3>
                    <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">
                      <Calendar className="size-3 text-primary/40" />
                      {new Date(attempt.attemptDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right border-t sm:border-0 pt-4 sm:pt-0">
                  <span className="text-3xl font-black text-primary">{Math.round(attempt.score)}%</span>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Final Score</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
