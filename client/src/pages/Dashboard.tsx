import { useState, useEffect } from "react";
import { useGenerateSurveyResponse } from "@/hooks/use-survey";
import { useAuth } from "@/hooks/useAuth";
import { Navigation, MobileNav } from "@/components/Navigation";
import { StatusLog } from "@/components/StatusLog";
import { Sparkles, Copy, Share2, Send, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [question, setQuestion] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const { toast } = useToast();
  const { userId } = useAuth();
  
  const generateMutation = useGenerateSurveyResponse();

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

    setLogs([]);
    setShowLogs(true);
    
    // Simulate initial log steps for better UX before/during API call
    const simulatedSteps = [
      "Analyzing survey context...",
      "Matching with Digital Twin profile...",
      "Selecting optimal AI model...",
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < simulatedSteps.length) {
        setLogs(prev => [...prev, simulatedSteps[stepIndex]]);
        stepIndex++;
      }
    }, 800);

    try {
      const result = await generateMutation.mutateAsync({
        userId,
        question,
      });
      
      clearInterval(interval);
      // Merge backend logs if any, or complete the process
      setLogs(prev => [...prev, "Synthesizing final response...", "Process completed successfully."]);
      
    } catch (error) {
      clearInterval(interval);
      setLogs(prev => [...prev, "Error occurred during generation."]);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    if (generateMutation.data?.answer) {
      navigator.clipboard.writeText(generateMutation.data.answer);
      toast({ title: "Copied!", description: "Response copied to clipboard." });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navigation />
      <MobileNav />

      <main className="md:ml-64 p-4 md:p-8 lg:p-12 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <header className="mb-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-secondary">
              Survey Response Generator
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              AI-powered intelligent survey responses based on your digital profile. Concise, reasoned, and authentic.
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* INPUT SECTION */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-1 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-background/80 backdrop-blur-xl rounded-xl p-6 relative z-10 h-full">
                  <label htmlFor="question" className="block text-sm font-medium mb-3 text-white/80">
                    Survey Question
                  </label>
                  <textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. How likely are you to recommend our service to a friend?"
                    className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all resize-none font-mono text-sm leading-relaxed"
                  />
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending}
                      className="
                        group relative px-6 py-3 rounded-xl font-bold text-sm text-white
                        bg-gradient-to-r from-primary to-secondary
                        shadow-lg shadow-primary/25 hover:shadow-primary/40
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0
                        overflow-hidden
                      "
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative flex items-center gap-2">
                        {generateMutation.isPending ? (
                          <>Generating...</>
                        ) : (
                          <>
                            Generate Answer <Sparkles className="w-4 h-4" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* STATUS LOG */}
              <StatusLog 
                logs={logs} 
                isComplete={!generateMutation.isPending} 
                isVisible={showLogs} 
              />
            </div>

            {/* OUTPUT SECTION */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {generateMutation.data ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="glass-card rounded-2xl p-8 border border-primary/20 shadow-2xl shadow-primary/5 relative"
                  >
                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mb-6 flex items-center gap-2">
                      <div className="px-3 py-1 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="w-3 h-3" />
                        {generateMutation.data.modelUsed}
                      </div>
                    </div>

                    <div className="prose prose-invert prose-p:leading-relaxed prose-p:text-white/90">
                      <p className="text-lg">{generateMutation.data.answer}</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground">
                      <span>Generated in 1.2s</span>
                      <span>Confidence: High</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[300px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Send className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="max-w-xs">
                      Your generated response will appear here after the AI processes your request.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
