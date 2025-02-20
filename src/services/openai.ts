
import { supabase } from "@/integrations/supabase/client";
import { OpenAIResponse } from "@/types/openai";

export class OpenAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export async function getOpenAIKey(): Promise<string> {
  const { data, error } = await supabase
    .from('secrets')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch OpenAI API key:', error);
    throw new OpenAIError('Failed to retrieve OpenAI API key');
  }

  if (!data?.value) {
    throw new OpenAIError('OpenAI API key not found. Please make sure you have set it in your Supabase secrets.');
  }

  return data.value;
}

export async function generateAdScript(brandName: string, description: string, duration: string): Promise<string> {
  try {
    const apiKey = await getOpenAIKey();
    console.log('Successfully retrieved API key');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new OpenAIError('Failed to generate script. Please try again.');
    }

    const data = await response.json() as OpenAIResponse;
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Script generation error:', error);
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError('Failed to generate script. Please try again.');
  }
}
