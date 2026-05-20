# PinterQ - Frontend 🧠✨

PinterQ is an AI-powered, gamified study companion designed to help students transform their lecture notes into interactive flashcards and adaptive quizzes. This repository contains the frontend client, built with modern web technologies to deliver a seamless, app-like user experience.

## ✨ Features
* **Interactive Study Room:** Gamified flashcard carousel with 3D flip animations and Spaced Repetition tracking (Focus Mode).
* **Adaptive Quizzes:** Dynamic quiz engine that evaluates user performance in real-time and triggers AI-generated "HOTS" (Higher Order Thinking Skills) or foundational questions.
* **State Persistence:** Utilizes `localStorage` to retain user sessions and study progress seamlessly.
* **Modern UI/UX:** Responsive, glassmorphism-inspired design with smooth transitions.

## 🛠️ Tech Stack
* **Framework:** React 18 + Vite
* **Routing:** TanStack Router (Type-safe routing)
* **Styling:** Tailwind CSS + Shadcn UI components
* **Animations:** Framer Motion
* **Icons:** Lucide React

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed on your machine.
The [PinterQ Backend](https://github.com/aucloire/II2210-18224071-PinterQ-BackEnd) must be running locally on port `8080`.

### Installation
1. Clone this repository:
   ```bash
   git clone [https://github.com/aucloire/II2210-18224071-PinterQ-FrontEnd](https://github.com/aucloire/II2210-18224071-PinterQ-FrontEnd)
2. Navigate to the project directory:
   ```bash
   cd II2210-18224071-PinterQ-FrontEnd
3. Install dependencies:
   ```bash
   npm install
4. Start the development server:
   ```bash
   npm run dev
5. Open http://localhost:5173 in your browser.

## 📂 Project Structure
- `/src/routes/` - TanStack Router page definitions (Dashboard, Login).
- `/src/components/` - Reusable UI components (Study Room, Flashcards, Modals).
- `/src/lib/` - API bridge (`api.ts`) and utility functions.