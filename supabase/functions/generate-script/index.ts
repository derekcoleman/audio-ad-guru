
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting script generation...');
    const { brandName, description, duration } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Checking OpenAI API key...');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Making request to OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: `You are a professional voice-over script writer for ${duration}-second radio advertisements. Create natural, conversational scripts containing only the actual spoken words. Do not include any audio directions, brackets, formatting, or sound effect descriptions. The script will be read exactly as written by a text-to-speech system.`
        }, {
          role: "user",
          content: `Write a ${duration}-second radio ad script for ${brandName}. Description: ${description}. Write only the exact words that should be spoken. Do not include any formatting, brackets, or audio directions.`
        }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully generated script');
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Script generation error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate script' }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
