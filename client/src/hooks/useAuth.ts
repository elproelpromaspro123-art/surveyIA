import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useCallback } from "react";

interface AuthSession {
  authenticated: boolean;
  userId?: number;
  username?: string;
  language?: string;
}

interface GoogleAuthResponse {
  userId: number;
  isNewUser: boolean;
  username: string;
  language: string;
}

interface AuthResponse {
  userId: number;
  username: string;
  language: string;
}

const CACHE_KEY = ["auth", "session"];

export function useAuth() {
  // Get current session
  const sessionQuery = useQuery({
    queryKey: CACHE_KEY,
    queryFn: async (): Promise<AuthSession> => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          return { authenticated: false };
        }
        return response.json();
      } catch {
        return { authenticated: false };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Google OAuth login
  const loginWithGoogleMutation = useMutation({
    mutationFn: async (token: string): Promise<GoogleAuthResponse> => {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        let errorMessage = "Authentication failed";
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate session cache to refetch
      queryClient.setQueryData(CACHE_KEY, {
        authenticated: true,
        userId: data.userId,
        username: data.username,
        language: data.language,
      });
      // Also invalidate to force refetch
      queryClient.invalidateQueries({ queryKey: CACHE_KEY });
    },
  });

  // Email/Password login
  const loginWithEmailMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Authentication failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CACHE_KEY, {
        authenticated: true,
        userId: data.userId,
        username: data.username,
        language: data.language,
      });
      // Also invalidate to force refetch
      queryClient.invalidateQueries({ queryKey: CACHE_KEY });
    },
  });

  // Email/Password registration
  const registerMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; language?: string }): Promise<AuthResponse> => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CACHE_KEY, {
        authenticated: true,
        userId: data.userId,
        username: data.username,
        language: data.language,
      });
      // Also invalidate to force refetch
      queryClient.invalidateQueries({ queryKey: CACHE_KEY });
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(CACHE_KEY, {
        authenticated: false,
      });
    },
  });

  // Change language
  const changeLanguageMutation = useMutation({
    mutationFn: async (language: string) => {
      if (!sessionQuery.data?.userId) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/users/${sessionQuery.data.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });

      if (!response.ok) {
        throw new Error("Failed to change language");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(CACHE_KEY, (prev: AuthSession) => ({
        ...prev,
        language: data.language,
      }));
    },
  });

  const isAuthenticated = sessionQuery.data?.authenticated === true;
  const userId = sessionQuery.data?.userId;
  const username = sessionQuery.data?.username;
  const language = sessionQuery.data?.language || "es";

  const loginWithGoogle = useCallback(
    async (token: string) => {
      return loginWithGoogleMutation.mutateAsync(token);
    },
    [loginWithGoogleMutation]
  );

  const loginWithEmail = useCallback(
    async (username: string, password: string) => {
      return loginWithEmailMutation.mutateAsync({ username, password });
    },
    [loginWithEmailMutation]
  );

  const register = useCallback(
    async (username: string, password: string, language: string = "es") => {
      return registerMutation.mutateAsync({ username, password, language });
    },
    [registerMutation]
  );

  const logout = useCallback(() => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const changeLanguage = useCallback(
    (lang: string) => {
      return changeLanguageMutation.mutateAsync(lang);
    },
    [changeLanguageMutation]
  );

  return {
    // Session
    isAuthenticated,
    userId,
    username,
    language,
    isLoading: sessionQuery.isLoading,
    
    // Auth methods
    loginWithGoogle,
    loginWithEmail,
    register,
    logout,
    changeLanguage,
    
    // Mutation states
    isLoggingIn: loginWithGoogleMutation.isPending || loginWithEmailMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isChangingLanguage: changeLanguageMutation.isPending,
    
    // Errors
    sessionError: sessionQuery.error,
    authError: loginWithGoogleMutation.error || loginWithEmailMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
  };
}
