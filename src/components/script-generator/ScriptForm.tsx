import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OpenAIResponse } from "@/types/openai";

interface ScriptFormProps {
  onScriptGenerated: (script: string) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

const ScriptForm = ({ onScriptGenerated, isGenerating, setIsGenerating }: ScriptFormProps) => {
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!brandName || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: secretData, error: secretError } = await supabase
        .from('secrets')
        .select('*')
        .eq('key', 'OPENAI_API_KEY')
        .maybeSingle();

      if (secretError) {
        console.error('Error fetching OpenAI API key:', secretError);
        throw new Error('Failed to retrieve OpenAI API key');
      }

      if (!secretData?.value) {
        console.error('OpenAI API key not found in secrets');
        toast({
          title: "Configuration Error",
          description: "OpenAI API key not found. Please check your configuration.",
          variant: "destructive",
        });
        return;
      }

      console.log('Attempting to generate script with OpenAI...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretData.value}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
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
        throw new Error('Failed to generate script');
      }

      const data = await response.json() as OpenAIResponse;
      onScriptGenerated(data.choices[0].message.content);
      toast({
        title: "Success!",
        description: "Your ad script has been created successfully!",
      });
    } catch (error) {
      console.error('Script generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name</Label>
        <Input
          id="brandName"
          placeholder="Enter your brand name"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Brand Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your brand and what makes it unique"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Ad Duration</Label>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 seconds</SelectItem>
            <SelectItem value="30">30 seconds</SelectItem>
            <SelectItem value="60">60 seconds</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleGenerate}
        className="w-full"
        disabled={isGenerating}
      >
        {isGenerating ? "Generating Script..." : "Generate Script"}
      </Button>
    </div>
  );
};

export default ScriptForm;