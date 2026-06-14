import { getToken } from "./auth";

// Gunakan environment variable atau fallback ke production URL
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://api-aucloire.stei.my.id/api").replace(/\/$/, "");

function authHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export const api = {
  // === AUTH ===
  login: async (username: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Gagal login");
    }
    return res.json();
  },

  // === CATEGORIES ===
  getPublicCategories: async () => {
    const res = await fetch(`${BASE_URL}/categories/public`);
    if (!res.ok) throw new Error("Gagal mengambil kategori publik");
    return res.json();
  },

  register: async (username: string, email: string, password: string, role: string = "MURID") => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Gagal register");
    }
    return res.json();
  },

  // === FOLDERS / SUBJECTS ===
  getCategories: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/categories/user/${userId}`);
    if (!res.ok) throw new Error("Gagal mengambil mata kuliah");
    return res.json();
  },

  createCategory: async (userId: number, name: string) => {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId, name }),
    });
    if (!res.ok) throw new Error("Gagal membuat mata kuliah baru");
    return res.json();
  },

  // === AI GENERATION ===
  generateStudyMaterial: async (userId: number, categoryId: number, title: string, content: string) => {
    const res = await fetch(`${BASE_URL}/study/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId, categoryId, title, content }),
    });
    if (!res.ok) throw new Error("Gagal generate materi");
    return res.text();
  },

  generateAdaptive: async (categoryId: number, difficulty: string) => {
    const res = await fetch(`${BASE_URL}/study/generate-adaptive`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ categoryId, difficulty }),
    });
    if (!res.ok) throw new Error("Gagal generate kuis adaptif");
    return res.text();
  },

  // === GET MATERI ===
  getFlashcards: async (categoryId: number) => {
    const res = await fetch(`${BASE_URL}/study/flashcards/${categoryId}`);
    if (!res.ok) throw new Error("Gagal mengambil flashcard");
    return res.json();
  },

  getQuizzes: async (categoryId: number) => {
    const res = await fetch(`${BASE_URL}/study/quizzes/${categoryId}`);
    if (!res.ok) throw new Error("Gagal mengambil quiz");
    return res.json();
  },

  // === QUIZ SUBMISSION ===
  submitQuizAttempt: async (userId: number, materialId: number, score: number) => {
    const res = await fetch(`${BASE_URL}/study/submit-attempt`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId, materialId, score }),
    });
    if (!res.ok) throw new Error("Gagal submit jawaban");
    return res.json();
  },

  getQuizHistory: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/study/history/${userId}`);
    if (!res.ok) throw new Error("Gagal mengambil riwayat kuis");
    return res.json();
  },

  // === ADMIN ===
  getPendingUsers: async () => {
    const res = await fetch(`${BASE_URL}/admin/pending-users`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil daftar user");
    return res.json();
  },

  getAllUsers: async () => {
    const res = await fetch(`${BASE_URL}/admin/all-users`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil semua user");
    return res.json();
  },

  approveUser: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/admin/approve/${userId}`, {
      method: "PUT",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal approve user");
    return res.json();
  },

  rejectUser: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/admin/reject/${userId}`, {
      method: "PUT",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal reject user");
    return res.json();
  },

  setRole: async (userId: number, role: string) => {
    const res = await fetch(`${BASE_URL}/admin/set-role/${userId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error("Gagal mengubah role");
    return res.json();
  },

  deleteUser: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/admin/${userId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal menghapus pengguna");
    return res.json();
  },

  // === PROFILE ===
  getProfile: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil profil");
    return res.json();
  },

  updateProfile: async (userId: number, data: { fullName?: string; username?: string; profileImageUrl?: string }) => {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Gagal memperbarui profil");
    return res.json();
  },
};
