import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { clsx } from "clsx";

interface StatusLogProps {
  logs: string[];
  isComplete: boolean;
  isVisible: boolean;
}

export function StatusLog({ logs, isComplete, isVisible }: StatusLogProps) {
  if (!isVisible) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <Sparkles className="w-4 h-4 text-secondary" />
        <span>AI Reasoning Process</span>
      </div>
      
      <div className="space-y-3 pl-2 border-l border-white/10">
        <AnimatePresence mode="popLayout">
          {logs.map((log, index) => (
            <motion.div
              key={`${index}-${log}`}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex items-start gap-3 text-sm"
            >
              <div className="mt-0.5 relative">
                {isComplete && index < logs.length - 1 ? (
                  <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  </div>
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center">
                     {index === logs.length - 1 && !isComplete ? (
                       <Loader2 className="w-3 h-3 text-primary animate-spin" />
                     ) : (
                       <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                     )}
                  </div>
                )}
              </div>
              <span className={clsx(
                "font-mono leading-tight",
                index === logs.length - 1 && !isComplete ? "text-primary" : "text-muted-foreground"
              )}>
                {log}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
