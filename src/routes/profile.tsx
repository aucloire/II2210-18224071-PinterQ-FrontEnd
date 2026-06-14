import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, User as UserIcon, Save, Loader2, X, Link2, Upload
} from "lucide-react";
import { getStoredUser, setStoredUser, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [errorMsg, setErrorMsg] = useState("");

  // Upload modal state
  const [imageUrl, setImageUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setProfileImageUrl(base64);
      setIsOpen(false);
      setImageUrl("");
    } catch {
      alert("Gagal memproses gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) return;
    setProfileImageUrl(imageUrl.trim());
    setIsOpen(false);
    setImageUrl("");
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
          username: stripped,
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
            {/* Avatar with overlay */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div
                  className="w-32 h-32 rounded-full border-4 border-white shadow-soft flex items-center justify-center overflow-hidden bg-secondary"
                  style={profileImageUrl ? { backgroundImage: `url(${profileImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                >
                  {!profileImageUrl && <UserIcon className="w-14 h-14 text-muted-foreground/20" />}
                </div>

                {/* Overlay — hover only */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="size-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition disabled:opacity-50"
                    title="Upload dari perangkat"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </button>
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="size-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition"
                        title="Masukkan URL gambar"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>URL Gambar Profil</DialogTitle>
                        <DialogDescription>
                          Tempel link gambar langsung dari internet (misal Google Drive, Imgur, dll).
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="avatar-url">Link gambar</Label>
                          <Input
                            id="avatar-url"
                            type="url"
                            placeholder="https://contoh.com/foto.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUrlSubmit();
                            }}
                          />
                        </div>
                        <Button onClick={handleUrlSubmit} className="w-full" disabled={!imageUrl.trim()}>
                          <Link2 className="w-4 h-4 mr-2" />
                          Gunakan Gambar Ini
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Upload file input */}
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
                    className="absolute -top-1.5 -left-1.5 size-6 rounded-full bg-destructive flex items-center justify-center shadow-soft hover:bg-red-600 transition scale-0 group-hover:scale-100"
                  >
                    <X className="w-3 h-3 text-white" />
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
