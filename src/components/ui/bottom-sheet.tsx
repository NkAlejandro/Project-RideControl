import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, title, children, className }: BottomSheetProps) {
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
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex flex-col justify-end p-0 overflow-y-auto"
                onClick={onClose}
              >
                <div className="min-h-full flex items-end justify-center" onClick={(e) => e.stopPropagation()}>
                  <motion.div
                    key="bs-content"
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    transition={{ type: "spring", damping: 26, stiffness: 280, mass: 0.7 }}
                    className={cn(
                      "relative w-full max-w-lg rounded-t-3xl glass-modal p-5 shadow-2xl sm:p-6",
                      className,
                    )}
                  >
                    {title && (
                      <div className="mb-4 flex items-center justify-between sm:mb-5">
                        <Dialog.Title className="text-lg font-semibold text-white/90">
                          {title}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/50 transition-colors hover:bg-white/[0.12] hover:text-white/80 shrink-0">
                            <X className="h-4 w-4" />
                          </button>
                        </Dialog.Close>
                      </div>
                    )}
                    <div className="space-y-3">
                      {children}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
