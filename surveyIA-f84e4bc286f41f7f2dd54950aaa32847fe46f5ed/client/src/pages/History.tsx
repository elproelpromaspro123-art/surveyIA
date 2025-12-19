import { useQuery } from "@tanstack/react-query";
import { Navigation, MobileNav } from "@/components/Navigation";
import { Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ["survey-history", userId],
    queryFn: async () => {
      const response = await fetch("/api/survey/history");
      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
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
        title: "Historial borrado",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const responses = historyData?.responses || [];
  const isEmpty = responses.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navigation />
      <MobileNav />

      <main className="md:ml-64 p-4 md:p-8 lg:p-12 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <header className="mb-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">
              Historial de Respuestas
            </h2>
            <p className="mt-2 text-muted-foreground">
              Un registro de todas las respuestas generadas por tu Gemelo Digital.
            </p>
          </header>

          {!isEmpty && (
            <div className="flex justify-end">
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 border border-red-400/20 transition-all duration-300 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Borrar todo
              </button>
            </div>
          )}

          {isEmpty ? (
            <div className="h-64 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 opacity-50" />
              </div>
              <p className="max-w-xs">
                No hay respuestas aún. Genera tu primera respuesta en el panel de control.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map((item: SurveyResponse) => (
                <div 
                  key={item.id}
                  className="glass-card p-6 rounded-xl border border-white/5 hover:border-white/20 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Clock className="w-3 h-3" /> {formatDate(item.createdAt)}
                    </div>
                    {item.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Completado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
                        <XCircle className="w-3 h-3" /> Error
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-medium text-white mb-2 group-hover:text-primary transition-colors">
                    {item.question}
                  </h3>
                  
                  {item.answer && (
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                      {item.answer}
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Modelo: {item.modelUsed}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
