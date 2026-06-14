import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Users, FileText, Loader2, BookOpen, UsersRound, 
  ClipboardCheck, Trophy, Plus, Trash2, Edit3, Sparkles, Send,
  LayoutGrid, ListChecks, Settings2
} from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
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
  const [groupedMaterials, setGroupedMaterials] = useState<Record<number, { id: number; title: string; quizzes: any[]; flashcards: any[] }>>({});
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  const fetchData = async () => {
    if (!ready || !user || isNaN(classIdNum)) return;
    setLoading(true);
    try {
      const [membersData, flashcardsData, quizzesData, allClasses] = await Promise.all([
        api.getClassMembers(classIdNum),
        api.getFlashcards(classIdNum),
        api.getQuizzes(classIdNum),
        api.getTeacherClasses(Number(user.userId))
      ]);

      setMembers(Array.isArray(membersData) ? membersData : []);
      
      const groups: Record<number, { id: number; title: string; quizzes: any[]; flashcards: any[] }> = {};
      
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

      setGroupedMaterials(groups);
      const found = (Array.isArray(allClasses) ? allClasses : []).find((c: any) => c.id === classIdNum);
      setClassData(found || null);
    } catch (err) {
      console.error("Error fetching class data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classIdNum, ready, user]);

  const handleAddTopic = async (generateAI: boolean = false) => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;
    setIsCreatingTopic(true);
    try {
      if (generateAI) {
        await api.generateStudyMaterial(Number(user?.userId), classIdNum, newTopicTitle, newTopicContent);
      } else {
        await api.createMaterial(Number(user?.userId), classIdNum, newTopicTitle, newTopicContent);
      }
      setNewTopicTopicTitle("");
      setNewTopicContent("");
      setIsAddTopicOpen(false);
      fetchData();
    } catch (err) {
      alert("Gagal menambahkan topik");
    } finally {
      setIsCreatingTopic(false);
    }
  };

  const handleDeleteTopic = async (materialId: number) => {
    if (!confirm("Hapus topik ini beserta semua kuis dan flashcard di dalamnya?")) return;
    try {
      await api.deleteMaterial(materialId);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus topik");
    }
  };

  // Add Quiz Modal States
  const [isAddQuizOpen, setIsAddOpenQuiz] = useState(false);
  const [activeMaterialId, setActiveMaterialId] = useState<number | null>(null);
  const [quizForm, setQuizQuizForm] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: ""
  });

  const handleAddQuiz = async () => {
    if (!activeMaterialId) return;
    try {
      await api.createQuiz(activeMaterialId, quizForm);
      setIsAddOpenQuiz(false);
      setQuizQuizForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", explanation: "" });
      fetchData();
    } catch (err) {
      alert("Gagal menambah kuis");
    }
  };

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen w-full bg-[#FBF9F6]">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between glass-strong rounded-[24px] px-6 h-16 shadow-soft border border-white/20">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
            <ChevronLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft">
              <BookOpen className="size-4" />
            </div>
            <span className="font-black tracking-tight text-sm">Mode Guru</span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <section>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="bg-sage/10 text-sage border-0 font-black text-[10px] uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full">
                Detail Ruang Kelas
              </Badge>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">{classData?.name || "Memuat..."}</h1>
                  <div className="flex items-center gap-4 mt-4 text-muted-foreground font-bold">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full shadow-sm border border-black/5">
                       <span className="text-[10px] uppercase tracking-widest opacity-60">KODE:</span>
                       <code className="text-primary font-mono text-sm">{classData?.classCode}</code>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <UsersRound className="size-4 text-sage" />
                       <span className="text-xs uppercase tracking-wider">{members.length} Murid</span>
                    </div>
                  </div>
                </div>

                <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
                  <DialogTrigger asChild>
                    <button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-glow hover:brightness-105 transition-all flex items-center gap-2">
                       <Plus className="size-5" /> Tambah Topik Baru
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl rounded-[40px] glass-strong border-white/20 p-8">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-black tracking-tight">Buat Topik Baru</DialogTitle>
                      <DialogDescription className="text-base font-medium">Topik adalah wadah untuk Kuis dan Flashcard materi tertentu.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Judul Topik</label>
                          <Input 
                            placeholder="Contoh: Dasar-dasar Pemrograman" 
                            value={newTopicTitle} 
                            onChange={e => setNewTopicTopicTitle(e.target.value)}
                            className="h-12 rounded-xl border-black/5 bg-white/50 font-bold"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Isi Materi / Penjelasan</label>
                          <Textarea 
                            placeholder="Tuliskan penjelasan materi di sini..." 
                            value={newTopicContent} 
                            onChange={e => setNewTopicContent(e.target.value)}
                            className="min-h-[150px] rounded-2xl border-black/5 bg-white/50 font-medium p-4"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <Button 
                            variant="outline"
                            onClick={() => handleAddTopic(false)}
                            disabled={isCreatingTopic}
                            className="h-12 rounded-xl border-sage/20 text-sage font-black uppercase tracking-widest"
                          >
                             Manual Saja
                          </Button>
                          <Button 
                            onClick={() => handleAddTopic(true)}
                            disabled={isCreatingTopic}
                            className="h-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-soft gap-2"
                          >
                             {isCreatingTopic ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                             Bantu Pakai AI
                          </Button>
                       </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          </section>

          {/* Topics Grid */}
          <section className="space-y-12">
            <div className="flex items-center gap-3">
              <LayoutGrid className="size-5 text-sage" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sage">Kurikulum & Materi</span>
              <div className="h-px flex-1 bg-black/5"></div>
            </div>

            {loading ? (
               <div className="flex justify-center py-20"><Loader2 className="size-10 animate-spin text-primary/20" /></div>
            ) : Object.keys(groupedMaterials).length === 0 ? (
               <div className="text-center py-24 glass rounded-[40px] border border-dashed border-border/50">
                  <LayoutGrid className="size-16 mx-auto text-muted-foreground/10 mb-4" />
                  <p className="text-base font-bold text-muted-foreground/40 italic">Belum ada topik materi</p>
                  <p className="text-xs text-muted-foreground/30 mt-1">Gunakan tombol 'Tambah Topik' untuk membuat modul belajar</p>
               </div>
            ) : (
               <div className="space-y-12">
                  {Object.entries(groupedMaterials).map(([mId, data]) => (
                    <motion.div 
                      key={mId} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="group"
                    >
                      <Card className="border-0 shadow-soft bg-white/40 rounded-[40px] overflow-hidden">
                        <CardContent className="p-0">
                           <div className="p-8 sm:p-10 flex flex-col md:flex-row gap-10">
                              {/* Topic Info */}
                              <div className="flex-1 space-y-6">
                                 <div className="flex items-start justify-between">
                                    <div>
                                       <h3 className="text-2xl font-black tracking-tight text-foreground">{data.title}</h3>
                                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Topik ID: #{mId}</p>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteTopic(data.id)}
                                      className="size-10 rounded-full glass border border-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
                                    >
                                       <Trash2 className="size-4" />
                                    </button>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 rounded-3xl bg-blue-50/50 border border-blue-100 flex flex-col gap-1">
                                       <ClipboardCheck className="size-5 text-blue-600 mb-2" />
                                       <span className="text-2xl font-black text-blue-700">{data.quizzes.length}</span>
                                       <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">Kuis Tersedia</span>
                                    </div>
                                    <div className="p-5 rounded-3xl bg-purple-50/50 border border-purple-100 flex flex-col gap-1">
                                       <FileText className="size-5 text-purple-600 mb-2" />
                                       <span className="text-2xl font-black text-purple-700">{data.flashcards.length}</span>
                                       <span className="text-[10px] font-black uppercase tracking-widest text-purple-600/60">Kartu Hafalan</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Question Preview / Actions */}
                              <div className="md:w-72 flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-black/5 pt-8 md:pt-0 md:pl-10">
                                 <Dialog open={isAddQuizOpen && activeMaterialId === data.id} onOpenChange={(open) => { setIsAddOpenQuiz(open); if(open) setActiveMaterialId(data.id); }}>
                                    <DialogTrigger asChild>
                                       <Button variant="outline" className="h-12 rounded-2xl border-black/5 bg-white/50 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm">
                                          <Plus className="size-4 mr-2" /> Tambah Soal
                                       </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-2xl rounded-[40px] glass-strong p-8">
                                       <DialogHeader>
                                          <DialogTitle className="text-2xl font-black">Tambah Soal Kuis</DialogTitle>
                                          <DialogDescription>Topik: {data.title}</DialogDescription>
                                       </DialogHeader>
                                       <div className="space-y-4 pt-4">
                                          <div className="space-y-1">
                                             <label className="text-[10px] font-black uppercase text-muted-foreground">Pertanyaan</label>
                                             <Textarea value={quizForm.question} onChange={e => setQuizQuizForm({...quizForm, question: e.target.value})} className="rounded-xl" />
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                             <Input placeholder="Opsi A" value={quizForm.optionA} onChange={e => setQuizQuizForm({...quizForm, optionA: e.target.value})} />
                                             <Input placeholder="Opsi B" value={quizForm.optionB} onChange={e => setQuizQuizForm({...quizForm, optionB: e.target.value})} />
                                             <Input placeholder="Opsi C" value={quizForm.optionC} onChange={e => setQuizQuizForm({...quizForm, optionC: e.target.value})} />
                                             <Input placeholder="Opsi D" value={quizForm.optionD} onChange={e => setQuizQuizForm({...quizForm, optionD: e.target.value})} />
                                          </div>
                                          <div className="flex items-center gap-4">
                                             <label className="text-[10px] font-black uppercase text-muted-foreground">Jawaban Benar:</label>
                                             <select value={quizForm.correctAnswer} onChange={e => setQuizQuizForm({...quizForm, correctAnswer: e.target.value})} className="h-10 rounded-lg border px-3">
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                             </select>
                                          </div>
                                          <Button onClick={handleAddQuiz} className="w-full h-12 rounded-xl bg-primary font-black uppercase">Simpan Soal</Button>
                                       </div>
                                    </DialogContent>
                                 </Dialog>

                                 <Button variant="outline" className="h-12 rounded-2xl border-black/5 bg-white/50 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm">
                                    <ListChecks className="size-4 mr-2" /> Kelola Semua
                                 </Button>
                                 
                                 <button onClick={() => { setNewTopicTopicTitle(data.title); handleAddTopic(true); }} className="h-12 rounded-2xl bg-sage text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-soft flex items-center justify-center gap-2 hover:brightness-105 transition-all">
                                    <Sparkles className="size-4" /> Generate Lagi
                                 </button>
                              </div>
                           </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
               </div>
            )}
          </section>

          {/* Student List Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <UsersRound className="size-5 text-sage" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sage">Daftar Anggota Kelas</span>
              <div className="h-px flex-1 bg-black/5"></div>
            </div>

            <div className="glass-strong rounded-[40px] p-2 border border-white/20 overflow-hidden shadow-soft">
               <div className="max-h-72 overflow-y-auto custom-scrollbar p-6 space-y-3">
                  {members.length === 0 ? (
                     <p className="text-sm font-bold text-muted-foreground/40 italic text-center py-10">Belum ada murid yang bergabung.</p>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {members.map(m => (
                           <div key={m.id} className="flex items-center gap-4 p-4 rounded-3xl bg-white/50 border border-black/5 group hover:bg-white transition-colors">
                              <div className="size-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                 <Users className="size-6" />
                              </div>
                              <div className="min-w-0">
                                 <p className="font-black text-sm text-foreground truncate">{m.fullName || m.username}</p>
                                 <p className="text-[10px] font-bold text-muted-foreground truncate">@{m.username}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
