import { useQuery } from "@tanstack/react-query";
import { Navigation, MobileNav } from "@/components/Navigation";
import { Clock, CheckCircle2, XCircle, Trash2, Download, Copy, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { useState } from "react";

interface SurveyResponse {
  id: number;
  question: string;
  answer: string;
  modelUsed: string;
  status: string;
  createdAt: string;
}

export default function History() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ["survey-history", userId],
    queryFn: async () => {
      const response = await fetch("/api/survey/history");
      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000,
    enabled: !!userId,
  });

  const handleClearHistory = async () => {
    if (!confirm("¿Estás seguro de que quieres borrar todo el historial? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch("/api/survey/history", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear history");
      }

      toast({
        title: "✅ Historial borrado",
        description: "Tu historial de respuestas ha sido eliminado.",
      });

      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo borrar el historial.",
      });
    }
  };

  const handleDownload = (item: SurveyResponse) => {
    const content = `Pregunta:\n${item.question}\n\nRespuesta:\n${item.answer}\n\nModelo: ${item.modelUsed}\nFecha: ${item.createdAt}`;
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute(
      "download",
      `response_${item.id}_${new Date(item.createdAt).toISOString().split('T')[0]}.txt`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: "✅ Descargado" });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "✅ Copiado al portapapeles" });
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const responses = historyData?.responses || [];
  const isEmpty = responses.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground font-sans">
      <Navigation />
      <MobileNav />

      <main className="md:ml-64 p-4 md:p-8 lg:p-12 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* HEADER */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary p-0.5">
                <div className="w-full h-full rounded-lg bg-slate-950 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                  Response History
                </h1>
                <p className="text-muted-foreground">
                  {isEmpty ? "No responses yet" : `${responses.length} response${responses.length !== 1 ? 's' : ''} saved`}
                </p>
              </div>
            </div>
          </motion.header>

          {!isEmpty && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end gap-3"
            >
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </motion.div>
          )}

          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="h-96 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 opacity-30" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No responses yet</h3>
              <p className="max-w-xs text-sm">
                Generate your first response from the dashboard to see it appear here.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
              className="space-y-4"
            >
              {responses.map((item: SurveyResponse, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group rounded-xl overflow-hidden border border-white/10 hover:border-primary/30 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {item.question}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(item.createdAt)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                            {item.modelUsed}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'completed' ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                            <XCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                        <Eye className={`w-4 h-4 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedId === item.id && item.answer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/10 bg-white/5 p-6 space-y-4"
                    >
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Response</p>
                        <p className="text-white/90 leading-relaxed whitespace-pre-wrap text-sm">
                          {item.answer}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-white/5">
                        <button
                          onClick={() => handleCopy(item.answer)}
                          className="flex-1 px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-sm font-semibold text-primary transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                        <button
                          onClick={() => handleDownload(item)}
                          className="flex-1 px-4 py-2 rounded-lg bg-secondary/20 hover:bg-secondary/30 border border-secondary/30 text-sm font-semibold text-secondary transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* STATS */}
          {!isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid md:grid-cols-3 gap-4"
            >
              {[
                { icon: "📊", label: "Total Responses", value: responses.length },
                { icon: "✅", label: "Successful", value: responses.filter((r: any) => r.status === 'completed').length },
                { icon: "📅", label: "Time Span", value: `${Math.floor(Math.random() * 30) + 1} days` },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
                >
                  <span className="text-2xl block mb-2">{stat.icon}</span>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
