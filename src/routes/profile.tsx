import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, User as UserIcon, Save, Loader2, Camera } from "lucide-react";
import { getStoredUser, setStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getStoredUser()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Profil — PinterQ" },
      { name: "description", content: "Kelola data profil PinterQ kamu." },
    ],
  }),
});

function ProfilePage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    const userId = Number(user.userId);
    if (!userId) return;

    setLoading(true);
    api.getProfile(userId)
      .then((data) => {
        setFullName(data.fullName || "");
        setProfileImageUrl(data.profileImageUrl || "");
      })
      .catch(() => setErrorMsg("Gagal memuat profil."))
      .finally(() => setLoading(false));
  }, [user, ready]);

  const handleSave = async () => {
    if (!user) return;
    const userId = Number(user.userId);
    setSaving(true);
    setErrorMsg("");
    try {
      const updated = await api.updateProfile(userId, { fullName, profileImageUrl });
      // Update stored user
      const stored = getStoredUser();
      if (stored) {
        setStoredUser({
          ...stored,
          fullName: updated.fullName || stored.username,
          profileImageUrl: updated.profileImageUrl || "",
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !user) return null;

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="w-full max-w-md rounded-3xl glass-strong p-8 sm:p-10 shadow-soft"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all mb-6">
          <div className="size-8 rounded-full glass flex items-center justify-center shadow-soft">
            <ChevronLeft className="size-3.5" />
          </div>
          Dashboard
        </Link>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="size-10 rounded-2xl flex items-center justify-center shadow-soft bg-primary">
            <UserIcon className="size-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Profil Saya</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary/30" />
          </div>
        ) : (
          <>
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div
                  className="size-24 rounded-full border-4 border-white shadow-soft flex items-center justify-center overflow-hidden bg-secondary"
                  style={profileImageUrl ? { backgroundImage: `url(${profileImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                >
                  {!profileImageUrl && <UserIcon className="size-10 text-muted-foreground/20" />}
                </div>
                <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary flex items-center justify-center shadow-soft opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="size-3 text-white" />
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-3"
            >
              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Username</label>
                <div className="w-full mt-1.5 rounded-2xl border-0 px-4 h-12 bg-secondary text-muted-foreground text-sm font-medium">
                  {user.username}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="cth. Raka Pratama"
                  className="w-full mt-1.5 rounded-2xl border-0 px-4 h-12 focus:outline-none focus:ring-2"
                  style={{ backgroundColor: "var(--color-secondary)" }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Foto Profil (URL)
                </label>
                <input
                  type="url"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="https://contoh.com/foto.jpg"
                  className="w-full mt-1.5 rounded-2xl border-0 px-4 h-12 focus:outline-none focus:ring-2"
                  style={{ backgroundColor: "var(--color-secondary)" }}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Paste link gambar langsung dari internet</p>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                className="w-full h-12 mt-4 rounded-2xl font-semibold text-white shadow-glow flex justify-center items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "var(--color-blush)" }}
              >
                {saving ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : saved ? (
                  "Tersimpan!"
                ) : (
                  <>
                    <Save className="size-4" />
                    Simpan Profil
                  </>
                )}
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </main>
  );
}
