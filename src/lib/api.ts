import { getToken } from "./auth";

// Gunakan environment variable atau fallback ke production URL
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://api-aucloire.stei.my.id/api").replace(/\/$/, "");

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login gagal");
    }
    return res.json();
  },

  register: async (username: string, email: string, password: string, role: string, fullName?: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role, fullName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Registrasi gagal");
    }
    return res.json();
  },

  getProfile: async (userId?: number) => {
    // If userId is provided, use it, otherwise use the /profile endpoint
    const url = userId ? `${BASE_URL}/auth/profile/${userId}` : `${BASE_URL}/auth/profile`;
    const res = await fetch(url, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil profil");
    return res.json();
  },

  updateProfile: async (userId: number, updates: any) => {
    const res = await fetch(`${BASE_URL}/auth/profile/${userId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Gagal memperbarui profil");
    return res.json();
  },

  // === CLASSES ===
  getTeacherClasses: async (teacherId: number) => {
    const res = await fetch(`${BASE_URL}/classes/my/${teacherId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil daftar kelas");
    return res.json();
  },

  getStudentJoinedClasses: async (studentId: number) => {
    const res = await fetch(`${BASE_URL}/classes/student/${studentId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil daftar kelas");
    return res.json();
  },

  createClass: async (data: any) => {
    const res = await fetch(`${BASE_URL}/classes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Gagal membuat kelas");
    return res.json();
  },

  joinClass: async (studentId: number, classCode: string) => {
    const res = await fetch(`${BASE_URL}/classes/join`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ studentId, classCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Gagal bergabung ke kelas");
    }
    return res.json();
  },

  getClassMembers: async (classId: number) => {
    const res = await fetch(`${BASE_URL}/classes/${classId}/members`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil daftar murid");
    return res.json();
  },

  // === CATEGORIES (SUBJECTS) ===
  getCategories: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/categories/user/${userId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil kategori");
    return res.json();
  },

  createCategory: async (userId: number, name: string) => {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId, name }),
    });
    if (!res.ok) throw new Error("Gagal membuat kategori baru");
    return res.json();
  },

  // === AI GENERATION ===
  generateStudyMaterial: async (userId: number, categoryId: number, title: string, content: string, materialId?: number) => {
    const res = await fetch(`${BASE_URL}/study/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId, categoryId, title, content, materialId }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Gagal generate materi");
    }
    return res.json();
  },

  generateAdaptive: async (categoryId: number, difficulty: string) => {
    const res = await fetch(`${BASE_URL}/study/generate-adaptive`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ categoryId, difficulty }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Gagal generate kuis adaptif");
    }
    return res.text();
  },

  // === MATERI (TOPICS) ===
  createMaterial: async (userId: number, categoryId: number, title: string, content: string) => {
    const res = await fetch(`${BASE_URL}/study/materials`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId, categoryId, title, content }),
    });
    if (!res.ok) throw new Error("Gagal membuat topik");
    return res.json();
  },

  deleteMaterial: async (id: number) => {
    const res = await fetch(`${BASE_URL}/study/materials/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal menghapus materi");
    return res.text();
  },

  // === QUIZZES CRUD ===
  createQuiz: async (materialId: number, data: any) => {
    const res = await fetch(`${BASE_URL}/study/quizzes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ materialId, ...data }),
    });
    if (!res.ok) throw new Error("Gagal membuat kuis");
    return res.json();
  },

  deleteQuiz: async (quizId: number) => {
    const res = await fetch(`${BASE_URL}/study/quizzes/${quizId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal menghapus kuis");
    return res.text();
  },

  // === FLASHCARDS CRUD ===
  createFlashcard: async (materialId: number, data: any) => {
    const res = await fetch(`${BASE_URL}/study/flashcards`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ materialId, ...data }),
    });
    if (!res.ok) throw new Error("Gagal membuat flashcard");
    return res.json();
  },

  deleteFlashcard: async (flashcardId: number) => {
    const res = await fetch(`${BASE_URL}/study/flashcards/${flashcardId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal menghapus flashcard");
    return res.text();
  },

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

  getMaterials: async (categoryId: number) => {
    const res = await fetch(`${BASE_URL}/study/materials/${categoryId}`);
    if (!res.ok) throw new Error("Gagal mengambil materi");
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

  deleteUser: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/admin/${userId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal menghapus user");
    return res.text();
  },

  // === NOTIFICATIONS ===
  getNotifications: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/notifications?userId=${userId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil notifikasi");
    return res.json();
  },

  markNotificationAsRead: async (notificationId: number) => {
    const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal menandai notifikasi");
    return res.json();
  },
};
