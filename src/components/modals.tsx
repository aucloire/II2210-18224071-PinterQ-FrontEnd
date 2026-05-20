import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";

type Subject = { id: number; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  defaultSubjectId: number;
  // Perubahan penting: Menerima teks!
  onGenerate: (subjectId: number, text: string) => Promise<void>; 
};

export function GenerateModal({ open, onClose, subjects, defaultSubjectId, onGenerate }: Props) {
  const [text, setText] = useState("");
  const [subjectId, setSubjectId] = useState<number>(defaultSubjectId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSubjectId(defaultSubjectId);
      setText(""); // Reset form saat dibuka
    }
  }, [open, defaultSubjectId]);

  const submit = async () => {
    if (!text.trim() || loading || !subjectId) return;
    setLoading(true);
    
    try {
      await onGenerate(subjectId, text); // Mengirim data asli ke Backend
      onClose(); // Tutup modal hanya kalau sukses
    } catch (e) {
      // Error sudah di-handle di index.tsx
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!loading ? onClose : undefined} // Cegah tutup saat loading
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-soft"
            style={{ backgroundColor: "var(--color-background)" }}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-oak)" }}>
                  Generate New
                </span>
                <h2 className="text-2xl font-bold mt-1">Materi baru → flashcards & kuis</h2>
              </div>
              {!loading && (
                <button
                  onClick={onClose}
                  className="size-9 rounded-full glass flex items-center justify-center hover:bg-white/70"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <label className="text-sm font-medium block mb-2">Pilih Mata Kuliah</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: subjectId === s.id ? "var(--color-blush)" : "var(--color-secondary)",
                    color: subjectId === s.id ? "white" : "var(--color-foreground)",
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <label className="text-sm font-medium block mb-2">Catatan/Materi Kuliah</label>
            <div className="rounded-2xl glass-strong p-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste catatan atau paragraf buku teksmu di sini..."
                className="w-full min-h-[180px] resize-none rounded-xl bg-transparent p-4 text-base placeholder:text-muted-foreground/70 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              {!loading && (
                <button
                  onClick={onClose}
                  className="px-4 h-11 rounded-2xl font-medium text-muted-foreground hover:text-foreground transition"
                >
                  Batal
                </button>
              )}
              <motion.button
                onClick={submit}
                disabled={loading || !text.trim()}
                whileHover={{ scale: loading || !text.trim() ? 1 : 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="h-11 px-5 rounded-2xl font-semibold text-white shadow-glow disabled:opacity-50 inline-flex items-center gap-2"
                style={{ backgroundColor: "var(--color-blush)" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Menyihir AI...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" /> Generate
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==========================================
// NewSubjectModal dibiarkan seperti bawaannya
// ==========================================
type NewSubjectProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, emoji: string) => void;
};

const EMOJIS = ["📚", "🧪", "📐", "🎨", "💻", "🤖", "📈", "🌍", "🎯", "🚀"];

export function NewSubjectModal({ open, onClose, onCreate }: NewSubjectProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), emoji);
    setName("");
    setEmoji(EMOJIS[0]);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl p-6 shadow-soft"
            style={{ backgroundColor: "var(--color-background)" }}
          >
            <h3 className="text-xl font-bold mb-1">Subjek baru</h3>
            <p className="text-sm text-muted-foreground mb-5">Tambahkan mata kuliah atau topik.</p>

            <label className="text-sm font-medium block mb-2">Nama Mata Kuliah</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Basis Data"
              className="w-full rounded-2xl border-0 px-4 h-12 mb-4 focus:outline-none focus:ring-2"
              style={{ backgroundColor: "var(--color-secondary)" }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />

            <label className="text-sm font-medium block mb-2">Ikon</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className="size-10 rounded-xl text-xl transition-all"
                  style={{
                    backgroundColor: emoji === e ? "var(--color-blush)" : "var(--color-secondary)",
                    transform: emoji === e ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 h-11 rounded-2xl font-medium text-muted-foreground hover:text-foreground"
              >
                Batal
              </button>
              <button
                onClick={submit}
                disabled={!name.trim()}
                className="h-11 px-5 rounded-2xl font-semibold text-white shadow-glow disabled:opacity-50"
                style={{ backgroundColor: "var(--color-blush)" }}
              >
                Tambah
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}