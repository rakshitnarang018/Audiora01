
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RecordButton from './RecordButton';
import AudioWaveform from './AudioWaveform';
import LoadingSpinner from './LoadingSpinner';
import { mockUploadAudio } from '../api/audioService';
import { toast } from "@/hooks/use-toast";

const AudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Clean up resources when component unmounts
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = handleRecordingStop;
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 12) {
            // Auto-stop after 12 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      toast({
        title: "Recording started",
        description: "Listening for music...",
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermissionDenied(true);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use this app.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.stop());
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
  };

  const handleRecordingStop = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing audio",
        description: "Analyzing your recording...",
        duration: 3000,
      });
      
      // Use the mock service for now
      const result = await mockUploadAudio(audioBlob);
      
      // Navigate to result page with the response
      navigate('/result', { state: result });
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive",
      });
      
      navigate('/result', { 
        state: { 
          error: 'Failed to process audio. Please try again.'
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (permissionDenied) {
    return (
      <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
        <h2 className="text-xl text-red-600 font-semibold mb-4">Microphone Access Denied</h2>
        <p className="mb-6 text-gray-700">Please allow microphone access in your browser settings to use this app.</p>
        <button
          onClick={() => setPermissionDenied(false)}
          className="px-6 py-3 bg-gradient-to-r from-song-purple to-song-deep-purple text-white rounded-lg hover:opacity-90 shadow-md shadow-purple-300/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="w-full h-20 flex items-center justify-center">
        {isRecording ? (
          <AudioWaveform />
        ) : (
          <div className="text-lg text-gray-400 font-light">
            Tap the microphone button to start
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center gap-6">
        {isRecording && (
          <div className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-song-purple to-song-deep-purple mb-2">
            {formatTime(recordingTime)}
            <div className="text-xs text-gray-500 text-center mt-1">
              {12 - recordingTime} seconds remaining
            </div>
          </div>
        )}
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="large" />
            <p className="text-md">Analyzing your recording...</p>
          </div>
        ) : (
          <RecordButton 
            isRecording={isRecording} 
            onClick={toggleRecording}
            disabled={isProcessing}
          />
        )}
        
        <p className="text-md text-gray-600 text-center">
          {isRecording
            ? "Tap to stop recording"
            : "Tap the microphone to identify a song"}
        </p>
      </div>
    </div>
  );
};

export default AudioRecorder;
