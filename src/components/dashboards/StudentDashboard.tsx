import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, BookOpen, FileText, Copy, Loader2, Sparkles, ArrowRight, Trophy
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { FlashcardCarousel, QuizRunner } from "@/components/study";
import type { QuizQuestion } from "@/components/study";

interface JoinedClass {
  id: number;
  name: string;
  classCode: string;
  memberCount: number;
  createdAt: string;
}

interface MaterialItem {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  category?: { id: number; name: string };
}

interface FlashcardItem {
  id: number;
  question: string;
  answer: string;
}

export function StudentDashboard({ studentId, studentName }: { studentId: number; studentName: string }) {
  // Classes section
  const [joinedClasses, setJoinedClasses] = useState<JoinedClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  // Self-Study section
  const [selfStudyCategories, setSelfStudyCategories] = useState<{ id: number; name: string }[]>([]);
  const [selfLoading, setSelfLoading] = useState(true);

  // Active study selection
  const [activeTab, setActiveTab] = useState<"class" | "self">("class");
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [studyItemType, setStudyItemType] = useState<"class" | "self" | null>(null);

  // Study content
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [loadingStudy, setLoadingStudy] = useState(false);

  // Join class modal
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Self-study create modal
  const [createCatOpen, setCreateCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    loadJoinedClasses();
    loadSelfStudyCategories();
  }, [studentId]);

  // Load all classes (not just joined) — will need a backend endpoint
  const loadJoinedClasses = async () => {
    setClassesLoading(true);
    try {
      const data = await api.getStudentJoinedClasses(studentId);
      setJoinedClasses(data);
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setClassesLoading(false);
    }
  };

  const loadSelfStudyCategories = async () => {
    setSelfLoading(true);
    try {
      const cats = await api.getCategories(studentId);
      // Filter: only show categories WITHOUT classGroupId (self-study only)
      setSelfStudyCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setSelfLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await api.joinClass(studentId, joinCode.trim().toUpperCase());
      setJoinCode("");
      setJoinOpen(false);
      loadJoinedClasses();
    } catch (err: any) {
      alert(err.message || "Gagal bergabung ke kelas");
    } finally {
      setJoining(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreating(true);
    try {
      const newCat = await api.createCategory(studentId, newCatName.trim());
      setSelfStudyCategories(prev => [...prev, { id: newCat.id, name: newCat.name }]);
      setNewCatName("");
      setCreateCatOpen(false);
    } catch (err) {
      alert("Gagal membuat kategori self-study");
    } finally {
      setCreating(false);
    }
  };

  const loadStudyContent = async (itemId: number, type: "class" | "self") => {
    setLoadingStudy(true);
    setActiveItemId(itemId);
    setStudyItemType(type);
    try {
      const [rawCards, rawQuizzes] = await Promise.all([
        api.getFlashcards(itemId),
        api.getQuizzes(itemId),
      ]);
      setFlashcards(rawCards);
      const mappedQuizzes: QuizQuestion[] = rawQuizzes.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
        correctIndex: ["A", "B", "C", "D"].indexOf(q.correctAnswer),
        explanation: q.explanation,
        materialId: q.material?.id,
      }));
      setQuizzes(mappedQuizzes);
    } catch (err) {
      console.error("Failed to load study content:", err);
    } finally {
      setLoadingStudy(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Halo, {studentName}! 👋</h2>
          <p className="text-sm text-muted-foreground">Pilih kelas atau mulai belajar mandiri</p>
        </div>
        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-sm">
              <Plus className="size-4 mr-1.5" /> Bergabung ke Kelas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Bergabung ke Kelas</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Masukkan kode kelas"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleJoinClass()}
              />
              <Button onClick={handleJoinClass} disabled={!joinCode.trim() || joining} className="w-full">
                {joining ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <ArrowRight className="size-4 mr-1.5" />}
                Gabung Kelas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 glass-strong rounded-xl inline-flex">
        <button
          onClick={() => setActiveTab("class")}
          className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "class" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Kelas Saya
        </button>
        <button
          onClick={() => setActiveTab("self")}
          className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "self" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Self-Study
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Classes Section */}
        {activeTab === "class" && (
          <motion.section
            key="classes"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {classesLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary/30" /></div>
            ) : joinedClasses.length === 0 ? (
              <div className="text-center py-16 glass rounded-2xl border border-dashed">
                <BookOpen className="size-10 mx-auto text-muted-foreground/10 mb-3" />
                <h3 className="text-sm font-bold text-muted-foreground/30 italic">Belum bergabung di kelas manapun</h3>
                <p className="text-xs text-muted-foreground mt-1">Gunakan kode kelas dari guru untuk bergabung</p>
              </div>
            ) : (
              joinedClasses.map(cls => (
                <Card key={cls.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold">{cls.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Kode: <code className="bg-secondary px-1.5 py-0.5 rounded font-mono text-xs">{cls.classCode}</code>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{cls.memberCount} murid bergabung</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.section>
        )}

        {/* Self-Study Section */}
        {activeTab === "self" && (
          <motion.section
            key="self"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="size-4 text-primary" />
                Kategori Saya
              </h3>
              <Dialog open={createCatOpen} onOpenChange={setCreateCatOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-sm text-xs">
                    <Plus className="size-3.5 mr-1" /> Tambah Kategori
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Kategori Self-Study Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Nama kategori (cth. Algoritma)"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreateCategory()}
                    />
                    <Button onClick={handleCreateCategory} disabled={!newCatName.trim() || creating} className="w-full">
                      {creating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
                      Tambah
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selfLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary/30" /></div>
            ) : selfStudyCategories.length === 0 ? (
              <div className="text-center py-12 glass rounded-2xl border border-dashed">
                <Sparkles className="size-8 mx-auto text-muted-foreground/10 mb-2" />
                <p className="text-xs text-muted-foreground/30">Belum ada kategori self-study</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selfStudyCategories.map(cat => (
                  <Card
                    key={cat.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => loadStudyContent(cat.id, "self")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm">{cat.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Klik untuk melihat materi</p>
                        </div>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px]">Self-Study</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Study Content Area */}
      {(activeItemId !== null && studyItemType !== null) && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {studyItemType === "class" ? "Kelas" : "Self-Study"} — Materi
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setActiveItemId(null); setStudyItemType(null); }}
              className="text-muted-foreground text-xs">
              Tutup
            </Button>
          </div>

          {loadingStudy ? (
            <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary/30" /></div>
          ) : (
            <div className="space-y-6">
              {/* Flashcards */}
              <div>
                <h4 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="size-4" /> Flashcard
                </h4>
                {flashcards.length > 0 ? (
                  <FlashcardCarousel cards={flashcards} />
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 glass rounded-xl text-center">Belum ada flashcard di sini</p>
                )}
              </div>

              {/* Quizzes */}
              <div>
                <h4 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Trophy className="size-4" /> Kuis
                </h4>
                {quizzes.length > 0 ? (
                  <QuizRunner questions={quizzes} onGenerateAdaptive={() => {}} onComplete={() => {}} />
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 glass rounded-xl text-center">Belum ada kuis di sini</p>
                )}
              </div>
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}
