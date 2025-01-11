import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AudioWaveform from "../AudioWaveform";
import { supabase } from "@/integrations/supabase/client";

interface AudioGeneratorProps {
  script: string;
}

const AudioGenerator = ({ script }: AudioGeneratorProps) => {
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateAudio = async () => {
    if (!script || !selectedVoice) {
      toast({
        title: "Missing Information",
        description: "Please generate a script and select a voice first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const { data: secrets, error: secretError } = await supabase
        .from('secrets')
        .select('value')
        .eq('key', 'ELEVEN_LABS_API_KEY')
        .single();

      if (secretError || !secrets?.value) {
        throw new Error('Failed to retrieve ElevenLabs API key');
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': secrets.value,
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
    <div className="space-y-4">
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
  );
};

export default AudioGenerator;