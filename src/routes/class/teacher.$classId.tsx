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
  const [groupedMaterials, setGroupedMaterials] = useState<Record<number, { title: string; quizzes: any[]; flashcards: any[] }>>({});
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
        
        // Grouping logic
        const groups: Record<number, { title: string; quizzes: any[]; flashcards: any[] }> = {};
        
        (Array.isArray(quizzesData) ? quizzesData : []).forEach((q: any) => {
          const mId = q.material?.id;
          if (!mId) return;
          if (!groups[mId]) groups[mId] = { title: q.material.title, quizzes: [], flashcards: [] };
          groups[mId].quizzes.push(q);
        });

        (Array.isArray(flashcardsData) ? flashcardsData : []).forEach((f: any) => {
          const mId = f.material?.id;
          if (!mId) return;
          if (!groups[mId]) groups[mId] = { title: f.material.title, quizzes: [], flashcards: [] };
          groups[mId].flashcards.push(f);
        });

        setGroupedMaterials(groups);
        
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
          <div className="space-y-16">
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

            {/* Section 1: Daftar Murid (Scrollable) */}
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <UsersRound className="size-5 text-green-600" />
                Daftar Murid
              </h2>
              {members.length === 0 ? (
                <div className="text-center py-12 glass rounded-3xl border border-dashed">
                   <Users className="size-10 mx-auto text-muted-foreground/10 mb-3" />
                   <p className="text-xs text-muted-foreground italic">Belum ada murid yang bergabung di kelas ini.</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-3 p-1">
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
                </div>
              )}
            </section>

            {/* Section 2: Materi & Kuis Grouped */}
            <section className="space-y-12">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardCheck className="size-5 text-blue-600" />
                  Materi & Kuis
                </h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold">{Object.keys(groupedMaterials).length} Materi</Badge>
              </div>

              {Object.keys(groupedMaterials).length === 0 ? (
                <div className="text-center py-12 glass rounded-3xl border border-dashed">
                   <ClipboardCheck className="size-10 mx-auto text-muted-foreground/10 mb-3" />
                   <p className="text-xs text-muted-foreground italic">Belum ada materi atau kuis untuk kelas ini.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {Object.entries(groupedMaterials).map(([mId, data]) => (
                    <div key={mId} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-black/5"></div>
                        <h3 className="font-black text-sm uppercase tracking-[0.2em] text-muted-foreground shrink-0">{data.title}</h3>
                        <div className="h-px flex-1 bg-black/5"></div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Quizzes for this material */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-blue-600/60 flex items-center gap-2 px-1">
                            <ClipboardCheck className="size-3.5" /> Kuis ({data.quizzes.length})
                          </h4>
                          <div className="grid gap-3">
                            {data.quizzes.map((q, i) => (
                              <Card key={q.id} className="border-0 shadow-soft bg-white/60 overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 text-[10px] font-black">
                                      {i + 1}
                                    </div>
                                    <p className="text-xs font-bold leading-relaxed line-clamp-2">{q.question}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Flashcards for this material */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-purple-600/60 flex items-center gap-2 px-1">
                            <FileText className="size-3.5" /> Flashcard ({data.flashcards.length})
                          </h4>
                          {data.flashcards.length > 0 ? (
                            <div className="bg-white/40 p-4 rounded-3xl border border-black/5">
                              <FlashcardCarousel cards={data.flashcards} />
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic px-1">Tidak ada flashcard untuk materi ini.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
