import { useState, useEffect, useRef, useCallback } from 'react';
import { soundEffects } from '../services/soundEffects';

interface UseSpeechRecognitionOptions {
  language?: string;
  onCommand?: (command: string) => void;
}

export function useSpeechRecognition({
  language = 'en-US',
  onCommand,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 live microphone volume

  const recognitionRef = useRef<any>(null);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const lastExecutedRef = useRef<string>('');
  const lastExecutedTimeRef = useRef<number>(0);

  // Stop real-time microphone audio meter
  const stopAudioMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Start real-time audio analysis to visually confirm microphone is picking up sound
  const startAudioMonitoring = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err: any) {
      console.warn('Microphone audio monitoring unavailable:', err);
    }
  }, []);

  // Execute recognized command with deduplication
  const executeFinalCommand = useCallback((cmd: string) => {
    const cleaned = cmd.trim();
    if (!cleaned) return;

    const now = Date.now();
    if (
      cleaned.toLowerCase() === lastExecutedRef.current.toLowerCase() &&
      now - lastExecutedTimeRef.current < 2500
    ) {
      return;
    }

    lastExecutedRef.current = cleaned;
    lastExecutedTimeRef.current = now;
    setTranscript(cleaned);
    setInterimTranscript('');

    if (onCommandRef.current) {
      onCommandRef.current(cleaned);
    }
  }, []);

  // Setup Web Speech Recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError(
        'Browser Speech Recognition API is not supported in this browser. Please use Google Chrome, Edge, or Safari.'
      );
      return null;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Single utterance mode is most reliable across all Chromium/WebKit builds
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      soundEffects.playStartListening();
      startAudioMonitoring();
    };

    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      let interim = '';

      // Loop through all results from 0 to preserve multi-word context
      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          fullTranscript += item[0].transcript + ' ';
        } else {
          interim += item[0].transcript;
        }
      }

      const latestText = (fullTranscript || interim).trim();
      setInterimTranscript(interim || latestText);

      if (fullTranscript.trim()) {
        const finalClean = fullTranscript.trim();
        setTranscript(finalClean);
        executeFinalCommand(finalClean);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error);
      setIsListening(false);
      stopAudioMonitoring();
      soundEffects.playStopListening();

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError(
          'Microphone permission was denied. Please allow microphone access in your browser address bar.'
        );
      } else if (event.error === 'no-speech') {
        setError('No speech was detected. Please click the microphone and speak clearly.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone found or another application is using the microphone.');
      } else if (event.error === 'network') {
        setError('Speech recognition network error. Check your connection or use the text command input.');
      } else {
        setError(`Speech recognition note: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAudioMonitoring();
    };

    return recognition;
  }, [language, executeFinalCommand, startAudioMonitoring, stopAudioMonitoring]);

  useEffect(() => {
    recognitionRef.current = initRecognition();

    return () => {
      stopAudioMonitoring();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [initRecognition, stopAudioMonitoring]);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    // Re-initialize recognition to ensure fresh state
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (!recognitionRef.current) {
      setError('Speech recognition engine could not be initialized.');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      console.warn('Recognition start caught:', err);
      if (err.name === 'InvalidStateError') {
        // Stop and restart cleanly
        try {
          recognitionRef.current.abort();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch {}
          }, 100);
        } catch {}
      } else {
        setError('Could not activate microphone. Please verify browser permissions.');
      }
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        soundEffects.playStopListening();
      } catch {}
    }
    stopAudioMonitoring();
    setIsListening(false);
  }, [stopAudioMonitoring]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    audioLevel,
    startListening,
    stopListening,
    toggleListening,
    executeVoiceCommandDirectly: executeFinalCommand,
    resetTranscript: () => {
      setTranscript('');
      setInterimTranscript('');
    },
  };
}
