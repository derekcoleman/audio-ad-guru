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
  duration: string;
  onScriptChange: (newScript: string) => void;
}

const SAMPLE_TEXT = "Hello! This is a sample of my voice. How do I sound?";

const AudioGenerator = ({ script, duration, onScriptChange }: AudioGeneratorProps) => {
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
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

  const handleVoiceChange = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    setSampleAudioUrl(null);
    setIsPlayingSample(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { script: SAMPLE_TEXT, voiceId }
      });

      if (error) throw error;

      const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audioContent}`).then(res => res.blob());
      const url = URL.createObjectURL(audioBlob);
      
      if (sampleAudioUrl) {
        URL.revokeObjectURL(sampleAudioUrl);
      }
      
      setSampleAudioUrl(url);
    } catch (error) {
      console.error('Sample audio generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate voice sample. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlayingSample(false);
    }
  };

  useEffect(() => {
    return () => {
      if (sampleAudioUrl) {
        URL.revokeObjectURL(sampleAudioUrl);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const estimateScriptDuration = (text: string) => {
    const wordsPerMinute = 140;
    const words = text.trim().split(/\s+/).length;
    return (words / wordsPerMinute) * 60;
  };

  const handleAdjustScript = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('adjust-script-length', {
        body: { 
          script,
          targetDuration: parseInt(duration)
        }
      });

      if (error) throw error;

      onScriptChange(data.adjustedScript);
      
      toast({
        title: "Script Adjusted",
        description: "The script has been adjusted to fit the selected duration.",
      });
    } catch (error) {
      console.error('Script adjustment error:', error);
      toast({
        title: "Error",
        description: "Failed to adjust script length. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAudio = async () => {
    if (!script || !selectedVoice) {
      toast({
        title: "Missing Information",
        description: "Please generate a script and select a voice first",
        variant: "destructive",
      });
      return;
    }

    const estimatedDuration = estimateScriptDuration(script);
    const selectedDurationSeconds = parseInt(duration);
    
    if (estimatedDuration > selectedDurationSeconds) {
      toast({
        title: "Script Too Long",
        description: (
          <div className="space-y-2">
            <p>The script is estimated to take {Math.round(estimatedDuration)} seconds, but the selected duration is {selectedDurationSeconds} seconds.</p>
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                handleAdjustScript();
              }}
              className="w-full mt-2"
            >
              Adjust Script Length Automatically
            </Button>
          </div>
        ),
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

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

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
        <Select value={selectedVoice} onValueChange={handleVoiceChange}>
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

        {sampleAudioUrl && (
          <div className="mt-2">
            <Label>Voice Sample</Label>
            <audio controls className="w-full mt-1" key={sampleAudioUrl}>
              <source src={sampleAudioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
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
          <Label>Generated Audio Ad</Label>
          <audio controls className="w-full" key={audioUrl}>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default AudioGenerator;
