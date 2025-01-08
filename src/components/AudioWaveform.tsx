const AudioWaveform = () => {
  return (
    <div className="flex items-end gap-1 h-12">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-brand-500 rounded-full animate-wave-${(i % 3) + 1}`}
          style={{
            height: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;