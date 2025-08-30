import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'ro', name: 'Română', flag: '🇷🇴', nativeName: 'Română' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦', nativeName: 'Українська' },
];

interface LanguageSelectorProps {
  onSelectLanguage: (language: Language) => void;
}

export default function LanguageSelector({ onSelectLanguage }: LanguageSelectorProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto p-8 bg-gradient-to-br from-background to-muted/30">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary mb-4">
          Seleziona la tua lingua / Choose your language
        </h2>
        <p className="text-muted-foreground text-lg">
          Scegli la lingua con cui vuoi comunicare durante la creazione del tuo CV
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {languages.map((language) => (
          <Button
            key={language.code}
            variant="language"
            onClick={() => onSelectLanguage(language)}
            className="text-center"
          >
            <span className="text-4xl mb-2">{language.flag}</span>
            <span className="font-semibold text-foreground">{language.nativeName}</span>
            <span className="text-sm text-muted-foreground">{language.name}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}