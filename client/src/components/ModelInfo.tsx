import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap, Brain } from "lucide-react";

interface ModelInfoProps {
  modelUsed: string;
  thinking?: string;
  usageStats?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  language?: "es" | "en";
  className?: string;
}

const MODEL_INFO: Record<string, { name: string; description: string; color: string }> = {
  "gemini-3-flash-preview": {
    name: "Gemini 3 Flash",
    description: "Latest model (Dec 2025) - Fast and intelligent",
    color: "bg-blue-500",
  },
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    description: "Best price-performance ratio",
    color: "bg-green-500",
  },
  "gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    description: "Advanced reasoning with thinking",
    color: "bg-purple-500",
  },
  "gemini-2.0-flash": {
    name: "Gemini 2.0 Flash",
    description: "Stable workhorse model",
    color: "bg-cyan-500",
  },
};

const LABELS = {
  es: {
    model: "Modelo utilizado",
    tokens: "Tokens utilizados",
    input: "Entrada",
    output: "Salida",
    thinking: "Pensamiento del modelo",
  },
  en: {
    model: "Model used",
    tokens: "Tokens used",
    input: "Input",
    output: "Output",
    thinking: "Model thinking",
  },
};

export function ModelInfo({
  modelUsed,
  thinking,
  usageStats,
  language = "es",
  className,
}: ModelInfoProps) {
  const info = MODEL_INFO[modelUsed];
  const labels = LABELS[language];
  const totalTokens = (usageStats?.inputTokens || 0) + (usageStats?.outputTokens || 0);

  if (!info) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          {labels.model}
        </CardTitle>
        <CardDescription>{info.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Model Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{labels.model}:</span>
          <Badge className={`${info.color} text-white`}>{info.name}</Badge>
        </div>

        {/* Token Usage */}
        {usageStats && totalTokens > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{labels.tokens}:</span>
              <span className="font-mono">{totalTokens.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground">{labels.input}</div>
                <div className="font-mono font-bold">
                  {usageStats.inputTokens?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground">{labels.output}</div>
                <div className="font-mono font-bold">
                  {usageStats.outputTokens?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Thinking Display */}
        {thinking && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">{labels.thinking}</span>
            </div>
            <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs max-h-48 overflow-y-auto font-mono">
              {thinking.substring(0, 500)}
              {thinking.length > 500 && "..."}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
