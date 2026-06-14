import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Users, FileText, Loader2, BookOpen, UsersRound, ClipboardCheck, Trophy } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlashcardCarousel } from "@/components/study";

export const Route = createFileRoute("/class/teacher/$classId")({
  component: TeacherClassDetailPage,
  beforeLoad: () => {
    const user = getStoredUser();
    if (typeof window !== "undefined" && (!user || user.role !== "GURU")) {
      throw redirect({ to: "/" });
    }
  },
});

type ClassMember = {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
};

interface ClassItem {
  id: number;
  name: string;
  classCode: string;
  memberCount: number;
  createdAt: string;
}

function TeacherClassDetailPage() {
  const { user, ready } = useAuth();
  const { classId } = Route.useParams();
  const classIdNum = Number(classId);

  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user || isNaN(classIdNum)) return;
    setLoading(true);
    
    const fetchData = async () => {
      try {
        const [membersData, flashcardsData, quizzesData, allClasses] = await Promise.all([
          api.getClassMembers(classIdNum),
          api.getFlashcards(classIdNum),
          api.getQuizzes(classIdNum),
          api.getTeacherClasses(Number(user.userId))
        ]);

        setMembers(Array.isArray(membersData) ? membersData : []);
        setFlashcards(Array.isArray(flashcardsData) ? flashcardsData : []);
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
        
        const found = (Array.isArray(allClasses) ? allClasses : []).find((c: any) => c.id === classIdNum);
        setClassData(found || null);
      } catch (err) {
        console.error("Error fetching class data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classIdNum, ready, user]);

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
          <div className="size-8 rounded-2xl bg-primary flex items-center justify-center shadow-soft text-white">
            <BookOpen className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">
            Mode Guru
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{classData?.name || `Kelas #${classIdNum}`}</h1>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    Kode: <code className="bg-secondary px-2 py-0.5 rounded font-mono text-xs font-bold text-primary">{classData?.classCode}</code>
                    {" · "}<UsersRound className="size-3.5" /> {members.length} murid tergabung
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Section 1: Daftar Murid */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UsersRound className="size-5 text-green-600" />
                Daftar Murid
              </h2>
              {members.length === 0 ? (
                <div className="text-center py-12 glass rounded-3xl border border-dashed">
                   <Users className="size-10 mx-auto text-muted-foreground/10 mb-3" />
                   <p className="text-xs text-muted-foreground italic">Belum ada murid yang bergabung di kelas ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {members.map(m => (
                    <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/40 p-4 rounded-2xl border border-black/5 flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Users className="size-5 text-muted-foreground/30" />
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-none">{m.fullName || m.username}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">@{m.username}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 2: List Kuis */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardCheck className="size-5 text-blue-600" />
                  Daftar Kuis
                </h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold">{quizzes.length} Kuis</Badge>
              </div>
              {quizzes.length === 0 ? (
                <div className="text-center py-12 glass rounded-3xl border border-dashed">
                   <ClipboardCheck className="size-10 mx-auto text-muted-foreground/10 mb-3" />
                   <p className="text-xs text-muted-foreground italic">Belum ada kuis yang di-generate untuk kelas ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quizzes.map((q, i) => (
                    <Card key={q.id} className="border-0 shadow-soft bg-white/60 overflow-hidden group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                           <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                              <span className="font-black text-xs">Q{i+1}</span>
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-bold leading-snug line-clamp-2">{q.question}</p>
                              <div className="flex items-center gap-3 mt-3">
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pilihan Ganda</span>
                                 <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">Jawaban: {q.correctAnswer}</span>
                              </div>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Section 3: List Flashcard */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="size-5 text-purple-600" />
                  Flashcard
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

function StatCard({ title, value, icon, color }: {
  title: string; value: number | string; icon: React.ReactNode; color: string;
}) {
  return (
    <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`size-12 rounded-2xl flex items-center justify-center shadow-sm ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
