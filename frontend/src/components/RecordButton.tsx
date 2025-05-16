
import React from 'react';
import { Mic, Square } from 'lucide-react';

type RecordButtonProps = {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
};

const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={`record-button ${isRecording ? 'recording' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? (
        <Square className="animate-pulse" size={24} />
      ) : (
        <Mic size={24} />
      )}
      
      {/* Ripple effect for the recording state */}
      {isRecording && (
        <>
          <span className="absolute w-full h-full rounded-full bg-red-500/20 animate-ping"></span>
          <span className="absolute w-full h-full rounded-full bg-red-500/10 animate-pulse"></span>
        </>
      )}
    </button>
  );
};

export default RecordButton;
