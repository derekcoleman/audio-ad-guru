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
import { generateAdScript, OpenAIError } from "@/services/openai";

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
      const script = await generateAdScript(brandName, description, duration);
      onScriptGenerated(script);
      toast({
        title: "Success!",
        description: "Your ad script has been created successfully!",
      });
    } catch (error) {
      console.error('Script generation error:', error);
      toast({
        title: "Error",
        description: error instanceof OpenAIError ? error.message : "Failed to generate script. Please try again.",
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