import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, FileText, Loader2, BookOpen, UsersRound, ClipboardCheck, Trophy, Eye } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlashcardCarousel, QuizRunner } from "@/components/study";
import type { QuizQuestion } from "@/components/study";

export const Route = createFileRoute("/class/student/$classId")({
  component: StudentClassDetailPage,
  beforeLoad: () => {
    const user = getStoredUser();
    if (typeof window !== "undefined" && (!user || user.role !== "MURID")) {
      throw redirect({ to: "/" });
    }
  },
});

interface ClassItem {
  id: number;
  name: string;
  classCode: string;
  memberCount: number;
  createdAt: string;
}

function StudentClassDetailPage() {
  const { user, ready } = useAuth();
  const { classId } = Route.useParams();
  const classIdNum = Number(classId);

  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuizIndex, setActiveQuizIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!ready || !user || isNaN(classIdNum)) return;
    setLoading(true);
    
    const fetchData = async () => {
      try {
        const [flashcardsData, quizzesData, joinedClasses] = await Promise.all([
          api.getFlashcards(classIdNum),
          api.getQuizzes(classIdNum),
          api.getStudentJoinedClasses(Number(user.userId))
        ]);

        setFlashcards(Array.isArray(flashcardsData) ? flashcardsData : []);
        
        const mappedQuizzes: QuizQuestion[] = (Array.isArray(quizzesData) ? quizzesData : []).map((q: any) => ({
          id: q.id,
          question: q.question,
          options: [q.optionA, q.optionB, q.optionC, q.optionD],
          correctIndex: ["A", "B", "C", "D"].indexOf(q.correctAnswer),
          explanation: q.explanation,
          materialId: q.material?.id,
        }));
        setQuizzes(mappedQuizzes);
        
        const found = (Array.isArray(joinedClasses) ? joinedClasses : []).find((c: any) => c.id === classIdNum);
        setClassData(found || null);
      } catch (err) {
        console.error("Error fetching student class data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  if (!ready || !user) return null;

  return (
    <main className="min-h-screen w-full px-5 sm:px-10 pb-20">
      <header className="max-w-5xl mx-auto pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
          <div className="size-8 rounded-full glass flex items-center justify-center shadow-soft">
            <ChevronLeft className="size-3.5" />
          </div>
          Dashboard
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-2xl bg-sage flex items-center justify-center shadow-soft text-white">
            <BookOpen className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">
            Mode Belajar
          </span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto pt-10 pb-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-primary/30" />
          </div>
        ) : (
          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{classData?.name || `Kelas #${classIdNum}`}</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 font-medium">
                <UsersRound className="size-3.5" /> {classData?.memberCount || 0} teman sekelas
              </p>
            </motion.div>

            {/* Section: List Kuis */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardCheck className="size-5 text-blue-600" />
                  Kuis Tersedia
                </h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold">{quizzes.length} Kuis</Badge>
              </div>
              {quizzes.length === 0 ? (
                <div className="text-center py-12 glass rounded-3xl border border-dashed">
                   <ClipboardCheck className="size-10 mx-auto text-muted-foreground/10 mb-3" />
                   <p className="text-xs text-muted-foreground italic">Belum ada kuis untuk kelas ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quizzes.map((q, i) => (
                    <Card key={q.id} className="border-0 shadow-soft bg-white/60 overflow-hidden hover:bg-white/80 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                           <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                              <span className="font-black text-xs">Q{i+1}</span>
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-bold leading-snug line-clamp-2">{q.question}</p>
                              <Button size="sm" onClick={() => setActiveQuizIndex(i)} className="mt-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest h-8 px-4 rounded-lg">
                                 Kerjakan <Eye className="size-3 ml-1.5" />
                              </Button>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Quiz Runner Modal/Section */}
              {activeQuizIndex !== null && quizzes[activeQuizIndex] && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 glass-strong rounded-[32px] border border-primary/20 shadow-glow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-lg">Mengerjakan Kuis {activeQuizIndex + 1}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveQuizIndex(null)} className="text-muted-foreground hover:text-destructive">
                      Tutup
                    </Button>
                  </div>
                  <QuizRunner
                    questions={[quizzes[activeQuizIndex]]}
                    onGenerateAdaptive={() => {}}
                    onComplete={handleQuizComplete}
                  />
                </motion.div>
              )}
            </section>

            {/* Section: List Flashcard */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="size-5 text-purple-600" />
                  Flashcard Belajar
                </h2>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold">{flashcards.length} Kartu</Badge>
              </div>
              {flashcards.length === 0 ? (
                <div className="text-center py-12 glass rounded-3xl border border-dashed">
                   <FileText className="size-10 mx-auto text-muted-foreground/10 mb-3" />
                   <p className="text-xs text-muted-foreground italic">Belum ada flashcard untuk kelas ini.</p>
                </div>
              ) : (
                <div className="bg-white/40 p-6 rounded-[32px] border border-black/5 shadow-soft">
                  <FlashcardCarousel cards={flashcards} />
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
