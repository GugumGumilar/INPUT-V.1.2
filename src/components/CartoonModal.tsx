import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

interface CartoonModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  icon?: string | 'success' | 'warning' | 'error' | 'info';
  onClose: () => void;
}

export const CartoonModal: React.FC<CartoonModalProps> = ({
  isOpen,
  title,
  message,
  icon = 'warning',
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Cartoon bouncy modal card */}
          <motion.div
            initial={{ scale: 0.7, y: 30, opacity: 0, rotate: -3 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, y: 20, opacity: 0, rotate: 2 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 22
            }}
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-slate-100 text-center overflow-hidden"
          >
            {/* Playful decorative top accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 via-indigo-500 to-amber-400" />

            {/* Cartoon Icon with spring bounce */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 450, damping: 14 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm"
            >
              {icon === 'success' || icon === '✅' ? (
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              ) : icon === 'error' || icon === '❌' || icon === '😡' ? (
                <XCircle className="w-9 h-9 text-rose-500" />
              ) : icon === '📡' || icon === 'info' ? (
                <Info className="w-9 h-9 text-sky-500" />
              ) : (
                <AlertTriangle className="w-9 h-9 text-amber-500" />
              )}
            </motion.div>

            {title && (
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {title}
              </h3>
            )}

            <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
              {message}
            </p>

            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.94, rotate: -0.5 }}
              onClick={onClose}
              className="w-full py-3 px-5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all"
            >
              Mengerti
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
