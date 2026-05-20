import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { getStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api"; // <-- Import jembatan API kita

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: () => {
    if (typeof window !== "undefined" && getStoredUser()) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Login — PinterQ" },
      { name: "description", content: "Masuk ke PinterQ untuk mulai belajar dengan flashcard & kuis AI." },
    ],
  }),
});

function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); // <-- Tambahan state Email
  const [password, setPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false); // <-- Tambahan state Loading
  const [errorMsg, setErrorMsg] = useState(""); // <-- Tambahan state Error

  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    if (mode === "register" && !email.trim()) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      let data;
      if (mode === "login") {
        data = await api.login(username, password);
      } else {
        data = await api.register(username, email, password);
      }

      // Simpan data kunci ke localStorage agar bisa dipakai di halaman lain
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);

      // Sinkronisasi dengan context bawaan frontend
      login(data.username); 
      
      // Redirect ke halaman utama
      navigate({ to: "/" });
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghubungi server. Pastikan Backend menyala.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="w-full max-w-md rounded-3xl glass-strong p-8 sm:p-10 shadow-soft"
      >
        <div className="flex items-center gap-2.5 mb-6">
          <div
            className="size-10 rounded-2xl flex items-center justify-center shadow-soft"
            style={{ backgroundColor: "var(--color-blush)" }}
          >
            <Sparkles className="size-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">PinterQ</span>
        </div>

        <h1 className="text-3xl font-bold leading-tight">
          {mode === "login" ? "Selamat datang kembali" : "Buat akun baru"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Masuk untuk lanjut belajar lebih asik."
            : "Daftar untuk menyimpan materi belajarmu secara cerdas."}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          {/* Tampilan Error Banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Username
            </label>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cth. raka_mhs"
              className="w-full mt-1.5 rounded-2xl border-0 px-4 h-12 focus:outline-none focus:ring-2"
              style={{ backgroundColor: "var(--color-secondary)" }}
            />
          </div>

          {/* Kolom Email (Muncul dengan animasi hanya saat Register) */}
          <AnimatePresence>
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="py-1">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cth. raka@student.com"
                    className="w-full mt-1.5 rounded-2xl border-0 px-4 h-12 focus:outline-none focus:ring-2"
                    style={{ backgroundColor: "var(--color-secondary)" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1.5 rounded-2xl border-0 px-4 h-12 focus:outline-none focus:ring-2"
              style={{ backgroundColor: "var(--color-secondary)" }}
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!username.trim() || !password.trim() || isLoading}
            className="w-full h-12 mt-4 rounded-2xl font-semibold text-white shadow-glow flex justify-center items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-blush)" }}
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" /> // Animasi Muter
            ) : mode === "login" ? (
              "Masuk"
            ) : (
              "Daftar & masuk"
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm mt-6 text-muted-foreground">
          {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrorMsg(""); // Reset error saat ganti mode
            }}
            className="font-semibold text-foreground hover:underline"
          >
            {mode === "login" ? "Daftar" : "Masuk"}
          </button>
        </p>
      </motion.div>
    </main>
  );
}