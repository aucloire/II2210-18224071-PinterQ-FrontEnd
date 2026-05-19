import type { Flashcard, QuizQuestion } from "@/components/study";

export type Subject = { id: string; name: string; emoji: string };

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "basis-data", name: "Basis Data", emoji: "🗄️" },
  { id: "manajemen-proyek", name: "Manajemen Proyek", emoji: "📊" },
  { id: "kecerdasan-buatan", name: "Kecerdasan Buatan", emoji: "🧠" },
  { id: "teknologi-platform", name: "Teknologi Platform", emoji: "🛰️" },
  { id: "rekayasa-perangkat-lunak", name: "Rekayasa Perangkat Lunak", emoji: "💻" },
  { id: "jaringan-komputer", name: "Jaringan Komputer", emoji: "🌐" },
];

const SUBJECTS_KEY = "pinterq.subjects";

export function loadSubjects(): Subject[] {
  if (typeof window === "undefined") return DEFAULT_SUBJECTS;
  try {
    const raw = window.localStorage.getItem(SUBJECTS_KEY);
    if (!raw) return DEFAULT_SUBJECTS;
    return JSON.parse(raw) as Subject[];
  } catch {
    return DEFAULT_SUBJECTS;
  }
}

export function saveSubjects(subjects: Subject[]) {
  window.localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
}

export const MOCK_CARDS_BY_SUBJECT: Record<string, Flashcard[]> = {
  "basis-data": [
    { id: 1, question: "Apa itu Primary Key?", answer: "Kolom unik yang mengidentifikasi setiap baris secara unik dalam tabel." },
    { id: 2, question: "Sebutkan 3 bentuk normalisasi.", answer: "1NF (atomic values), 2NF (no partial dependency), 3NF (no transitive dependency)." },
    { id: 3, question: "Apa perbedaan INNER JOIN dan LEFT JOIN?", answer: "INNER mengembalikan baris yang cocok di kedua tabel; LEFT mengembalikan semua baris tabel kiri + yang cocok di kanan." },
    { id: 4, question: "Apa fungsi indeks dalam database?", answer: "Mempercepat pencarian data, dengan trade-off ruang penyimpanan dan kecepatan write." },
  ],
  "kecerdasan-buatan": [
    { id: 1, question: "Apa itu Supervised Learning?", answer: "Pembelajaran mesin yang menggunakan dataset berlabel untuk memetakan input ke output." },
    { id: 2, question: "Sebutkan contoh algoritma klasifikasi.", answer: "Decision Tree, Random Forest, SVM, Logistic Regression, Naive Bayes." },
    { id: 3, question: "Apa beda AI, ML, dan Deep Learning?", answer: "AI adalah konsep umum; ML adalah subset AI; Deep Learning adalah subset ML berbasis neural network berlapis." },
  ],
  "manajemen-proyek": [
    { id: 1, question: "Apa itu metode Waterfall?", answer: "Pendekatan linear dan sekuensial: requirements → design → implementation → testing → deployment." },
    { id: 2, question: "Sebutkan 4 nilai Agile Manifesto.", answer: "Individu & interaksi, software bekerja, kolaborasi pelanggan, respon terhadap perubahan." },
    { id: 3, question: "Apa fungsi Gantt Chart?", answer: "Memvisualisasikan timeline proyek dan dependensi antar tugas." },
  ],
  "teknologi-platform": [
    { id: 1, question: "Apa itu IaaS, PaaS, SaaS?", answer: "Infrastructure, Platform, dan Software as a Service — tiga model layanan cloud computing." },
    { id: 2, question: "Apa keuntungan containerization?", answer: "Portabilitas, isolasi, efisiensi sumber daya dibanding VM tradisional." },
  ],
};

export const MOCK_QUIZ_BY_SUBJECT: Record<string, QuizQuestion[]> = {
  "basis-data": [
    {
      id: 1,
      question: "Manakah perintah SQL untuk menghapus tabel sepenuhnya beserta strukturnya?",
      options: ["DELETE TABLE", "DROP TABLE", "REMOVE TABLE", "TRUNCATE TABLE"],
      correctIndex: 1,
      explanation: "DROP TABLE menghapus tabel beserta struktur. DELETE menghapus baris, TRUNCATE mengosongkan isi tapi mempertahankan struktur.",
    },
    {
      id: 2,
      question: "Bentuk normalisasi yang menghilangkan partial dependency adalah?",
      options: ["1NF", "2NF", "3NF", "BCNF"],
      correctIndex: 1,
      explanation: "2NF menghilangkan ketergantungan parsial pada primary key komposit.",
    },
    {
      id: 3,
      question: "Constraint apa yang memastikan nilai kolom selalu berbeda di setiap baris?",
      options: ["NOT NULL", "CHECK", "UNIQUE", "DEFAULT"],
      correctIndex: 2,
      explanation: "UNIQUE memastikan tidak ada duplikasi nilai di kolom tersebut.",
    },
  ],
  "kecerdasan-buatan": [
    {
      id: 1,
      question: "Algoritma manakah yang termasuk unsupervised learning?",
      options: ["Linear Regression", "K-Means Clustering", "Decision Tree", "SVM"],
      correctIndex: 1,
      explanation: "K-Means Clustering mengelompokkan data tanpa label — ciri khas unsupervised learning.",
    },
    {
      id: 2,
      question: "Fungsi aktivasi yang umum di hidden layer modern neural network adalah?",
      options: ["Sigmoid", "Tanh", "ReLU", "Step Function"],
      correctIndex: 2,
      explanation: "ReLU (Rectified Linear Unit) efisien secara komputasi dan mengatasi vanishing gradient.",
    },
  ],
  "manajemen-proyek": [
    {
      id: 1,
      question: "Peran utama Scrum Master dalam tim Scrum adalah?",
      options: ["Menulis kode", "Memfasilitasi proses & menghilangkan blocker", "Mengelola anggaran", "Memimpin desain produk"],
      correctIndex: 1,
      explanation: "Scrum Master adalah servant leader yang memfasilitasi proses dan menghilangkan hambatan.",
    },
    {
      id: 2,
      question: "Berapa durasi standar sebuah Sprint dalam Scrum?",
      options: ["1 hari", "1–4 minggu", "3 bulan", "6 bulan"],
      correctIndex: 1,
      explanation: "Sprint umumnya berlangsung 1–4 minggu, paling sering 2 minggu.",
    },
  ],
  "teknologi-platform": [
    {
      id: 1,
      question: "Layanan AWS S3 termasuk model layanan cloud apa?",
      options: ["IaaS", "PaaS", "SaaS", "FaaS"],
      correctIndex: 0,
      explanation: "S3 adalah infrastructure-level storage service — IaaS.",
    },
  ],
};

export function getCardsForSubject(id: string): Flashcard[] {
  return MOCK_CARDS_BY_SUBJECT[id] ?? MOCK_CARDS_BY_SUBJECT["basis-data"];
}

export function getQuizForSubject(id: string): QuizQuestion[] {
  return MOCK_QUIZ_BY_SUBJECT[id] ?? MOCK_QUIZ_BY_SUBJECT["basis-data"];
}
