
import React from 'react';
import AudioRecorder from '../components/AudioRecorder';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute w-64 h-64 bg-purple-300/20 rounded-full blur-3xl -top-20 -right-20"></div>
      <div className="absolute w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl -bottom-32 -left-32"></div>
      
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-song-purple to-song-deep-purple">
          AUDIORA
        </h1>
        <p className="text-lg text-gray-700 mb-8 max-w-md">
          Hold your device close to the music source and tap the button to identify any song
        </p>
      </div>

      <div className="w-full max-w-md futuristic-card p-8 relative z-10">
        <AudioRecorder />
      </div>

      <p className="text-sm text-gray-600 mt-8 max-w-md text-center relative z-10">
        Recording will automatically stop after 12 seconds, or tap again to stop manually.
      </p>
    </div>
  );
};

export default Index;
