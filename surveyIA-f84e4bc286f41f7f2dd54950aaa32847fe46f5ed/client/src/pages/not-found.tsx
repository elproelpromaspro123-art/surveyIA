import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="glass-card p-12 rounded-2xl border border-white/10 text-center max-w-md mx-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4 font-display text-white">404</h1>
        <p className="text-muted-foreground mb-8">
          The page you are looking for has been moved or deleted.
        </p>

        <Link href="/">
          <button className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/80 transition-colors w-full">
            Return to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
