
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(arrayBuffer: ArrayBuffer) {
  const chunks: string[] = [];
  const uint8Array = new Uint8Array(arrayBuffer);
  const chunkSize = 32768;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    chunks.push(String.fromCharCode(...chunk));
  }
  
  return btoa(chunks.join(''));
}

serve(async (req) => {
  console.log('Function started:', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { script, voiceId } = await req.json();
    console.log('Processing request for voice:', voiceId);

    // Input validation
    if (!script?.trim()) {
      throw new Error('Script cannot be empty');
    }
    if (!voiceId?.trim()) {
      throw new Error('Voice ID cannot be empty');
    }

    const elevenLabsKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!elevenLabsKey) {
      console.error('Missing ElevenLabs API key');
      throw new Error('ElevenLabs API key not configured');
    }

    // First verify the voice exists
    console.log('Verifying voice ID...');
    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      headers: {
        'xi-api-key': elevenLabsKey,
      },
    });

    if (!voiceResponse.ok) {
      const errorData = await voiceResponse.text();
      console.error('Voice verification failed:', errorData);
      throw new Error('Invalid voice ID or API key');
    }

    // Generate audio
    console.log('Generating audio...');
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
      const errorData = await response.text();
      console.error('Text-to-speech request failed:', errorData);
      throw new Error('Failed to generate audio');
    }

    console.log('Audio generated successfully, processing response...');
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = processBase64Chunks(arrayBuffer);

    console.log('Sending response...');
    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in generate-audio function:', {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
