
import { supabase } from "@/integrations/supabase/client";
import { OpenAIResponse } from "@/types/openai";

export class OpenAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export async function generateAdScript(brandName: string, description: string, duration: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: { brandName, description, duration }
    });

    if (error) {
      console.error('Script generation error:', error);
      throw new OpenAIError('Failed to generate script. Please try again.');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Script generation error:', error);
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError('Failed to generate script. Please try again.');
  }
}
