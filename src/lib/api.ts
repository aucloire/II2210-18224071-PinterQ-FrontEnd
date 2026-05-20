const BASE_URL = "http://localhost:8080/api";

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

  register: async (username: string, email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name }),
    });
    if (!res.ok) throw new Error("Gagal membuat mata kuliah baru");
    return res.json();
  },

  // === AI GENERATION ===
  generateStudyMaterial: async (userId: number, categoryId: number, title: string, content: string) => {
    const res = await fetch(`${BASE_URL}/study/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, categoryId, title, content }),
    });
    if (!res.ok) throw new Error("Gagal generate materi");
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
  }
};