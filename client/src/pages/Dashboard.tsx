import { useState, useEffect } from "react";
import { useGenerateSurveyResponse, useModelStatus } from "@/hooks/use-survey";
import { useAuth } from "@/hooks/useAuth";
import { Navigation, MobileNav } from "@/components/Navigation";
import { StatusLog } from "@/components/StatusLog";
import { RateLimitTimer } from "@/components/RateLimitTimer";
import { 
  Sparkles, 
  Copy, 
  Share2, 
  Send, 
  Cpu, 
  Download,
  RefreshCw,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState<{ mimeType: string; data: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showRateLimitInfo, setShowRateLimitInfo] = useState(false);
  const { toast } = useToast();
  const { userId } = useAuth();
  
  const generateMutation = useGenerateSurveyResponse();
  const { data: modelStatus } = useModelStatus();
  const [streamingAnswer, setStreamingAnswer] = useState<string | null>(null);

  // Helpers for image paste/upload
  const readFileAsData = (file: File): Promise<{ mimeType: string; data: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // remove data:<mime>;base64, prefix if present
        const match = result.match(/^data:(.*);base64,(.*)$/s);
        if (match) {
          resolve({ mimeType: match[1], data: match[2] });
        } else {
          // fallback: assume png
          const b64 = result.split(",").pop() || "";
          resolve({ mimeType: file.type || "image/png", data: b64 });
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const d = await readFileAsData(file);
          setImage(d);
          toast({ title: "Image pasted", description: "Image attached to the request" });
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const d = await readFileAsData(f);
    setImage(d);
    toast({ title: "Image attached", description: f.name });
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleGenerate = async () => {
    if (!question.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter a survey question to answer.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    if (!modelStatus?.status?.hasAvailableModels) {
      toast({
        title: "Models Rate Limited",
        description: `All models are currently rate limited. Please wait ${modelStatus?.status?.minutesUntilAvailable} minute(s) before trying again.`,
        variant: "destructive",
      });
      setShowRateLimitInfo(true);
      return;
    }

    setLogs([]);
    setShowLogs(true);
    
    const simulatedSteps = [
      "🔍 Analyzing your question...",
      "👤 Loading your digital profile...",
      "🤖 Selecting optimal AI model...",
      "💭 Activating advanced reasoning...",
      "⚡ Generating response...",
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < simulatedSteps.length) {
        const step = simulatedSteps[stepIndex];
        if (step && step.trim()) setLogs(prev => [...prev, step]);
        stepIndex++;
      }
    }, 500);

    try {
      const payload: any = { userId, question };
      if (image) payload.image = image;

      // Use streaming endpoint for progressive feedback
      const res = await fetch("/api/survey/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to start streaming");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming not supported by the server");

      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";
      let collected = "";

      while (!done) {
        const { value, done: d } = await reader.read();
        done = !!d;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          // SSE-style parsing: split by double newline
          const parts = buffer.split(/\n\n/);
          buffer = parts.pop() || "";
          for (const part of parts) {
            const lines = part.split(/\n/);
            for (const line of lines) {
              if (line.startsWith("data:")) {
                const payloadText = line.replace(/^data:\s?/, "").trim();
                try {
                  const text = JSON.parse(payloadText);
                  if (text === "[DONE]") {
                    // finished
                    setLogs(prev => [...prev, "✅ Response generated successfully."]);
                    // persist
                    try {
                      const key = `surveyia_history_user_${userId}`;
                      const existing = JSON.parse(localStorage.getItem(key) || "[]");
                      const entry = {
                        id: Date.now(),
                        question,
                        answer: collected,
                        modelUsed: 'auto-selected',
                        status: 'completed',
                        createdAt: new Date().toISOString(),
                      };
                      existing.unshift(entry);
                      localStorage.setItem(key, JSON.stringify(existing));

                      const params = new URLSearchParams();
                      params.set('open', String(entry.id));
                      window.location.href = `/history?${params.toString()}`;
                    } catch (e) {
                      // ignore localStorage errors
                    }
                    setTimeout(() => setShowLogs(false), 2000);
                    break;
                  } else {
                    // append chunk
                    collected += text;
                    setStreamingAnswer(collected);
                  }
                } catch (e) {
                  // not JSON
                }
              }
            }
          }
        }
      }

    } catch (error) {
      clearInterval(interval);
      setLogs(prev => [...prev, "❌ Error generating response"]);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    const text = generateMutation.data?.answer ?? streamingAnswer;
    if (text) {
      navigator.clipboard.writeText(text);
      toast({ title: "✅ Copied!", description: "Response copied to clipboard." });
    }
  };

  const downloadAsText = () => {
    const text = generateMutation.data?.answer ?? streamingAnswer;
    if (text) {
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
      element.setAttribute(
        "download",
        `surveyIA_response_${new Date().toISOString().split('T')[0]}.txt`
      );
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast({ title: "Downloaded!" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground font-sans selection:bg-primary/30">
      <Navigation />
      <MobileNav />

      <main className="md:ml-64 p-4 md:p-8 lg:p-12 pb-24">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* HEADER SECTION */}
          <header className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="h-12 w-1 bg-gradient-to-b from-primary via-purple-500 to-secondary rounded-full" />
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">
                  {modelStatus?.status?.primaryModel || "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground">Advanced AI with intelligent fallback</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-6xl sm:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white mb-4 leading-tight">
                Survey Response
                <br />
                Engine
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                Advanced AI analysis with deep reasoning, web search, and code execution. 
                Get expertly analyzed responses tailored to your needs.
              </p>
            </motion.div>
          </header>

          {/* RATE LIMIT WARNING */}
          {showRateLimitInfo && modelStatus?.rateLimited && modelStatus.rateLimited.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl"
            >
              <RateLimitTimer 
                rateLimited={modelStatus.rateLimited}
                isVisible={true}
              />
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* INPUT SECTION */}
            <div className="lg:col-span-2 space-y-6">
              {/* Question Input Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/10 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                
                <div className="relative z-10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 group-hover:border-white/20 rounded-2xl p-6 transition-all duration-300">
                  <label htmlFor="question" className="block text-sm font-semibold mb-3 text-white/90 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Your Question
                  </label>
                  
                  <textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Ask anything and get an AI-powered expert response... e.g., How likely are you to recommend our service? What are the key factors? (You can paste images with Ctrl+V)"
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all resize-none font-base text-base leading-relaxed"
                  />

                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-xs text-muted-foreground">Attach image:</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    {image && (
                      <div className="ml-2 flex items-center gap-2">
                        <img src={`data:${image.mimeType};base64,${image.data}`} alt="preview" className="w-12 h-12 object-cover rounded-md border" />
                        <button onClick={removeImage} className="text-xs text-amber-400">Remove</button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {question.length} characters
                    </span>
                    <button
                      onClick={handleGenerate}
                      disabled={
                        generateMutation.isPending || 
                        !modelStatus?.status?.hasAvailableModels
                      }
                      className="group relative px-8 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-primary via-purple-500 to-secondary shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-xl" />
                      <span className="relative flex items-center gap-2 justify-center">
                        {generateMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Generate Response
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Status Log */}
              {showLogs && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <StatusLog 
                    logs={logs} 
                    isComplete={!generateMutation.isPending} 
                    isVisible={true}
                  />
                </motion.div>
              )}
            </div>

            {/* OUTPUT SECTION */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {(generateMutation.data || streamingAnswer) ? (
                  <motion.div
                    key="output"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl shadow-2xl shadow-primary/10"
                  >
                    {/* Header with Model Info */}
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/10 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                          {generateMutation.data?.modelUsed ?? "streaming"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={copyToClipboard}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={downloadAsText}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                      <div className="prose prose-invert max-w-none">
                        <p className="text-base leading-relaxed text-white/90 whitespace-pre-wrap">
                          {generateMutation.data?.answer ?? streamingAnswer}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-white/5 border-t border-white/5 px-6 py-3 flex justify-between items-center text-xs text-muted-foreground">
                      <span>{generateMutation.data ? "✅ Generated & Ready" : "Streaming..."}</span>
                      <span>High Confidence</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-dashed border-white/10 p-8 text-center"
                  >
                    <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">
                      Your response will appear here
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* INFO CARDS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-4"
          >
            {[
              {
                icon: "🧠",
                title: "Advanced Reasoning",
                desc: "Deep analysis with extended thinking",
              },
              {
                icon: "🔍",
                title: "Web Search",
                desc: "Real-time information grounding",
              },
              {
                icon: "⚡",
                title: "Fast Generation",
                desc: "Get responses in seconds",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors cursor-default"
              >
                <span className="text-2xl block mb-2">{card.icon}</span>
                <h3 className="font-semibold text-sm text-white mb-1">
                  {card.title}
                </h3>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
