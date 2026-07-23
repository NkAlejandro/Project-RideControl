import { type ReactNode, type MouseEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatform } from "@/hooks/use-platform";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const { isAndroid } = usePlatform();

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
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-[100] bg-overlay"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={isAndroid ? { duration: 0.2, ease: "easeOut" } : { type: "spring", damping: 24, stiffness: 280, mass: 0.6 }}
                className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
              >
                <motion.div
                  onClick={(e: MouseEvent) => e.stopPropagation()}
                  className={cn(
                    isAndroid ? "w-full max-w-lg my-4 rounded-2xl bg-card border border-theme-subtle p-4 sm:p-5" : "glass-modal relative w-full max-w-lg my-8 rounded-2xl p-4 sm:p-5",
                    className,
                  )}
                >
                  {title && (
                    <div className="sticky top-0 z-10 mb-4 flex items-center justify-between sm:mb-5">
                      <Dialog.Title asChild>
                        <motion.h2
                          className="text-base font-semibold text-primary-color"
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.12 }}
                        >
                          {title}
                        </motion.h2>
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{ type: "spring", stiffness: 280, damping: 20 }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-hover text-secondary-color transition-colors hover:bg-hover hover:text-primary-color shrink-0"
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
