import { useCallback, type ReactNode, type MouseEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--shine-x", `${x}%`);
    el.style.setProperty("--shine-y", `${y}%`);
  }, []);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ type: "spring", damping: 24, stiffness: 280, mass: 0.6 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
                onClick={onClose}
              >
                <motion.div
                  onClick={(e: MouseEvent) => e.stopPropagation()}
                  onMouseMove={handleMouseMove}
                  className={cn(
                    "glass-modal relative w-full max-w-lg my-8 rounded-2xl p-4 sm:p-5",
                    className,
                  )}
                >
                  {title && (
                    <div className="sticky top-0 z-10 mb-4 flex items-center justify-between sm:mb-5">
                      <Dialog.Title asChild>
                        <motion.h2
                          className="text-base font-semibold text-white/90"
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.12 }}
                        >
                          {title}
                        </motion.h2>
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{ type: "spring", stiffness: 400, damping: 12 }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/50 transition-colors hover:bg-white/[0.12] hover:text-white/80 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </Dialog.Close>
                    </div>
                  )}
                  <motion.div
                    className="space-y-3"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.035, delayChildren: 0.15 },
                      },
                    }}
                  >
                    {children}
                  </motion.div>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
