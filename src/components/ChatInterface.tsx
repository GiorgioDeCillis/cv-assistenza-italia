import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Download, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  language: { code: string; name: string; flag: string; nativeName: string };
  onBack: () => void;
}

interface CVData {
  personalInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    nationality: string;
  };
  professionalSummary: string;
  workExperience: Array<{
    position: string;
    company: string;
    location: string;
    period: string;
    description: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    level: string;
  }>;
  education: Array<{
    title: string;
    institution: string;
    year: string;
    location: string;
  }>;
  references: string;
}

const generatePDF = (cvData: CVData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const lineHeight = 6;
  let yPosition = 20;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(cvData.personalInfo.name || 'Curriculum Vitae', margin, yPosition);
  yPosition += 15;

  // Contact Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const contactInfo = [
    cvData.personalInfo.phone && `Tel: ${cvData.personalInfo.phone}`,
    cvData.personalInfo.email && `Email: ${cvData.personalInfo.email}`,
    cvData.personalInfo.address && `Indirizzo: ${cvData.personalInfo.address}`,
    cvData.personalInfo.nationality && `Nazionalità: ${cvData.personalInfo.nationality}`
  ].filter(Boolean);

  contactInfo.forEach(info => {
    doc.text(info!, margin, yPosition);
    yPosition += lineHeight;
  });
  yPosition += 5;

  // Professional Summary
  if (cvData.professionalSummary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFILO PROFESSIONALE', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(cvData.professionalSummary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * lineHeight + 5;
  }

  // Work Experience
  if (cvData.workExperience && cvData.workExperience.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ESPERIENZA LAVORATIVA', margin, yPosition);
    yPosition += 8;

    cvData.workExperience.forEach(exp => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(exp.position, margin, yPosition);
      yPosition += lineHeight;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${exp.company} - ${exp.location}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(exp.period, margin, yPosition);
      yPosition += lineHeight;
      
      if (exp.description) {
        const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin);
        doc.text(descLines, margin, yPosition);
        yPosition += descLines.length * lineHeight;
      }
      yPosition += 5;
    });
  }

  // Skills
  if (cvData.skills && cvData.skills.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPETENZE', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const skillsText = cvData.skills.join(' • ');
    const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
    doc.text(skillsLines, margin, yPosition);
    yPosition += skillsLines.length * lineHeight + 5;
  }

  // Languages
  if (cvData.languages && cvData.languages.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LINGUE', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    cvData.languages.forEach(lang => {
      doc.text(`${lang.language}: ${lang.level}`, margin, yPosition);
      yPosition += lineHeight;
    });
    yPosition += 5;
  }

  // Education
  if (cvData.education && cvData.education.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ISTRUZIONE', margin, yPosition);
    yPosition += 8;

    cvData.education.forEach(edu => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(edu.title, margin, yPosition);
      yPosition += lineHeight;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${edu.institution} - ${edu.location}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(edu.year, margin, yPosition);
      yPosition += lineHeight + 3;
    });
  }

  // References
  if (cvData.references) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REFERENZE', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(cvData.references, margin, yPosition);
  }

  // Save the PDF
  const filename = `CV_${cvData.personalInfo.name?.replace(/\s+/g, '_') || 'Curriculum'}_${Date.now()}.pdf`;
  doc.save(filename);
};

export default function ChatInterface({ language, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Send initial greeting
    const greeting = getGreeting(language.code);
    setMessages([{ role: 'assistant', content: greeting }]);
  }, [language]);

  const getGreeting = (langCode: string) => {
    const greetings: { [key: string]: string } = {
      it: "Ciao! Sono qui per aiutarti a creare un CV professionale per il mercato del lavoro italiano nel settore domestico. Che tipo di posizione stai cercando? (es: badante, collaboratore domestico, baby-sitter, giardiniere, autista, cuoco)",
      en: "Hello! I'm here to help you create a professional CV for the Italian domestic work market. What type of position are you looking for? (e.g., caregiver, domestic worker, babysitter, gardener, driver, cook)",
      es: "¡Hola! Estoy aquí para ayudarte a crear un CV profesional para el mercado laboral italiano en el sector doméstico. ¿Qué tipo de posición buscas? (ej: cuidador, empleado doméstico, niñera, jardinero, conductor, cocinero)",
      fr: "Bonjour! Je suis là pour vous aider à créer un CV professionnel pour le marché du travail italien dans le secteur domestique. Quel type de poste recherchez-vous? (ex: aide-soignant, employé domestique, baby-sitter, jardinier, chauffeur, cuisinier)",
      ar: "مرحباً! أنا هنا لمساعدتك في إنشاء سيرة ذاتية مهنية لسوق العمل الإيطالي في القطاع المنزلي. ما نوع المنصب الذي تبحث عنه؟ (مثل: مقدم رعاية، عامل منزلي، مربية أطفال، بستاني، سائق، طباخ)",
      ro: "Salut! Sunt aici să te ajut să creezi un CV profesional pentru piața muncii italiene din sectorul domestic. Ce tip de poziție cauți? (ex: îngrijitor, muncitor domestic, bonă, grădinar, șofer, bucătar)",
      pl: "Cześć! Jestem tutaj, aby pomóc Ci stworzyć profesjonalne CV na włoski rynek pracy w sektorze domowym. Jakiego typu pozycji szukasz? (np: opiekun, pracownik domowy, niania, ogrodnik, kierowca, kucharz)",
      uk: "Привіт! Я тут, щоб допомогти вам створити професійне резюме для італійського ринку праці у домашньому секторі. Яку посаду ви шукаете? (наприклад: доглядальник, домашній працівник, няня, садівник, водій, кухар)"
    };
    return greetings[langCode] || greetings.it;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('cv-chat', {
        body: {
          message: userMessage,
          sessionId,
          language: language.nativeName
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (!sessionId) {
        setSessionId(data.sessionId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Mi dispiace, si è verificato un errore. Riprova.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCV = async () => {
    if (!sessionId || isGeneratingCV) return;

    setIsGeneratingCV(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-cv', {
        body: { sessionId }
      });

      if (error) throw error;

      // Generate and download PDF
      generatePDF(data.cv);

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Perfetto! Il tuo CV è stato generato e scaricato in formato PDF. Il file contiene tutte le tue informazioni formattate professionalmente per il mercato del lavoro italiano.' 
      }]);
    } catch (error) {
      console.error('Error generating CV:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Si è verificato un errore durante la generazione del CV. Riprova.' 
      }]);
    } finally {
      setIsGeneratingCV(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Indietro
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{language.flag}</span>
          <span className="font-semibold">{language.nativeName}</span>
        </div>
        <Button 
          onClick={generateCV}
          disabled={messages.length < 4 || isGeneratingCV}
          variant="default"
        >
          {isGeneratingCV ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Genera CV PDF
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground p-3 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi il tuo messaggio..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}