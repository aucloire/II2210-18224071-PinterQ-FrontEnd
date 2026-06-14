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

  // === MATERI (TOPICS) ===
  createMaterial: async (userId: number, categoryId: number, title: string, content: string) => {
    const res = await fetch(`${BASE_URL}/study/materials`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId, categoryId, title, content }),
    });
    if (!res.ok) throw new Error("Gagal membuat materi");
    return res.json();
  },

  updateMaterial: async (materialId: number, data: { title?: string; content?: string }) => {
    const res = await fetch(`${BASE_URL}/study/materials/${materialId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Gagal memperbarui materi");
    return res.json();
  },

  deleteMaterial: async (materialId: number) => {
    const res = await fetch(`${BASE_URL}/study/materials/${materialId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal menghapus materi");
    return res.json();
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Gagal memperbarui profil");
    }
    return res.json();
  },

  checkUsernameAvailability: async (username: string) => {
    const res = await fetch(`${BASE_URL}/users/check-username?username=${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error("Gagal cek username");
    return res.json();
  },

  // === CLASSES ===
  createClass: async (name: string, teacherId: number) => {
    const res = await fetch(`${BASE_URL}/classes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name, teacherId }),
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

  getTeacherClasses: async (teacherId: number) => {
    const res = await fetch(`${BASE_URL}/classes/my/${teacherId}`);
    if (!res.ok) throw new Error("Gagal mengambil daftar kelas");
    return res.json();
  },

  getClassMembers: async (classId: number) => {
    const res = await fetch(`${BASE_URL}/classes/${classId}/members`);
    if (!res.ok) throw new Error("Gagal mengambil anggota kelas");
    return res.json();
  },

  getTeacherStudents: async (teacherId: number) => {
    const res = await fetch(`${BASE_URL}/classes/students/${teacherId}`);
    if (!res.ok) throw new Error("Gagal mengambil daftar murid");
    return res.json();
  },

  getStudentJoinedClasses: async (studentId: number) => {
    const res = await fetch(`${BASE_URL}/classes/student/${studentId}`);
    if (!res.ok) throw new Error("Gagal mengambil kelas yang diikuti");
    return res.json();
  },

  deleteClass: async (classId: number) => {
    const res = await fetch(`${BASE_URL}/classes/${classId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal menghapus kelas");
    return res.json();
  },

  // === NOTIFICATIONS ===
  getNotifications: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/notifications?userId=${userId}`);
    if (!res.ok) throw new Error("Gagal mengambil notifikasi");
    return res.json();
  },

  markNotificationRead: async (notificationId: number) => {
    const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal menandai notifikasi");
    return res.json();
  },
};
