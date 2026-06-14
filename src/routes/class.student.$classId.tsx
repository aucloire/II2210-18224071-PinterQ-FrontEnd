import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, FileText, Loader2, BookOpen, UsersRound, 
  ClipboardCheck, Trophy, ArrowRight, Sparkles, Award,
  CheckCircle2, Circle
} from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/class/student/$classId")({
  component: StudentClassDetailPage,
  beforeLoad: () => {
    const user = getStoredUser();
    if (typeof window !== "undefined" && (!user || user.role !== "MURID")) {
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

function StudentClassDetailPage() {
  const { user, ready } = useAuth();
  const { classId } = Route.useParams();
  const classIdNum = Number(classId);

  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [groupedMaterials, setGroupedMaterials] = useState<Record<number, { id: number; title: string; quizzes: any[]; flashcards: any[]; bestScore?: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user || isNaN(classIdNum)) return;
    setLoading(true);
    
    const fetchData = async () => {
      try {
        const [flashcardsData, quizzesData, joinedClasses, membersData, historyData] = await Promise.all([
          api.getFlashcards(classIdNum),
          api.getQuizzes(classIdNum),
          api.getStudentJoinedClasses(Number(user.userId)),
          api.getClassMembers(classIdNum),
          api.getQuizHistory(Number(user.userId))
        ]);

        setMembers(Array.isArray(membersData) ? membersData : []);

        const groups: Record<number, { id: number; title: string; quizzes: any[]; flashcards: any[]; bestScore?: number }> = {};
        
        (Array.isArray(quizzesData) ? quizzesData : []).forEach((q: any) => {
          const mId = q.material?.id;
          if (!mId) return;
          if (!groups[mId]) groups[mId] = { id: mId, title: q.material.title, quizzes: [], flashcards: [] };
          groups[mId].quizzes.push(q);
        });

        (Array.isArray(flashcardsData) ? flashcardsData : []).forEach((f: any) => {
          const mId = f.material?.id;
          if (!mId) return;
          if (!groups[mId]) groups[mId] = { id: mId, title: f.material.title, quizzes: [], flashcards: [] };
          groups[mId].flashcards.push(f);
        });

        // Calculate best scores from history
        (Array.isArray(historyData) ? historyData : []).forEach((h: any) => {
          const mId = h.materialId;
          if (groups[mId]) {
            if (!groups[mId].bestScore || h.score > groups[mId].bestScore) {
              groups[mId].bestScore = h.score;
            }
          }
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
    <div className="min-h-screen w-full bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between glass-strong rounded-[24px] px-6 h-16 shadow-soft border border-white/20">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
            <ChevronLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-sage flex items-center justify-center text-white shadow-soft">
              <BookOpen className="size-4" />
            </div>
            <span className="font-black tracking-tight text-sm">Mode Belajar</span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <section>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="bg-primary/10 text-primary border-0 font-black text-[10px] uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full">
                Materi Belajar
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">{classData?.name || "Memuat..."}</h1>
              <div className="flex items-center gap-4 mt-4 text-muted-foreground font-bold">
                 <div className="flex items-center gap-1.5">
                    <UsersRound className="size-4 text-sage" />
                    <span className="text-xs uppercase tracking-wider">{classData?.memberCount || 0} Teman Sekelas</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full shadow-sm border border-black/5">
                    <span className="text-[10px] uppercase tracking-widest opacity-60">KODE:</span>
                    <code className="text-primary font-mono text-sm">{classData?.classCode}</code>
                 </div>
              </div>
            </motion.div>
          </section>

          {/* Topics List */}
          <section className="space-y-12">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="size-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Modul Pelajaran</span>
              <div className="h-px flex-1 bg-black/5"></div>
            </div>

            {loading ? (
               <div className="flex justify-center py-20"><Loader2 className="size-10 animate-spin text-primary/20" /></div>
            ) : Object.keys(groupedMaterials).length === 0 ? (
               <div className="text-center py-24 glass rounded-[40px] border border-dashed border-border/50">
                  <BookOpen className="size-16 mx-auto text-muted-foreground/10 mb-4" />
                  <p className="text-base font-bold text-muted-foreground/40 italic">Belum ada materi dari gurumu</p>
                  <p className="text-xs text-muted-foreground/30 mt-1">Silakan hubungi pengajar kelas ini</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-8">
                  {Object.entries(groupedMaterials).map(([mId, data]) => (
                    <motion.div 
                      key={mId} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="group"
                    >
                      <Card className="border-0 shadow-soft bg-white/40 rounded-[40px] overflow-hidden hover:bg-white/60 transition-all">
                        <CardContent className="p-0">
                           <div className="p-8 sm:p-10 flex flex-col md:flex-row gap-10 items-center">
                              {/* Icon & Progress */}
                              <div className="shrink-0 relative">
                                 <div className={`size-24 rounded-[32px] flex items-center justify-center shadow-soft ${data.bestScore ? 'bg-background text-sage' : 'bg-background text-primary/30'}`}>
                                    {data.bestScore ? <CheckCircle2 className="size-10" /> : <Circle className="size-10 opacity-20" />}
                                 </div>
                                 {data.bestScore && (
                                    <div className="absolute -top-2 -right-2 bg-sage text-white font-black text-[10px] px-2 py-1 rounded-lg shadow-glow">
                                       {Math.round(data.bestScore)}%
                                    </div>
                                 )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 text-center md:text-left space-y-2">
                                 <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{data.title}</h3>
                                 <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                       <ClipboardCheck className="size-3.5 text-primary/60" /> {data.quizzes.length} Pertanyaan
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                       <FileText className="size-3.5 text-sage/60" /> {data.flashcards.length} Flashcard
                                    </span>
                                 </div>
                              </div>

                              {/* Actions */}
                              <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                 <Link
                                    to="/study/flashcard/$id"
                                    params={{ id: String(mId) }}
                                    search={{ categoryId: classIdNum }}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 h-12 rounded-2xl border border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all"
                                 >
                                    Hafalkan
                                 </Link>
                                 <Link
                                    to="/study/quiz/$id"
                                    params={{ id: String(mId) }}
                                    search={{ categoryId: classIdNum }}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 h-12 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-glow hover:brightness-105 transition-all gap-2"
                                 >
                                    Mulai Kuis <ArrowRight className="size-3.5" />
                                 </Link>
                              </div>
                           </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
               </div>
            )}
          </section>

          {/* Peer List */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <UsersRound className="size-5 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Teman Sekelas</span>
              <div className="h-px flex-1 bg-black/5"></div>
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {members.filter(m => m.id !== Number(user.userId)).map(m => (
                  <div key={m.id} className="bg-white p-3 rounded-2xl border border-black/5 flex items-center gap-2.5 shadow-sm">
                    <div className="size-8 rounded-lg bg-secondary/30 flex items-center justify-center text-muted-foreground/30 shrink-0">
                      <Users className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] leading-tight truncate">{m.fullName || m.username}</p>
                      <p className="text-[9px] text-muted-foreground truncate">@{m.username}</p>
                    </div>
                  </div>
                ))}
                {members.length <= 1 && (
                  <p className="text-[10px] text-muted-foreground italic col-span-full py-4 text-center">Belum ada murid lain di kelas ini.</p>
                )}
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
