
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Function started:', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { script, voiceId } = await req.json();
    console.log('Received request with:', { scriptLength: script?.length, voiceId });

    // Validate inputs
    if (!script) {
      throw new Error('Script is required');
    }
    if (!voiceId) {
      throw new Error('Voice ID is required');
    }

    // Check for API key
    const elevenLabsKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!elevenLabsKey) {
      console.error('ElevenLabs API key not found');
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Making request to ElevenLabs API...');
    
    // First verify the voice exists
    const voiceCheckResponse = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
    });

    if (!voiceCheckResponse.ok) {
      const errorText = await voiceCheckResponse.text();
      console.error('Voice check failed:', errorText);
      throw new Error(`Invalid voice ID: ${voiceId}`);
    }

    // Generate the audio
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsKey,
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
      console.error('ElevenLabs text-to-speech error:', errorText);
      throw new Error(`ElevenLabs API error: ${errorText}`);
    }

    console.log('Successfully generated audio');
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate audio',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
