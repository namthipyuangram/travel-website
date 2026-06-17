"use client";

import { ReactNode } from "react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = "ยืนยันการดำเนินการ",
  message = "คุณแน่ใจหรือไม่ที่จะดำเนินการนี้?",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  loading = false,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // ESC Key Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !loading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={!loading ? onCancel : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.95,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="
              relative
              w-full
              max-w-md
              overflow-hidden
              rounded-3xl
              border
              border-white/20
              bg-white
              shadow-[0_20px_80px_rgba(0,0,0,0.25)]
            "
          >
            {/* Close Button */}
            <button
              onClick={onCancel}
              disabled={loading}
              className="
                absolute
                right-4
                top-4
                rounded-full
                p-2
                text-gray-400
                transition-all
                hover:bg-gray-100
                hover:text-gray-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Icon */}
              <div
                className={`
                  mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl
                  ${
                    danger
                      ? "bg-red-50 text-red-600"
                      : "bg-blue-50 text-blue-600"
                  }
                `}
              >
                <AlertTriangle size={30} />
              </div>

              {/* Title */}
              <h2
                id="confirm-title"
                className="
                  text-center
                  text-xl
                  font-bold
                  tracking-tight
                  text-gray-900
                "
              >
                {title}
              </h2>

              {/* Message */}
              <p
                id="confirm-description"
                className="
                  mt-3
                  text-center
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                {message}
              </p>

              {/* Actions */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-gray-200
                    px-4
                    py-3
                    font-medium
                    text-gray-700
                    transition-all
                    hover:bg-gray-50
                    focus:outline-none
                    focus:ring-4
                    focus:ring-gray-200
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {cancelText}
                </button>

                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`
                    flex-1
                    rounded-xl
                    px-4
                    py-3
                    font-medium
                    text-white
                    transition-all
                    focus:outline-none
                    focus:ring-4
                    disabled:cursor-not-allowed
                    disabled:opacity-70

                    ${
                      danger
                        ? `
                        bg-red-600
                        hover:bg-red-700
                        focus:ring-red-200
                      `
                        : `
                        bg-blue-600
                        hover:bg-blue-700
                        focus:ring-blue-200
                      `
                    }
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          opacity="0.25"
                        />
                        <path
                          d="M22 12a10 10 0 00-10-10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                      กำลังดำเนินการ...
                    </span>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Accent */}
            <div
              className={`
                h-1 w-full
                ${
                  danger
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                }
              `}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}