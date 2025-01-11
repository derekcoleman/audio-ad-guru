import { useState } from "react";
import ScriptForm from "./script-generator/ScriptForm";
import ScriptDisplay from "./script-generator/ScriptDisplay";
import AudioGenerator from "./script-generator/AudioGenerator";

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const ScriptGenerator = () => {
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <ScriptForm
        onScriptGenerated={setGeneratedScript}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
      />

      {generatedScript && (
        <div className="space-y-4 border p-4 rounded-lg">
          <ScriptDisplay
            script={generatedScript}
            onScriptChange={setGeneratedScript}
          />
          <AudioGenerator script={generatedScript} />
        </div>
      )}
    </div>
  );
};

export default ScriptGenerator;