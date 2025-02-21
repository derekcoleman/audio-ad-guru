
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Average speaking rate is about 150 words per minute
const WORDS_PER_MINUTE = 150;
const SECONDS_PER_MINUTE = 60;

function estimateScriptDuration(script: string): number {
  // Count words (split by spaces and filter out empty strings)
  const wordCount = script.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // Add 15% buffer for pauses and natural speech variations
  const durationInMinutes = (wordCount / WORDS_PER_MINUTE) * 1.15;
  
  // Convert to seconds and round to 1 decimal place
  return Math.round(durationInMinutes * SECONDS_PER_MINUTE * 10) / 10;
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

    const estimatedDuration = estimateScriptDuration(script);
    console.log('Estimated duration:', estimatedDuration, 'seconds');

    return new Response(
      JSON.stringify({ duration: estimatedDuration }),
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
