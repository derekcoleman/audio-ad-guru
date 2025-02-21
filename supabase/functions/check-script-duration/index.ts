
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script } = await req.json();
    console.log('Received script:', script);
    
    if (!script) {
      throw new Error('Script is required');
    }

    const elevenLabsKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!elevenLabsKey) {
      console.error('ElevenLabs API key missing');
      throw new Error('ElevenLabs API key not configured');
    }

    // First, get an available voice ID
    const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': elevenLabsKey,
      },
    });

    if (!voicesResponse.ok) {
      throw new Error('Failed to fetch voices');
    }

    const voicesData = await voicesResponse.json();
    const voiceId = voicesData.voices[0]?.voice_id;
    
    if (!voiceId) {
      throw new Error('No voices available');
    }

    console.log('Making request to ElevenLabs speech generation...');

    // Use the text-to-speech endpoint with the voice ID
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input-length`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
      }),
    });

    console.log('ElevenLabs response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('ElevenLabs response data:', data);

    // The response includes expected_duration in seconds
    return new Response(
      JSON.stringify({ duration: data.expected_duration }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Function error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while checking script duration' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
