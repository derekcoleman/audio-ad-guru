
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  onVoiceSelect: (voiceId: string) => void;
  estimatedDuration: number | null;
  setEstimatedDuration: (duration: number | null) => void;
}

const SAMPLE_TEXT = "Hello! This is a sample of my voice. How do I sound?";

const AudioGenerator = ({ 
  script, 
  duration, 
  onVoiceSelect,
  estimatedDuration,
  setEstimatedDuration
}: AudioGeneratorProps) => {
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [isCheckingDuration, setIsCheckingDuration] = useState(false);
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

  const checkScriptDuration = async (voiceId: string) => {
    setIsCheckingDuration(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-script-duration', {
        body: { 
          script, 
          voiceId 
        }
      });

      if (error) throw error;
      setEstimatedDuration(data.duration);
    } catch (error) {
      console.error('Duration check error:', error);
      toast({
        title: "Error",
        description: "Failed to check script duration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingDuration(false);
    }
  };

  const handleVoiceChange = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    onVoiceSelect(voiceId);
    setSampleAudioUrl(null);
    setIsPlayingSample(true);
    
    try {
      // Generate sample audio
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { script: SAMPLE_TEXT, voiceId }
      });

      if (error) {
        if (error.message.includes('free_users_not_allowed') || error.message.includes('FREE_USER_RESTRICTED')) {
          toast({
            title: "Voice Unavailable",
            description: "This voice is not available for free users. Please try a different voice or upgrade your ElevenLabs account.",
            variant: "destructive",
          });
          setSelectedVoice("");
          onVoiceSelect("");
          return;
        }
        throw error;
      }

      const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audioContent}`).then(res => res.blob());
      const url = URL.createObjectURL(audioBlob);
      
      if (sampleAudioUrl) {
        URL.revokeObjectURL(sampleAudioUrl);
      }
      
      setSampleAudioUrl(url);

      // Check script duration with selected voice
      await checkScriptDuration(voiceId);

    } catch (error) {
      console.error('Sample audio generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate voice sample. Please try again.",
        variant: "destructive",
      });
      setSelectedVoice("");
      onVoiceSelect("");
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

  const handleGenerateAudio = async () => {
    if (!script || !selectedVoice) {
      toast({
        title: "Missing Information",
        description: "Please generate a script and select a voice first",
        variant: "destructive",
      });
      return;
    }

    const selectedDurationSeconds = parseInt(duration);
    
    if (estimatedDuration && estimatedDuration > selectedDurationSeconds) {
      toast({
        title: "Script Too Long",
        description: `The script is estimated to take ${Math.round(estimatedDuration)} seconds, but the selected duration is ${selectedDurationSeconds} seconds. Please shorten the script or choose a longer duration.`,
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { script, voiceId: selectedVoice }
      });

      if (error) {
        if (error.message.includes('free_users_not_allowed') || error.message.includes('FREE_USER_RESTRICTED')) {
          toast({
            title: "Voice Unavailable",
            description: "This voice is not available for free users. Please try a different voice or upgrade your ElevenLabs account.",
            variant: "destructive",
          });
          setSelectedVoice("");
          onVoiceSelect("");
          return;
        }
        throw error;
      }

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

        {estimatedDuration !== null && (
          <Alert className="mt-2">
            <AlertDescription>
              {estimatedDuration > parseInt(duration) ? (
                <span className="text-destructive">
                  ⚠️ Script is too long! Estimated duration: {Math.round(estimatedDuration)} seconds. Please shorten the script or increase the ad duration.
                </span>
              ) : (
                <span className="text-green-600">
                  ✓ Script duration: {Math.round(estimatedDuration)} seconds (fits within {duration} second limit)
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Voice Sample Player */}
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
        disabled={isGeneratingAudio || !selectedVoice || (estimatedDuration !== null && estimatedDuration > parseInt(duration))}
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
