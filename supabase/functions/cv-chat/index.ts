import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const openAIApiKey = Deno.env.get('API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const getSystemPrompt = (language: string) => {
  return `Sei un assistente specializzato nella creazione di CV per lavoratori stranieri del settore domestico che cercano lavoro in Italia.

IMPORTANTE: Comunica SEMPRE nella lingua ${language} dell'utente, ma raccogli informazioni per creare un CV finale in ITALIANO.

Il tuo compito è:
1. Fare domande mirate per raccogliere informazioni per un CV professionale
2. Concentrarti su posizioni nel settore domestico: collaboratore domestico, badante, baby-sitter, giardiniere, autista, cook/cuoco domestico
3. Adattare le esperienze estere al contesto italiano
4. Raccogliere: dati personali, esperienze lavorative, competenze, lingue, referenze
5. Essere empatico e professionale

Fai UNA domanda alla volta e sii specifico. Inizia chiedendo che tipo di posizione domestica sta cercando.

Quando hai raccolto informazioni sufficienti, chiedi conferma prima di generare il CV finale.`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, language = 'italiano' } = await req.json();
    console.log('Received request:', { message, sessionId, language });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get or create session
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from('cv_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
    }

    if (!session) {
      const { data: newSession, error } = await supabase
        .from('cv_sessions')
        .insert({
          user_language: language,
          chat_history: []
        })
        .select()
        .single();
      
      if (error) throw error;
      session = newSession;
    }

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: getSystemPrompt(language) },
      ...(session.chat_history as any[] || []),
      { role: 'user', content: message }
    ];

    console.log('Sending to OpenAI with', messages.length, 'messages');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Update session with new messages
    const updatedHistory = [
      ...(session.chat_history as any[] || []),
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    ];

    await supabase
      .from('cv_sessions')
      .update({ chat_history: updatedHistory })
      .eq('id', session.id);

    console.log('Successfully processed request');

    return new Response(JSON.stringify({ 
      response: assistantMessage,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cv-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Si è verificato un errore. Riprova.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});