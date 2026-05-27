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
    <main className="min-h-screen w-full bg-[#fdfaf6]">
      <header className="max-w-4xl mx-auto px-5 pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition">
          <ChevronLeft className="size-4" />
          Kembali
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#e07a5f]" />
          <span className="font-bold tracking-tight">PinterQ</span>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-5 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-12 rounded-2xl bg-white shadow-soft flex items-center justify-center">
            <HistoryIcon className="size-6 text-[#3d405b]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Riwayat Belajar</h1>
            <p className="text-muted-foreground text-sm">Lihat progres kuis yang sudah kamu kerjakan.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="size-8 border-4 border-[#e07a5f] border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <Award className="size-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-500">Belum ada riwayat kuis</h3>
            <p className="text-gray-400 text-sm mt-1">Ayo mulai belajar dan kerjakan kuis pertamamu!</p>
            <Link to="/" className="inline-block mt-6 px-6 py-2.5 rounded-full bg-[#e07a5f] text-white font-semibold shadow-glow">
              Mulai Belajar
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((attempt, idx) => (
              <motion.div
                key={attempt.attemptId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-3xl shadow-soft border border-black/5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-[#81b29a]/10 flex items-center justify-center">
                    <Award className="size-6 text-[#81b29a]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{attempt.materialTitle}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(attempt.attemptDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-[#e07a5f]">{Math.round(attempt.score)}%</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Score</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
