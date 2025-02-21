
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AudioWaveform from "../AudioWaveform";
import { supabase } from "@/integrations/supabase/client";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

interface AudioGeneratorProps {
  script: string;
}

const AudioGenerator = ({ script }: AudioGeneratorProps) => {
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-voices');
        
        if (error) throw error;
        
        if (data.voices) {
          setVoices(data.voices);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        toast({
          title: "Error",
          description: "Failed to load available voices. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingVoices(false);
      }
    };

    fetchVoices();
  }, [toast]);

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
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { script, voiceId: selectedVoice }
      });

      if (error) throw error;

      const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audioContent}`).then(res => res.blob());
      const url = URL.createObjectURL(audioBlob);
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
            <SelectValue placeholder={isLoadingVoices ? "Loading voices..." : "Choose a voice"} />
          </SelectTrigger>
          <SelectContent>
            {isLoadingVoices ? (
              <SelectItem value="loading" disabled>Loading available voices...</SelectItem>
            ) : voices.length > 0 ? (
              voices.map((voice) => (
                <SelectItem key={voice.voice_id} value={voice.voice_id}>
                  {voice.name} ({voice.category})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-voices" disabled>No voices available</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleGenerateAudio}
        className="w-full"
        disabled={isGeneratingAudio || !selectedVoice}
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
