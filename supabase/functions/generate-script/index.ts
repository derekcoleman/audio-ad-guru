
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { brandName, description, duration } = await req.json()
    console.log('Received request:', { brandName, description, duration })

    if (!brandName || !description || !duration) {
      throw new Error('Missing required parameters: brandName, description, and duration are required')
    }

    // Get OpenAI API key from Supabase secrets
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: secretData, error: secretError } = await supabase
      .from('secrets')
      .select('value')
      .eq('key', 'OPENAI_API_KEY')
      .single()

    if (secretError || !secretData) {
      console.error('Failed to retrieve OpenAI API key:', secretError)
      throw new Error('Failed to retrieve OpenAI API key from secrets')
    }

    const openAIKey = secretData.value

    // Make request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: `You are an expert copywriter specializing in ${duration}-second radio advertisements. Create compelling, concise scripts that fit within the time limit.`
        }, {
          role: "user",
          content: `Create a ${duration}-second radio ad script for ${brandName}. Here's the description: ${description}`
        }],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData}`)
    }

    const data = await response.json()
    console.log('Successfully generated script')

    return new Response(
      JSON.stringify({ script: data.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Script generation error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
