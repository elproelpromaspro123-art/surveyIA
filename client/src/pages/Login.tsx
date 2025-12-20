import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslate } from "@/hooks/useTranslate";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get preferred language from browser or localStorage
  const getPreferredLanguage = () => {
    const stored = localStorage.getItem('preferred_language');
    if (stored) return stored;
    const browserLang = (navigator.language || 'es').split('-')[0];
    return browserLang === 'en' ? 'en' : 'es';
  };
  const preferredLanguage = getPreferredLanguage();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Load and initialize Google Sign-In
  useEffect(() => {
    const loadGoogleScript = () => {
      if (!window.google) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = initializeGoogle;
      } else {
        initializeGoogle();
      }
    };

    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        });

        const buttonElement = document.getElementById("google-signin-button");
        if (buttonElement) {
          window.google.accounts.id.renderButton(buttonElement, {
            type: "standard",
            size: "large",
            text: "signup_with",
          });
        }
      }
    };

    loadGoogleScript();

    return () => {
      if (window.google) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  const handleGoogleSuccess = async (response: any) => {
    try {
      setIsLoading(true);
      await loginWithGoogle(response.credential);
      toast({
        title: "¡Éxito!",
        description: "Has iniciado sesión correctamente con Google",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Falló la autenticación con Google",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t("error_completing_fields"),
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t("error_passwords_mismatch"),
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t("error_password_length"),
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
          language: preferredLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error en el registro");
      }

      const data = await response.json();

      // Auto-login after registration
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error("Error al iniciar sesión automáticamente");
      }

      toast({
        title: "✅ Account Created",
        description: t("success_account_created"),
      });

      // Wait a moment for session to be established before navigating
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || t("error_registration"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t("error_completing_fields"),
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t("error_login"));
      }

      toast({
        title: "✅ Success",
        description: t("success_login"),
      });

      // Wait a moment for session to be established before navigating
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || t("error_login"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            SurveyIA
          </h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp ? t("signup_title") : t("login_title")}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 border border-white/10 space-y-8 shadow-xl">
          {/* Email/Password Form */}
          <form
            onSubmit={
              isSignUp ? handleEmailSignUp : handleEmailLogin
            }
            className="space-y-4"
          >
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 block">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 block">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up) */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 block">
                  {t("confirm_password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Password Warning (Sign Up) */}
            {isSignUp && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400 font-medium">
                  {t("password_warning_title")}
                </p>
                <p className="text-xs text-red-400/70 mt-1">
                  {t("password_warning_desc")}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
            >
              {isLoading
                ? "Procesando..."
                : isSignUp
                  ? t("signup_button")
                  : t("login_button")}
            </button>
          </form>

          {/* Toggle Sign Up / Login */}
          <div className="text-center text-sm text-muted-foreground">
            {isSignUp ? t("have_account") : t("no_account")}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormData({ email: "", password: "", confirmPassword: "" });
              }}
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              {isSignUp ? t("toggle_login") : t("toggle_signup")}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-background text-muted-foreground">O</span>
            </div>
          </div>

          {/* Google OAuth */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {t("quick_access")}
            </p>
            <div id="google-signin-button" className="flex justify-center" aria-label="Google sign in" />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Al usar SurveyIA, aceptas nuestros términos de servicio
        </p>
      </div>
    </div>
  );
}
