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
import AudioWaveform from "./AudioWaveform";
import { supabase } from "@/integrations/supabase/client";

const ScriptGenerator = () => {
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
      const { data: { OPENAI_API_KEY }, error: secretError } = await supabase
        .from('secrets')
        .select('OPENAI_API_KEY')
        .single();

      if (secretError || !OPENAI_API_KEY) {
        throw new Error('Failed to retrieve OpenAI API key');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate script');
      }

      setGeneratedScript(data.choices[0].message.content);
      toast({
        title: "Script Generated",
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

  const handleGenerateAudio = async () => {
    if (!generatedScript || !selectedVoice) {
      toast({
        title: "Missing Information",
        description: "Please generate a script and select a voice first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const { data: { ELEVEN_LABS_API_KEY }, error: secretError } = await supabase
        .from('secrets')
        .select('ELEVEN_LABS_API_KEY')
        .single();

      if (secretError || !ELEVEN_LABS_API_KEY) {
        throw new Error('Failed to retrieve ElevenLabs API key');
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY,
        },
        body: JSON.stringify({
          text: generatedScript,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      toast({
        title: "Audio Generated",
        description: "Your audio ad has been created successfully!",
      });
    } catch (error) {
      console.error('Audio generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
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

      {generatedScript && (
        <div className="space-y-4 border p-4 rounded-lg">
          <Label>Generated Script</Label>
          <Textarea
            value={generatedScript}
            onChange={(e) => setGeneratedScript(e.target.value)}
            className="min-h-[100px]"
          />

          <div className="space-y-2">
            <Label htmlFor="voice">Select Voice</Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel (Female)</SelectItem>
                <SelectItem value="AZnzlk1XvdvUeBnXmlld">Domi (Male)</SelectItem>
                <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella (Female)</SelectItem>
                <SelectItem value="ErXwobaYiN019PkySvjV">Antoni (Male)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateAudio}
            className="w-full"
            disabled={isGeneratingAudio}
          >
            {isGeneratingAudio ? (
              <div className="flex items-center gap-2">
                Generating Audio... <AudioWaveform />
              </div>
            ) : (
              "Generate Audio"
            )}
          </Button>

          {audioUrl && (
            <div className="mt-4">
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScriptGenerator;