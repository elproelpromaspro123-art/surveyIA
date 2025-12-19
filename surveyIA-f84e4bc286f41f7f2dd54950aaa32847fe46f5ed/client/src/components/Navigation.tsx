import { Link, useLocation } from "wouter";
import { LayoutDashboard, UserCircle, History, BrainCircuit, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function Navigation() {
  const [location] = useLocation();
  const { username, logout } = useAuth();
  const { toast } = useToast();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "Digital Twin", icon: UserCircle },
    { href: "/history", label: "History", icon: History },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cerrar sesión",
      });
    }
  };

  const userInitials = username
    ?.split(" ")
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <aside className="w-64 glass-card h-screen fixed left-0 top-0 border-r border-white/10 hidden md:flex flex-col p-6 z-50">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
          <BrainCircuit className="w-8 h-8 text-primary neon-text" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          SurveyIA <span className="text-primary">AI</span>
        </h1>
      </div>

      <nav className="space-y-2 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer group",
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/20 shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
              {userInitials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{username || "Usuario"}</p>
              <p className="text-xs text-muted-foreground truncate">Cuenta activa</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-white hover:bg-red-500/10 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  
  const links = [
    { href: "/", label: "Dash", icon: LayoutDashboard },
    { href: "/profile", label: "Profile", icon: UserCircle },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-white/10 p-4 z-50">
      <div className="flex justify-around items-center">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div className={clsx(
                "flex flex-col items-center gap-1 transition-all cursor-pointer",
                isActive ? "text-primary scale-110" : "text-muted-foreground"
              )}>
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
