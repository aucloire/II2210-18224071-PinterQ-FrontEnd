import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Users, Trophy, FileText, Loader2, BookOpen, UsersRound, ClipboardCheck, Sparkles, Eye } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlashcardCarousel, QuizRunner } from "@/components/study";
import type { QuizQuestion } from "@/components/study";

export const Route = createFileRoute("/class/$classId")({
  component: ClassDetailPage,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getStoredUser()) {
      throw redirect({ to: "/login" });
    }
  },
});

type ClassMember = {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
};

type QuizAttempt = {
  id: number;
  studentId: number;
  studentName?: string;
  materialId: number;
  score: number;
  createdAt: string;
};

type StudyMaterial = {
  id: number;
  title: string;
  content: string;
  category?: { id: number; name: string };
};

interface ClassItem {
  id: number;
  name: string;
  classCode: string;
  memberCount: number;
  createdAt: string;
}

function ClassDetailPage() {
  const { user, ready } = useAuth();
  const { classId } = Route.useParams();
  const classIdNum = Number(classId);

  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "quizzes" | "students" | "report">("overview");
  const [activeQuizIndex, setActiveQuizIndex] = useState<number | null>(null);
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!ready || !user || isNaN(classIdNum)) return;
    setLoading(true);
    const teacherId = Number(user.userId);

    const loadMembers = async () => {
      try {
        const data = await api.getClassMembers(classIdNum);
        setMembers(Array.isArray(data) ? data : []);
      } catch { setMembers([]); }
    };

    const loadFlashcards = async () => {
      try {
        const data = await api.getFlashcards(classIdNum);
        setFlashcards(Array.isArray(data) ? data : []);
      } catch { setFlashcards([]); }
    };

    const loadQuizzes = async () => {
      try {
        const raw = await api.getQuizzes(classIdNum);
        const mapped: QuizQuestion[] = (Array.isArray(raw) ? raw : []).map((q: any) => ({
          id: q.id,
          question: q.question,
          options: [q.optionA, q.optionB, q.optionC, q.optionD],
          correctIndex: ["A", "B", "C", "D"].indexOf(q.correctAnswer),
          explanation: q.explanation,
          materialId: q.material?.id,
        }));
        setQuizzes(mapped);
      } catch { setQuizzes([]); }
    };

    const loadClassInfo = async () => {
      try {
        const allClasses = await api.getTeacherClasses(teacherId);
        const found = (Array.isArray(allClasses) ? allClasses : []).find((c: any) => c.id === classIdNum);
        setClassData(found || null);
      } catch { setClassData(null); }
    };

    Promise.all([loadMembers(), loadFlashcards(), loadQuizzes(), loadClassInfo()])
      .finally(() => setLoading(false));
  }, [classIdNum, ready, user]);

  const handleQuizComplete = async (score: number) => {
    if (!user || activeQuizIndex === null) return;
    const q = quizzes[activeQuizIndex];
    if (!q?.materialId) return;
    try {
      await api.submitQuizAttempt(Number(user.userId), q.materialId, score);
    } catch (err) {
      console.error("Gagal simpan skor:", err);
    }
  };

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : 0;

  if (!ready || !user) return null;

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
            <BookOpen className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">
            {classData?.name || "Detail Kelas"}
          </span>
        </div>
      </header>

      <section className="max-w-6xl mx-auto pt-10 pb-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-primary/30" />
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{classData?.name || `Kelas #${classIdNum}`}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Kode Kelas: <code className="bg-secondary px-2 py-0.5 rounded font-mono text-xs">{classData?.classCode}</code>
                {" · "}{members.length} murid
              </p>
            </motion.div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 glass-strong rounded-xl inline-flex mt-8">
              {([
                { key: "overview", label: "Overview", icon: <Eye className="size-3.5" /> },
                { key: "quizzes", label: "Kuis & Materi", icon: <ClipboardCheck className="size-3.5" /> },
                { key: "students", label: "Murid", icon: <UsersRound className="size-3.5" /> },
                { key: "report", label: "Laporan", icon: <Trophy className="size-3.5" /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setActiveQuizIndex(null); setActiveFlashcardIndex(null); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === key ? "bg-primary text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="max-w-6xl mx-auto pb-10">
        {/* === OVERVIEW TAB === */}
        {activeTab === "overview" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard title="Murid" value={members.length} icon={<UsersRound className="size-5" />} color="text-green-600 bg-green-50" />
              <StatCard title="Total Kuis" value={quizzes.length} icon={<ClipboardCheck className="size-5" />} color="text-blue-600 bg-blue-50" />
              <StatCard title="Total Flashcard" value={flashcards.length} icon={<FileText className="size-5" />} color="text-purple-600 bg-purple-50" />
              <StatCard title="Rata-rata Nilai" value={avgScore} icon={<Trophy className="size-5" />} color="text-amber-600 bg-amber-50" />
            </div>

            {/* Quizzes Preview */}
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <ClipboardCheck className="size-5 text-blue-600" /> Kuis Tersedia
              </h2>
              {quizzes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada kuis di kelas ini</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quizzes.map((q, i) => (
                    <Card key={q.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveQuizIndex(i)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-sm">Kuis {i + 1}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{q.question.substring(0, 60)}...</p>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">Kuis</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Flashcards Preview */}
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <FileText className="size-5 text-purple-600" /> Flashcard Tersedia
              </h2>
              {flashcards.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada flashcard di kelas ini</p>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-3">{flashcards.length} kartu</p>
                    <FlashcardCarousel cards={flashcards} />
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* === QUIZZES & MATERIAL TAB === */}
        {activeTab === "quizzes" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Flashcards Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="size-5 text-purple-600" /> Flashcard
                </h2>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">{flashcards.length} kartu</Badge>
              </div>
              {flashcards.length > 0 ? (
                <FlashcardCarousel cards={flashcards} />
              ) : (
                <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada flashcard</p>
              )}
            </div>

            {/* Quizzes Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ClipboardCheck className="size-5 text-blue-600" /> Daftar Kuis
                </h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">{quizzes.length} kuis</Badge>
              </div>
              {quizzes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada kuis di kelas ini</p>
              ) : (
                <div className="space-y-3">
                  {quizzes.map((q, i) => (
                    <Card key={q.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-sm">Kuis {i + 1}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{q.question}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => setActiveQuizIndex(i)} className="bg-primary hover:bg-primary/90 text-xs">
                              <Eye className="size-3.5 mr-1" /> Lihat
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Active Quiz Runner */}
            {activeQuizIndex !== null && quizzes[activeQuizIndex] && (
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Preview Kuis {activeQuizIndex + 1}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveQuizIndex(null)} className="text-muted-foreground text-xs">
                    Tutup
                  </Button>
                </div>
                <QuizRunner
                  questions={[quizzes[activeQuizIndex]]}
                  onGenerateAdaptive={() => {}}
                  onComplete={handleQuizComplete}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* === STUDENTS TAB === */}
        {activeTab === "students" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UsersRound className="size-5 text-green-600" /> Daftar Murid ({members.length})
            </h2>
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada murid bergabung</p>
            ) : (
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="bg-white/60 p-4 rounded-2xl border border-black/5 flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Users className="size-5 text-muted-foreground/30" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{m.fullName || m.username}</p>
                      <p className="text-xs text-muted-foreground">@{m.username}</p>
                    </div>
                    {m.email && (
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* === REPORT TAB === */}
        {activeTab === "report" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Overall Score */}
            <div className="glass-strong rounded-2xl p-6 text-center">
              <Trophy className="size-10 mx-auto text-amber-500 mb-2" />
              <p className="text-sm text-muted-foreground">Rata-rata Nilai Kelas</p>
              <p className="text-5xl font-black mt-2">{avgScore}</p>
              <p className="text-xs text-muted-foreground mt-1">{attempts.length} upaya pengerjaan</p>
            </div>

            {/* Per-Quiz Breakdown */}
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Sparkles className="size-5 text-primary" /> Rata-rata Nilai per Kuis
              </h2>
              {attempts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada data nilai</p>
              ) : (
                <div className="space-y-2">
                  {quizzes.map((q, i) => {
                    const quizAttempts = attempts.filter((a: any) => (a.materialId || a.quizId) === q.materialId || a.materialId === q.materialId);
                    const quizAvg = quizAttempts.length > 0
                      ? Math.round(quizAttempts.reduce((s: number, a: any) => s + a.score, 0) / quizAttempts.length)
                      : null;
                    return (
                      <div key={q.id} className="bg-white/60 p-4 rounded-2xl border border-black/5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">Kuis {i + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {quizAttempts.length > 0 ? `${quizAttempts.length} pengerjaan` : "Belum ada pengerjaan"}
                          </p>
                        </div>
                        <div className={`text-2xl font-black ${quizAvg !== null ? (quizAvg >= 80 ? "text-green-600" : quizAvg >= 50 ? "text-amber-600" : "text-red-500") : "text-muted-foreground/30"}`}>
                          {quizAvg !== null ? quizAvg : "-"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Per-Student Breakdown */}
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <UsersRound className="size-5 text-green-600" /> Nilai per Murid
              </h2>
              {attempts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-8 glass rounded-xl text-center">Belum ada data nilai</p>
              ) : (
                <div className="space-y-2">
                  {members.map(m => {
                    const studentAttempts = attempts.filter((a: any) => a.studentId === m.id);
                    const studentAvg = studentAttempts.length > 0
                      ? Math.round(studentAttempts.reduce((s: number, a: any) => s + a.score, 0) / studentAttempts.length)
                      : null;
                    return (
                      <div key={m.id} className="bg-white/60 p-4 rounded-2xl border border-black/5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{m.fullName || m.username}</p>
                          <p className="text-xs text-muted-foreground">@{m.username} · {studentAttempts.length} pengerjaan</p>
                        </div>
                        <div className={`text-2xl font-black ${studentAvg !== null ? (studentAvg >= 80 ? "text-green-600" : studentAvg >= 50 ? "text-amber-600" : "text-red-500") : "text-muted-foreground/30"}`}>
                          {studentAvg !== null ? studentAvg : "-"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </section>
    </main>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string; value: number | string; icon: React.ReactNode; color: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`size-12 rounded-2xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
