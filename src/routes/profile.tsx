import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, User as UserIcon, Save, Loader2, Camera, X } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [username, setUsername] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    const userId = Number(user.userId);
    if (!userId) return;

    setLoading(true);
    api.getProfile(userId)
      .then((data) => {
        setFullName(data.fullName || "");
        setProfileImageUrl(data.profileImageUrl || "");
        setUsername(data.username);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, ready]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB.");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setProfileImageUrl(base64);
    } catch {
      alert("Gagal memproses gambar.");
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUsernameBlur = async () => {
    if (!username.trim()) return;
    const stripped = username.trim().startsWith("@") ? username.trim().slice(1) : username.trim();
    setDuplicateError("");
    try {
      const res = await api.checkUsernameAvailability(stripped);
      if (!res.available) {
        setDuplicateError("Username sudah dipakai.");
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (duplicateError) return;

    const stripped = username.trim().startsWith("@") ? username.trim().slice(1) : username.trim();
    setSaving(true);
    setErrorMsg("");
    try {
      const updated = await api.updateProfile(Number(user.userId), {
        fullName: fullName || undefined,
        username: stripped || undefined,
        profileImageUrl: profileImageUrl || undefined,
      });
      const stored = getStoredUser();
      if (stored) {
        setStoredUser({
          ...stored,
          fullName: updated.fullName || updated.username || stripped,
          profileImageUrl: updated.profileImageUrl || "",
        });
        // Also update the session username so sidebar reflects it
        setStoredUser({ ...stored, username: stripped });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState("");

  if (!ready || !user) return null;

  const displayUsername = username.startsWith("@") ? username : "@" + username;

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
                  className="size-20 rounded-full border-3 border-white shadow-soft flex items-center justify-center overflow-hidden bg-secondary"
                  style={profileImageUrl ? { backgroundImage: `url(${profileImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                >
                  {!profileImageUrl && <UserIcon className="size-8 text-muted-foreground/20" />}
                </div>
                {/* Pencil button — always visible, not hover-only */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary flex items-center justify-center shadow-soft hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="size-3.5 animate-spin text-white" />
                  ) : (
                    <Camera className="size-3 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {/* Clear image button */}
                {profileImageUrl && (
                  <button
                    type="button"
                    onClick={() => setProfileImageUrl("")}
                    className="absolute -top-1 -left-1 size-5 rounded-full bg-destructive/80 flex items-center justify-center shadow-soft hover:bg-destructive transition opacity-0 group-hover:opacity-100"
                  >
                    <X className="size-2.5 text-white" />
                  </button>
                )}
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
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Username
                </label>
                <input
                  type="text"
                  value={displayUsername}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setDuplicateError("");
                  }}
                  onBlur={handleUsernameBlur}
                  placeholder="@username"
                  className={`w-full mt-1.5 rounded-2xl border-0 px-4 h-12 focus:outline-none focus:ring-2 text-sm font-medium ${duplicateError ? "ring-2 ring-destructive/50" : ""}`}
                  style={{ backgroundColor: "var(--color-secondary)" }}
                />
                {duplicateError && (
                  <p className="text-xs text-destructive mt-1 font-medium">{duplicateError}</p>
                )}
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

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving || !!duplicateError}
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
