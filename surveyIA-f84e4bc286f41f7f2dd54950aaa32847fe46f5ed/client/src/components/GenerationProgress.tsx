import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface GenerationProgressProps {
  logs: string[];
  isLoading: boolean;
  language?: "es" | "en";
  className?: string;
}

export function GenerationProgress({
  logs,
  isLoading,
  language = "es",
  className,
}: GenerationProgressProps) {
  const currentStep = Math.min(logs.length, isLoading ? logs.length : logs.length - 1);
  const progress = (currentStep / Math.max(logs.length, 1)) * 100;

  return (
    <Card className={className}>
      <CardContent className="pt-6 space-y-4">
        {/* Progress bar */}
        <div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Log entries */}
        <div className="space-y-2">
          {logs.map((log, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep && isLoading;

            return (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded transition-colors ${
                  isCompleted || isCurrent
                    ? "bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200"
                    : "text-muted-foreground"
                }`}
              >
                {isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                ) : isCompleted ? (
                  <div className="w-4 h-4 bg-green-500 rounded-full" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                )}
                <span className="text-sm">{log}</span>
              </div>
            );
          })}
        </div>

        {/* Current progress percentage */}
        {isLoading && (
          <div className="text-center text-xs text-muted-foreground">
            {Math.round(progress)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}
