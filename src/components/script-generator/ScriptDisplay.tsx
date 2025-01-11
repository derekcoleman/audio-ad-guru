import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ScriptDisplayProps {
  script: string;
  onScriptChange: (script: string) => void;
}

const ScriptDisplay = ({ script, onScriptChange }: ScriptDisplayProps) => {
  return (
    <div className="space-y-2">
      <Label>Generated Script</Label>
      <Textarea
        value={script}
        onChange={(e) => onScriptChange(e.target.value)}
        className="min-h-[100px]"
      />
    </div>
  );
};

export default ScriptDisplay;