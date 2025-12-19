import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
}

const LANGUAGES = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
];

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { language, changeLanguage, isChangingLanguage } = useAuth();

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Globe className="w-4 h-4" />
      <Select
        value={language}
        onValueChange={handleLanguageChange}
        disabled={isChangingLanguage}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
