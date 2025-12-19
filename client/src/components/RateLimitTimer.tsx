import { useEffect, useState } from "react";
import { AlertCircle, Clock } from "lucide-react";

interface RateLimitInfo {
  model: string;
  minutesUntilAvailable: number;
  secondsUntilAvailable: number;
}

export function RateLimitTimer({
  rateLimited,
  isVisible = false,
}: {
  rateLimited?: RateLimitInfo[];
  isVisible?: boolean;
}) {
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!rateLimited || rateLimited.length === 0) return;

    const updateTimers = () => {
      const now = Date.now();
      const remaining: Record<string, string> = {};

      for (const info of rateLimited) {
        // Calculate remaining time
        let seconds = info.secondsUntilAvailable;
        
        if (seconds > 0) {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;

          remaining[info.model] = `${hours
            .toString()
            .padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
      }

      setTimeRemaining(remaining);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [rateLimited]);

  if (!isVisible || !rateLimited || rateLimited.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-warning mb-3">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-semibold">Algunos modelos están limitados</span>
      </div>

      {rateLimited.map((info) => (
        <div
          key={info.model}
          className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-400">
              {info.model}
            </span>
            <div className="flex items-center gap-1 text-yellow-400 font-mono text-sm">
              <Clock className="w-4 h-4" />
              {timeRemaining[info.model] || "00:00:00"}
            </div>
          </div>
          <div className="w-full bg-yellow-500/20 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, ((60 - info.secondsUntilAvailable) / 60) * 100)
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-yellow-400/70 mt-2">
            Disponible en {info.minutesUntilAvailable} minuto(s)
          </p>
        </div>
      ))}
    </div>
  );
}
