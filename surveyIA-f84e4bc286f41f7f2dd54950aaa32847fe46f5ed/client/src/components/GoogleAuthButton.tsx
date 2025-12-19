import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function GoogleAuthButton({ onSuccess, className }: GoogleAuthButtonProps) {
  const { loginWithGoogle, isLoggingIn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Load Google script if not already loaded
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

    return () => {
      // Cancel Google auth UI on unmount
      if (window.google) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  const initializeGoogle = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleSuccess,
      });
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    try {
      await loginWithGoogle(response.credential);
      toast({
        title: "Éxito",
        description: "Has iniciado sesión correctamente",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to authenticate",
      });
    }
  };

  return (
    <div id="google-auth-button" className={className}>
      {/* Google Sign-In button will be rendered here by Google SDK */}
    </div>
  );
}
