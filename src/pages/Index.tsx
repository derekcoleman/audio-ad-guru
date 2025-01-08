import ScriptGenerator from "@/components/ScriptGenerator";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-brand-50/50">
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-brand-500 to-brand-700 text-transparent bg-clip-text">
            AI Audio Ad Creator
          </h1>
          <p className="text-xl text-muted-foreground">
            Create professional audio ads in minutes with AI
          </p>
        </div>

        <ScriptGenerator />
      </div>
    </div>
  );
};

export default Index;