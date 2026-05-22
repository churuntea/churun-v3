"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);

  if (!imageUrl) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
  };

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden touch-none"
          onClick={onClose}
        >
          <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
            <div className="flex bg-white/10 rounded-full p-1 backdrop-blur-md">
               <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"><ZoomOut className="w-5 h-5" /></button>
               <button onClick={handleReset} className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"><Maximize className="w-4 h-4" /></button>
               <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"><ZoomIn className="w-5 h-5" /></button>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <motion.div 
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
            dragElastic={0.1}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              src={imageUrl}
              animate={{ scale }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl pointer-events-none"
              alt="Preview"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
