import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const openAIApiKey = Deno.env.get('API_KEY');
const supabaseUrl = 'https://upiskwyxcqcczbukmehj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwaXNrd3l4Y3FjY3pidWttZWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Njk4MTgsImV4cCI6MjA3MjE0NTgxOH0.CE3FmSp9YTjDOiKhbWNkpMusFq9jQkaMd-9cj3fZ5GM';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseKey);

const getCVGenerationPrompt = () => {
  return `Sei un esperto HR che crea CV professionali per il mercato italiano del settore domestico.

Analizza la conversazione fornita e crea un CV strutturato in ITALIANO seguendo questo formato JSON:

{
  "personalInfo": {
    "name": "Nome Completo",
    "phone": "Telefono",
    "email": "Email",
    "address": "Indirizzo in Italia",
    "nationality": "Nazionalità"
  },
  "professionalSummary": "Breve profilo professionale (2-3 righe) che evidenzi esperienza nel settore domestico",
  "workExperience": [
    {
      "position": "Posizione (in italiano)",
      "company": "Nome famiglia/azienda",
      "location": "Città, Paese",
      "period": "MM/AAAA - MM/AAAA",
      "description": "Descrizione dettagliata delle responsabilità e risultati"
    }
  ],
  "skills": [
    "Competenza specifica 1",
    "Competenza specifica 2"
  ],
  "languages": [
    {
      "language": "Lingua",
      "level": "Livello (A1-C2 o Madrelingua)"
    }
  ],
  "education": [
    {
      "title": "Titolo di studio",
      "institution": "Istituzione",
      "year": "Anno",
      "location": "Città, Paese"
    }
  ],
  "references": "Disponibili su richiesta" o dettagli se forniti
}

IMPORTANTE:
- Traduci tutto in italiano professionale
- Usa terminologia appropriata per il mercato italiano
- Evidenzia competenze rilevanti per il settore domestico
- Mantieni un tono professionale ma accessibile
- Se mancano informazioni, usa "Da specificare" o simili`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    console.log('Generating CV for session:', sessionId);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get session data
    const { data: session, error } = await supabase
      .from('cv_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      throw new Error('Session not found');
    }

    // Prepare conversation text for CV generation
    const conversationText = (session.chat_history as any[] || [])
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    console.log('Processing conversation of length:', conversationText.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: getCVGenerationPrompt() },
          { role: 'user', content: `Conversazione da analizzare:\n\n${conversationText}` }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let cvData;
    
    try {
      cvData = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse CV JSON:', parseError);
      throw new Error('Failed to generate structured CV');
    }

    // Save generated CV to session
    await supabase
      .from('cv_sessions')
      .update({ generated_cv: cvData })
      .eq('id', sessionId);

    console.log('Successfully generated CV');

    return new Response(JSON.stringify({ 
      success: true,
      cv: cvData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-cv function:', error);
    return new Response(JSON.stringify({ 
      error: 'Errore durante la generazione del CV. Riprova.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});