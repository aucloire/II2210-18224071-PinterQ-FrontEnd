import { useEffect, useState } from "react";

export type AuthUser = {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  profileImageUrl: string;
  token: string;
};

const KEY = "pinterq.auth";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getStoredUser()?.token ?? null;
}

export function setStoredUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(KEY, JSON.stringify(user));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("pinterq:auth"));
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setReady(true);
    const onChange = () => setUser(getStoredUser());
    window.addEventListener("pinterq:auth", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pinterq:auth", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return {
    user,
    ready,
    login: (username: string) => {
      const u: AuthUser = {
        userId: `u_${Math.random().toString(36).slice(2, 10)}`,
        username: username.trim() || "Student",
        fullName: "",
        token: "",
        role: "USER",
        profileImageUrl: "",
      };
      setStoredUser(u);
      return u;
    },
    logout: () => setStoredUser(null),
  };
}
