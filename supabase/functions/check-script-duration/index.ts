
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
    console.log('Received script:', script); // Debug log
    
    if (!script) {
      throw new Error('Script is required');
    }

    const elevenLabsKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!elevenLabsKey) {
      console.error('ElevenLabs API key missing'); // Debug log
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Making request to ElevenLabs...'); // Debug log

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/text-analysis', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
      }),
    });

    console.log('ElevenLabs response status:', response.status); // Debug log

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('ElevenLabs response data:', data); // Debug log

    return new Response(
      JSON.stringify({ duration: data.duration }),
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
