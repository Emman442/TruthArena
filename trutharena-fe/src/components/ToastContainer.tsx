import { useEffect } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export default function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div id="toast-container" className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void; key?: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      id={`toast-${toast.id}`}
      className={`pointer-events-auto w-full px-5 py-3 text-sm font-mono tracking-tight transition-all duration-300 transform translate-y-0 opacity-100 flex items-center justify-between border ${
        toast.type === "success"
          ? "bg-[#0a0a0a] text-white border-black"
          : "bg-[#dc2626] text-white border-[#dc2626]"
      }`}
    >
      <span>{toast.message}</span>
      <button
        id={`close-toast-${toast.id}`}
        onClick={onClose}
        className="ml-4 text-white/75 hover:text-white font-sans text-xs"
      >
        ✕
      </button>
    </div>
  );
}
