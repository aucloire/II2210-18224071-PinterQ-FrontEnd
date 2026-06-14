import { useState, useEffect } from "react";
import { Bell, CheckCheck, Loader2, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: number;
  userId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationDropdown({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api
      .getNotifications(Number(userId))
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => handleMarkRead(n.id)));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center gap-2 px-3 h-9 rounded-full glass text-xs font-bold hover:bg-white/70 transition shadow-soft"
        aria-label="Notifikasi"
      >
        <Bell className="size-3.5" />
        <span className="hidden sm:inline">Notifikasi</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 size-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown panel */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 rounded-2xl border border-black/5 bg-white/95 backdrop-blur-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
              <span className="text-sm font-bold">Notifikasi</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary/30" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Mail className="size-8 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Belum ada notifikasi
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-start gap-3 border-b border-black/[0.03] last:border-b-0 transition",
                      !n.isRead && "bg-primary/5"
                    )}
                  >
                    {/* Read indicator dot */}
                    <span
                      className={cn(
                        "mt-1.5 size-2 rounded-full shrink-0",
                        n.isRead ? "bg-transparent" : "bg-red-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs leading-relaxed",
                          n.isRead
                            ? "text-muted-foreground"
                            : "text-foreground font-semibold"
                        )}
                      >
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
