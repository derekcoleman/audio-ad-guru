
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check for API key first
    const elevenLabsKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!elevenLabsKey) {
      console.error('ElevenLabs API key not found');
      throw new Error('ElevenLabs API key not configured');
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid request body');
    }

    const { script, voiceId } = body;

    // Validate inputs
    if (!script?.trim()) {
      throw new Error('Script cannot be empty');
    }
    if (!voiceId?.trim()) {
      throw new Error('Voice ID cannot be empty');
    }

    console.log('Generating audio with voice:', voiceId);

    // Test API key with a simple request first
    const testResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': elevenLabsKey,
      },
    });

    if (!testResponse.ok) {
      console.error('API key validation failed:', await testResponse.text());
      throw new Error('Invalid ElevenLabs API key');
    }

    // Generate the audio
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`Failed to generate audio: ${errorText}`);
    }

    // Convert audio to base64
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    uint8Array.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    const base64Audio = btoa(binary);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
