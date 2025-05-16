
import React, { useEffect, useState } from 'react';

const AudioWaveform: React.FC = () => {
  const [heights, setHeights] = useState<number[]>(Array.from({ length: 12 }, () => 8));
  
  // Create animation effect for waveform
  useEffect(() => {
    const interval = setInterval(() => {
      setHeights(Array.from({ length: 12 }, () => 8 + Math.floor(Math.random() * 20)));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Create dynamic bars with different heights and animation delays
  const bars = heights.map((height, i) => {
    return (
      <div
        key={i}
        className="waveform-bar h-full"
        style={{ 
          animationDelay: `${i * 0.1}s`,
          height: `${height}px`,
          opacity: 0.6 + (i % 3) * 0.2, // Vary opacity for more dynamic effect
        }}
      />
    );
  });

  return (
    <div className="flex items-center justify-center h-20 gap-1 py-4">
      {bars}
    </div>
  );
};

export default AudioWaveform;
