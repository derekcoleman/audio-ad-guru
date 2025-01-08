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

const ScriptGenerator = () => {
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
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
    // Simulate API call
    setTimeout(() => {
      setGeneratedScript(
        `Introducing ${brandName} - ${description}. Experience the difference today!`
      );
      setIsGenerating(false);
      toast({
        title: "Script Generated",
        description: "Your ad script has been created successfully!",
      });
    }, 2000);
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
    // Simulate API call
    setTimeout(() => {
      setIsGeneratingAudio(false);
      toast({
        title: "Audio Generated",
        description: "Your audio ad has been created successfully!",
      });
    }, 3000);
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
                <SelectItem value="alice">Alice (Female)</SelectItem>
                <SelectItem value="bob">Bob (Male)</SelectItem>
                <SelectItem value="charlie">Charlie (Male)</SelectItem>
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
        </div>
      )}
    </div>
  );
};

export default ScriptGenerator;