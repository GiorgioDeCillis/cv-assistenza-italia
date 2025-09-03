import React, { useState } from 'react';
import LanguageSelector from '@/components/LanguageSelector';
import ChatInterface from '@/components/ChatInterface';

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

const Index = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleBack = () => {
    setSelectedLanguage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)` }}
        ></div>
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 shadow-glow">
            CV Assistenza Italia
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Crea il tuo CV professionale per il mercato del lavoro italiano nel settore domestico
          </p>
          <div className="text-lg text-white/80 max-w-2xl mx-auto">
            La nostra piattaforma ti aiuta a presentare la tua esperienza in modo professionale, 
            traducendo le tue competenze nel formato richiesto dai datori di lavoro italiani.
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {!selectedLanguage ? (
            <LanguageSelector onSelectLanguage={handleLanguageSelect} />
          ) : (
            <ChatInterface language={selectedLanguage} onBack={handleBack} />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Supportiamo i lavoratori stranieri nel loro percorso professionale in Italia
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
