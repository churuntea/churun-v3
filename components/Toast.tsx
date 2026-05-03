"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ 
  message, 
  type = "success", 
  isVisible, 
  onClose 
}: ToastProps) {
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      text: "text-emerald-900"
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
      bg: "bg-rose-50",
      border: "border-rose-100",
      text: "text-rose-900"
    },
    info: {
      icon: <Info className="w-5 h-5 text-indigo-500" />,
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      text: "text-indigo-900"
    }
  };

  const current = config[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-48px)] max-w-sm ${current.bg} ${current.border} border backdrop-blur-xl p-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4`}
        >
          <div className="shrink-0">
            {current.icon}
          </div>
          <p className={`flex-1 text-[13px] font-bold ${current.text} leading-tight`}>
            {message}
          </p>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
