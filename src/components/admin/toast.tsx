"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const listeners = new Set<(toast: ToastItem) => void>();
let nextId = 1;
const ERROR_WORDS = /fail|couldn|could not|error|unable|didn't|did not|can't|cannot|invalid|wrong|doesn't/i;

// Replaces alert() in the admin panel: a small notice in the corner that goes away by itself.
// Messages that read like a problem are shown as errors unless a kind is given.
export function toast(message: string, kind?: ToastKind) {
  const item = { id: nextId++, message: String(message), kind: kind ?? (ERROR_WORDS.test(message) ? "error" : "success") };
  if (listeners.size === 0) {
    window.alert(item.message);
    return;
  }
  listeners.forEach((listener) => listener(item));
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (item: ToastItem) => {
      setToasts((current) => [...current, item]);
      setTimeout(
        () => setToasts((current) => current.filter((t) => t.id !== item.id)),
        item.kind === "error" ? 7000 : 3500
      );
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          role={item.kind === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex items-start gap-3 rounded-md px-4 py-3 text-sm text-white shadow-lg ${
            item.kind === "error" ? "bg-red-600" : "bg-gray-900"
          }`}
        >
          <span className="flex-1">{item.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToasts((current) => current.filter((t) => t.id !== item.id))}
            className="opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
