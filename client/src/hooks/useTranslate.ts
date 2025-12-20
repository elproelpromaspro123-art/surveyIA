import { useAuth } from "./useAuth";

const translations: Record<string, Record<string, string>> = {
  es: {
    "login_title": "Inicia sesión en tu cuenta",
    "signup_title": "Crea una cuenta para comenzar",
    "email": "Email",
    "password": "Contraseña",
    "confirm_password": "Confirma contraseña",
    "login_button": "Iniciar sesión",
    "signup_button": "Crear cuenta",
    "toggle_login": "Inicia sesión",
    "toggle_signup": "Regístrate",
    "have_account": "¿Ya tienes cuenta?",
    "no_account": "¿No tienes cuenta?",
    "quick_access": "Acceso rápido",
    "password_warning_title": "⚠️ RECUERDA BIEN TU CONTRASEÑA - NO HAY FORMA DE RECUPERARLA",
    "password_warning_desc": "No podemos recuperar tu contraseña si la olvidas. Guárdala en un lugar seguro.",
    "error_completing_fields": "Por favor completa todos los campos",
    "error_passwords_mismatch": "Las contraseñas no coinciden",
    "error_password_length": "La contraseña debe tener al menos 6 caracteres",
    "success_account_created": "Tu cuenta ha sido registrada correctamente",
    "error_registration": "Error en el registro",
    "error_login": "Error al iniciar sesión",
    "success_login": "Has iniciado sesión correctamente",
    "error_empty_input": "Por favor completa todos los campos",
    "empty_input_error": "Empty Input",
    "user_not_found": "User ID not found. Please log in again.",
  },
  en: {
    "login_title": "Sign in to your account",
    "signup_title": "Create an account to get started",
    "email": "Email",
    "password": "Password",
    "confirm_password": "Confirm password",
    "login_button": "Sign in",
    "signup_button": "Create account",
    "toggle_login": "Sign in",
    "toggle_signup": "Sign up",
    "have_account": "Already have an account?",
    "no_account": "Don't have an account?",
    "quick_access": "Quick access",
    "password_warning_title": "⚠️ REMEMBER YOUR PASSWORD WELL - THERE IS NO WAY TO RECOVER IT",
    "password_warning_desc": "We cannot recover your password if you forget it. Keep it in a safe place.",
    "error_completing_fields": "Please complete all fields",
    "error_passwords_mismatch": "Passwords do not match",
    "error_password_length": "Password must be at least 6 characters",
    "success_account_created": "Your account has been registered successfully",
    "error_registration": "Registration error",
    "error_login": "Sign in error",
    "success_login": "You have successfully signed in",
    "error_empty_input": "Please complete all fields",
    "empty_input_error": "Empty Input",
    "user_not_found": "User ID not found. Please log in again.",
  },
};

export function useTranslate() {
  const { language } = useAuth();
  const lang = (language || "es") as "es" | "en";

  const t = (key: string, defaultValue?: string): string => {
    return translations[lang]?.[key] || translations.es[key] || defaultValue || key;
  };

  return { t, language: lang };
}
