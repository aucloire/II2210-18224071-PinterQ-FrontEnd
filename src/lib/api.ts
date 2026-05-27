import { getToken } from "./auth";

const BASE_URL = "https://api-aucloire.stei.my.id/api";

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
    if (!res.ok) throw new Error("Gagal login");
    return res.json();
  },

  register: async (username: string, email: string, password: string, role: string = "USER") => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    });
    if (!res.ok) throw new Error("Gagal register");
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
    const res = await fetch(`${BASE_URL}/study/quiz-attempt`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId, materialId, score }),
    });
    if (!res.ok) throw new Error("Gagal submit jawaban");
    return res.json();
  },

  getQuizHistory: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/study/quiz-history/${userId}`);
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
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal reject user");
    return res.json();
  },
};