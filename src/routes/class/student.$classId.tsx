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

type ClassMember = {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
};

function StudentClassDetailPage() {
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
        const [flashcardsData, quizzesData, joinedClasses, membersData] = await Promise.all([
          api.getFlashcards(classIdNum),
          api.getQuizzes(classIdNum),
          api.getStudentJoinedClasses(Number(user.userId)),
          api.getClassMembers(classIdNum)
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
          <div className="space-y-20">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{classData?.name || `Kelas #${classIdNum}`}</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 font-medium">
                <UsersRound className="size-3.5" /> {classData?.memberCount || 0} teman sekelas
              </p>
            </motion.div>

            {/* Section: Materi & Kuis Grouped */}
            <section className="space-y-12">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardCheck className="size-5 text-blue-600" />
                  Materi Belajar
                </h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold">{Object.keys(groupedMaterials).length} Materi</Badge>
              </div>

              {Object.keys(groupedMaterials).length === 0 ? (
                <div className="text-center py-12 glass rounded-3xl border border-dashed">
                   <ClipboardCheck className="size-10 mx-auto text-muted-foreground/10 mb-3" />
                   <p className="text-xs text-muted-foreground italic">Belum ada materi atau kuis untuk kamu kerjakan.</p>
                </div>
              ) : (
                <div className="space-y-14">
                  {Object.entries(groupedMaterials).map(([mId, data]) => (
                    <div key={mId} className="space-y-8">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-black/5"></div>
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground shrink-0">{data.title}</h3>
                        <div className="h-px flex-1 bg-black/5"></div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Quizzes for this material */}
                        <div className="space-y-5">
                          <h4 className="text-xs font-black uppercase tracking-widest text-blue-600/60 flex items-center gap-2 px-1">
                            <ClipboardCheck className="size-3.5" /> Kuis
                          </h4>
                          <div className="grid gap-4">
                            {data.quizzes.map((q, i) => (
                              <Card key={q.id} className="border-0 shadow-soft bg-white/60 overflow-hidden hover:bg-white/80 transition-all group">
                                <CardContent className="p-5">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 text-[10px] font-black">
                                        Q{i + 1}
                                      </div>
                                      <p className="text-xs font-bold leading-relaxed line-clamp-2">{q.question}</p>
                                    </div>
                                    <Link
                                      to="/study/quiz/$id"
                                      params={{ id: String(q.material.id) }}
                                      search={{ categoryId: classIdNum }}
                                      className="inline-flex items-center justify-center px-4 h-8 rounded-lg bg-primary text-white font-black text-[9px] uppercase tracking-widest shadow-soft opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      Kerjakan
                                    </Link>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Flashcards for this material */}
                        <div className="space-y-5">
                          <h4 className="text-xs font-black uppercase tracking-widest text-purple-600/60 flex items-center gap-2 px-1">
                            <FileText className="size-3.5" /> Flashcard
                          </h4>
                          {data.flashcards.length > 0 ? (
                            <div className="bg-white/40 p-6 rounded-[32px] border border-black/5 shadow-soft flex flex-col items-center justify-center text-center gap-4">
                               <div className="size-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                  <FileText className="size-8" />
                               </div>
                               <div>
                                  <p className="font-bold text-sm">Flashcard Belajar</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">{data.flashcards.length} kartu tersedia untuk dihafal</p>
                               </div>
                               <Link
                                  to="/study/flashcard/$id"
                                  params={{ id: String(mId) }}
                                  search={{ categoryId: classIdNum }}
                                  className="mt-2 inline-flex items-center justify-center px-6 h-9 rounded-xl bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest shadow-soft hover:brightness-110 transition"
                               >
                                  Buka Flashcard
                               </Link>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic px-1">Materi ini belum memiliki flashcard.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section: Teman Sekelas (Bottom, Scrollable) */}
            <section className="pt-10 border-t border-black/5">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-muted-foreground">
                <UsersRound className="size-5" />
                Teman Sekelas
              </h2>
              <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar p-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {members.filter(m => m.id !== Number(user.userId)).map(m => (
                    <div key={m.id} className="bg-white/30 p-3 rounded-xl border border-black/5 flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-white/50 flex items-center justify-center shadow-sm shrink-0">
                        <Users className="size-4 text-muted-foreground/30" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] leading-tight truncate">{m.fullName || m.username}</p>
                        <p className="text-[9px] text-muted-foreground truncate">@{m.username}</p>
                      </div>
                    </div>
                  ))}
                  {members.length <= 1 && (
                    <p className="text-[10px] text-muted-foreground italic col-span-full py-4">Belum ada murid lain di kelas ini.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
