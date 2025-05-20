import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RecordButton from './RecordButton';
import AudioWaveform from './AudioWaveform';
import LoadingSpinner from './LoadingSpinner';
import { uploadAudio } from '../api/audioService';
import { toast } from "@/hooks/use-toast";
import Recorder from 'recorder-js';

const AudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const recorderRef = useRef<Recorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const recorder = new Recorder(audioContext);
      await recorder.init(stream);

      recorderRef.current = recorder;
      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 12) {
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
      console.error('Microphone access error:', error);
      setPermissionDenied(true);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      const { blob } = await recorderRef.current.stop();

      streamRef.current?.getTracks().forEach(track => track.stop());

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);
      await processRecording(blob);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const processRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      toast({
        title: "Processing audio",
        description: "Analyzing your recording...",
        duration: 3000,
      });

      const result = await uploadAudio(audioBlob);
      navigate('/result', { state: result });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process audio.",
        variant: "destructive",
      });
      navigate('/result', {
        state: { error: 'Failed to process audio.' },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
          {isRecording ? "Tap to stop recording" : "Tap the microphone to identify a song"}
        </p>
      </div>
    </div>
  );
};

export default AudioRecorder;
