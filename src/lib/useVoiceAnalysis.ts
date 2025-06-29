import { useState, useRef, useCallback } from 'react';
import { PitchDetector } from 'pitchy';

interface UseVoiceAnalysisOptions {
  onAnalysisComplete?: (result: any) => void;
}

export function useVoiceAnalysis(options?: UseVoiceAnalysisOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPitch, setCurrentPitch] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [sungNotes, setSungNotes] = useState<Set<string>>(new Set());
  const [displayedNote, setDisplayedNote] = useState<string | null>(null);
  const [pitchSamples, setPitchSamples] = useState<number[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const noteUpdateTimeoutRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enhanced startRecording with better error handling
  const startRecording = useCallback(async () => {
    try {
      console.log('[useVoiceAnalysis] Starting recording...');
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1,
        },
      });
      
      streamRef.current = stream;
      console.log('[useVoiceAnalysis] Microphone access granted');

      // Set up audio context and analyzer
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      pitchDetectorRef.current = PitchDetector.forFloat32Array(analyserRef.current.fftSize);
      
      console.log('[useVoiceAnalysis] Audio context and analyzer set up');

      // Start pitch detection
      startPitchDetection();

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      console.log('[useVoiceAnalysis] MediaRecorder created with mime type:', mimeType);

      // Reset state
      setRecordingDuration(0);
      setPitchSamples([]);
      setSungNotes(new Set());
      setCurrentPitch(null);
      setCurrentNote(null);
      setDisplayedNote(null);
      setAudioBlob(null);
      setAnalysisResult(null);
      setRecordingComplete(false);
      setAnalysisComplete(false);

      // Set up MediaRecorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('[useVoiceAnalysis] Audio chunk received, size:', event.data.size);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('[useVoiceAnalysis] Recording stopped, creating blob...');
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        console.log('[useVoiceAnalysis] Audio blob created, size:', blob.size);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log('[useVoiceAnalysis] Audio track stopped:', track.kind);
        });
        
        stopPitchDetection();
        setRecordingComplete(true);
        console.log('[useVoiceAnalysis] Recording complete');
      };

      mediaRecorder.onerror = (event) => {
        console.error('[useVoiceAnalysis] MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        stopPitchDetection();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      console.log('[useVoiceAnalysis] Recording started');

      // Clear any existing timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // Start new timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev: number) => prev + 1);
      }, 1000);

      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('[useVoiceAnalysis] Auto-stopping recording after 15 seconds');
          stopRecording();
        }
      }, 15000);

    } catch (err) {
      console.error('[useVoiceAnalysis] Failed to start recording:', err);
      setError('Please allow microphone access to continue with voice recording.');
    }
  }, []);

  // Enhanced stopRecording
  const stopRecording = useCallback(() => {
    console.log('[useVoiceAnalysis] Stopping recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Clear timer immediately
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Stop recording state and pitch detection
    setIsRecording(false);
    stopPitchDetection();
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startPitchDetection = () => {
    if (!analyserRef.current || !pitchDetectorRef.current) return;
    
    const input = new Float32Array(analyserRef.current.fftSize);
    
    const detectPitch = () => {
      if (!analyserRef.current || !pitchDetectorRef.current) return;
      
      analyserRef.current.getFloatTimeDomainData(input);
      const [pitch, clarity] = pitchDetectorRef.current.findPitch(input, audioContextRef.current?.sampleRate || 44100);
      
      if (clarity > 0.8 && pitch > 65 && pitch < 1050) {
        const note = getNoteFromFrequency(pitch);
        if (note) {
          setCurrentPitch(pitch.toFixed(1));
          setCurrentNote(note);
          setSungNotes((prev) => new Set([...prev, note]));
          updateDisplayedNote(note);
          setPitchSamples((prev) => [...prev, pitch]);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(detectPitch);
    };
    
    detectPitch();
  };

  const stopPitchDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (noteUpdateTimeoutRef.current) {
      clearTimeout(noteUpdateTimeoutRef.current);
      noteUpdateTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    pitchDetectorRef.current = null;
    setCurrentPitch(null);
    setCurrentNote(null);
    setDisplayedNote(null);
  };

  const getNoteFromFrequency = (frequency: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const a4 = 440;
    const c0 = a4 * Math.pow(2, -4.75);
    if (frequency < 20) return '';
    const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / c0));
    const octave = Math.floor(halfStepsFromC0 / 12);
    const noteIndex = halfStepsFromC0 % 12;
    return `${noteNames[noteIndex]}${octave}`;
  };

  const updateDisplayedNote = (note: string) => {
    if (noteUpdateTimeoutRef.current) {
      clearTimeout(noteUpdateTimeoutRef.current);
    }
    noteUpdateTimeoutRef.current = setTimeout(() => {
      setDisplayedNote(note);
    }, 150);
  };

  const calculateMeanPitch = () => {
    if (pitchSamples.length === 0) return undefined;
    const sum = pitchSamples.reduce((a, b) => a + b, 0);
    return parseFloat((sum / pitchSamples.length).toFixed(1));
  };

  // Enhanced analyzeVoice with better error handling and logging
  const analyzeVoice = useCallback(async (userId: string, apiUrl: string) => {
    if (!audioBlob) {
      console.error('[useVoiceAnalysis] No audio blob available for analysis');
      return;
    }
    try {
      setIsAnalyzing(true);
      setError(null);
      const meanPitch = calculateMeanPitch();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-recording.webm');
      formData.append('userId', userId);
      formData.append('sessionId', `session_${Date.now()}`);
      if (meanPitch !== undefined) formData.append('mean_pitch', meanPitch.toString());
      const response = await fetch(`${apiUrl}/analyze-voice`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`FastAPI analysis failed: ${response.status} - ${response.statusText}`);
      }
      const analysisData = await response.json();
      setAnalysisResult(analysisData.data);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      if (options?.onAnalysisComplete) {
        options.onAnalysisComplete(analysisData.data);
      }
    } catch (err) {
      setIsAnalyzing(false);
      setError('Voice analysis service temporarily unavailable.');
    }
  }, [options]);

  const resetRecording = () => {
    setIsRecording(false);
    setRecordingComplete(false);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setRecordingDuration(0);
    setError(null);
    setSungNotes(new Set());
    setDisplayedNote(null);
    setPitchSamples([]);
    setAudioBlob(null);
    setAnalysisResult(null);
    
    // Clear all timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (noteUpdateTimeoutRef.current) {
      clearTimeout(noteUpdateTimeoutRef.current);
      noteUpdateTimeoutRef.current = null;
    }
  };

  return {
    isRecording,
    recordingComplete,
    isAnalyzing,
    analysisComplete,
    error,
    currentPitch,
    currentNote,
    sungNotes,
    displayedNote,
    pitchSamples,
    recordingDuration,
    audioBlob,
    analysisResult,
    startRecording,
    stopRecording,
    analyzeVoice,
    resetRecording,
  };
}