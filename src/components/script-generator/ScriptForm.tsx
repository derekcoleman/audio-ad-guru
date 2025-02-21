
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScriptFormProps {
  onScriptGenerated: (script: string) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  onDurationChange: (duration: string) => void;
}

const ScriptForm = ({
  onScriptGenerated,
  isGenerating,
  setIsGenerating,
  onDurationChange,
}: ScriptFormProps) => {
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: { brandName, description, duration }
      });

      if (error) throw error;

      const script = data.choices[0].message.content;
      onScriptGenerated(script);
      
      toast({
        title: "Success",
        description: "Your script has been generated!",
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

  const handleDurationChange = (value: string) => {
    setDuration(value);
    onDurationChange(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="duration">Ad Duration</Label>
        <Select
          value={duration}
          onValueChange={handleDurationChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 seconds</SelectItem>
            <SelectItem value="30">30 seconds</SelectItem>
            <SelectItem value="45">45 seconds</SelectItem>
            <SelectItem value="60">60 seconds</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name</Label>
        <Input
          id="brandName"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Enter your brand name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your brand and what you want to promote"
          className="h-32"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate Script"}
      </Button>
    </form>
  );
};

export default ScriptForm;
