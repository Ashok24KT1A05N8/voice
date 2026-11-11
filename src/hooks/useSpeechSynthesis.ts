import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisOptions {
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, overrideOptions?: Partial<UseSpeechSynthesisOptions>) => {
      if (!isSupported || typeof window === 'undefined' || !text.trim()) return;

      const opts = { ...optionsRef.current, ...overrideOptions };
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = opts.rate ?? 1.0;
      utterance.pitch = opts.pitch ?? 1.0;
      utterance.volume = opts.volume ?? 1.0;

      if (opts.language) {
        utterance.lang = opts.language;
      }

      // Try selecting preferred voice
      if (opts.voiceName && voices.length > 0) {
        const match = voices.find(v => v.name === opts.voiceName);
        if (match) utterance.voice = match;
      } else if (voices.length > 0) {
        // Find best match for language
        const langCode = (opts.language || 'en').split('-')[0];
        const langMatch = voices.find(v => v.lang.startsWith(langCode));
        if (langMatch) utterance.voice = langMatch;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voices]
  );

  return {
    voices,
    isSpeaking,
    isSupported,
    speak,
    cancel,
  };
}
