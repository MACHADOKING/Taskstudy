import { useEffect, useCallback, useState } from 'react';
import { useTranslation } from './useTranslation';

interface VoiceCommandConfig {
  command: string;
  action: () => void;
  description: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useVoiceCommands = (commands: VoiceCommandConfig[]) => {
  const { t, language } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'pt-BR' ? 'pt-BR' : 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, [language]);

  const processCommand = useCallback((transcript: string) => {
    const normalizedTranscript = transcript.toLowerCase().trim();
    
    // Find matching command
    const matchedCommand = commands.find(cmd => 
      normalizedTranscript.includes(cmd.command.toLowerCase())
    );

    if (matchedCommand) {
      matchedCommand.action();
      speak(t('voiceCommandExecuted'));
    } else {
      speak(t('voiceCommandNotRecognized'));
    }
  }, [commands, t, speak]);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'pt-BR' ? 'pt-BR' : 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      processCommand(transcript);
    };

    recognition.onerror = (event: Event) => {
      console.error('Speech recognition error:', event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
    speak(t('voiceListeningStarted'));
  }, [isSupported, language, processCommand, speak, t]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    speak(t('voiceListeningStopped'));
  }, [speak, t]);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    speak
  };
};