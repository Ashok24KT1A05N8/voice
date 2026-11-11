import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BackendGuideModal } from './components/BackendGuideModal';
import { DashboardPage } from './pages/DashboardPage';
import { VoiceAssistantPage } from './pages/VoiceAssistantPage';
import { NotesManagerPage } from './pages/NotesManagerPage';
import { CommandHistoryPage } from './pages/CommandHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { DatabaseStudioPage } from './pages/DatabaseStudioPage';
import { CustomTriggersPage } from './pages/CustomTriggersPage';

import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { soundEffects } from './services/soundEffects';
import { assistantApi } from './services/api';
import {
  ActivePage,
  CommandResponseData,
  CommandHistoryItem,
  NoteItem,
  DashboardStats,
  VoiceSettings,
  CustomTriggerItem,
} from './types/assistant';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isJavaConnected, setIsJavaConnected] = useState(false);

  // Assistant & Data State (backed by MongoDB)
  const [lastResponse, setLastResponse] = useState<CommandResponseData | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [triggers, setTriggers] = useState<CustomTriggerItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCommands: 0,
    successCommands: 0,
    failedCommands: 0,
    unknownCommands: 0,
    successRate: 100,
    totalNotes: 0,
    totalTriggers: 0,
    databaseMode: 'MongoDB Store',
  });

  // User Voice & Audio Settings
  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'en-US',
    voiceName: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voiceResponsesEnabled: true,
    soundEffectsEnabled: true,
    continuousListening: false,
    wakeWordEnabled: true,
    wakeWord: 'Commander',
  });

  // Speech Synthesis Hook
  const { voices, isSpeaking, speak, cancel: cancelSpeech } = useSpeechSynthesis({
    voiceName: settings.voiceName,
    rate: settings.rate,
    pitch: settings.pitch,
    volume: settings.volume,
    language: settings.language,
  });

  // Sound effects sync
  useEffect(() => {
    soundEffects.setEnabled(settings.soundEffectsEnabled);
  }, [settings.soundEffectsEnabled]);

  // Command Execution Pipeline (Voice & Text)
  const executeCommand = useCallback(
    async (cmdText: string, source: 'voice' | 'text' = 'voice') => {
      if (!cmdText.trim() || isProcessing) return;

      setIsProcessing(true);
      try {
        const responseData = await assistantApi.processCommand(cmdText, source, settings.language);
        setLastResponse(responseData);

        // Sound feedback
        if (responseData.status === 'SUCCESS') {
          soundEffects.playSuccess();
        } else {
          soundEffects.playError();
        }

        // Spoken audio feedback
        if (settings.voiceResponsesEnabled && responseData.response) {
          speak(responseData.response, {
            voiceName: settings.voiceName,
            rate: settings.rate,
            pitch: settings.pitch,
            volume: settings.volume,
            language: settings.language,
          });
        }

        // Action side-effects
        if (responseData.action === 'OPEN_URL' && responseData.targetUrl) {
          try {
            window.open(responseData.targetUrl, '_blank', 'noopener,noreferrer');
          } catch {
            // Popup may be blocked by iframe; user has the launch button on screen
          }
        } else if (responseData.action === 'NAVIGATE_APP' && responseData.navigationTarget) {
          const target = responseData.navigationTarget.toLowerCase();
          if (['dashboard', 'assistant', 'notes', 'triggers', 'history', 'database', 'settings'].includes(target)) {
            setActivePage(target as ActivePage);
          }
        } else if (responseData.action === 'ADD_NOTE') {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#8B5CF6', '#3B82F6', '#10B981'],
          });
          loadNotes();
        } else if (responseData.action === 'DELETE_NOTE') {
          loadNotes();
        }

        // Refresh stats, history & triggers
        loadHistory();
        loadStats();
        loadTriggers();
      } catch (err: any) {
        console.error('Command processing error:', err);
        soundEffects.playError();
        const fallbackResponse: CommandResponseData = {
          command: cmdText,
          recognizedText: cmdText,
          action: 'UNKNOWN',
          category: 'UNKNOWN',
          status: 'FAILED',
          response: 'Could not connect to MongoDB command processor. Please ensure the server is active.',
          timestamp: new Date().toISOString(),
        };
        setLastResponse(fallbackResponse);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, settings, speak]
  );

  // Speech Recognition Hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    audioLevel,
    startListening,
    stopListening,
    toggleListening,
  } = useSpeechRecognition({
    language: settings.language,
    onCommand: (finalText) => {
      executeCommand(finalText, 'voice');
    },
  });

  // Load initial data from MongoDB backend
  const loadNotes = useCallback(async () => {
    try {
      const data = await assistantApi.getNotes();
      setNotes(data);
    } catch (err) {
      console.warn('Could not load notes from MongoDB:', err);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await assistantApi.getHistory();
      setHistory(data);
    } catch (err) {
      console.warn('Could not load history from MongoDB:', err);
    }
  }, []);

  const loadTriggers = useCallback(async () => {
    try {
      const data = await assistantApi.getTriggers();
      setTriggers(data);
    } catch (err) {
      console.warn('Could not load triggers from MongoDB:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await assistantApi.getStats();
      setStats(data);
    } catch (err) {
      console.warn('Could not load stats from MongoDB:', err);
    }
  }, []);

  const checkBackendHealth = useCallback(async () => {
    try {
      const health = await assistantApi.checkHealth();
      setIsJavaConnected(!!health.isMongoConnected);
    } catch {
      setIsJavaConnected(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
    loadHistory();
    loadTriggers();
    loadStats();
    checkBackendHealth();

    const interval = setInterval(() => {
      loadStats();
      checkBackendHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadNotes, loadHistory, loadTriggers, loadStats, checkBackendHealth]);

  // Notes CRUD Handlers (MongoDB persisted)
  const handleCreateNote = async (newNote: Partial<NoteItem>) => {
    try {
      await assistantApi.createNote(newNote);
      await loadNotes();
      await loadStats();
      soundEffects.playSuccess();
    } catch (err) {
      console.error(err);
      soundEffects.playError();
    }
  };

  const handleUpdateNote = async (id: string | number, updated: Partial<NoteItem>) => {
    try {
      await assistantApi.updateNote(id, updated);
      await loadNotes();
      soundEffects.playSuccess();
    } catch (err) {
      console.error(err);
      soundEffects.playError();
    }
  };

  const handleDeleteNote = async (id: string | number) => {
    try {
      await assistantApi.deleteNote(id);
      await loadNotes();
      await loadStats();
      soundEffects.playSuccess();
    } catch (err) {
      console.error(err);
      soundEffects.playError();
    }
  };

  const handleClearAllNotes = async () => {
    try {
      await assistantApi.clearAllNotes();
      await loadNotes();
      await loadStats();
      soundEffects.playSuccess();
    } catch (err) {
      console.error(err);
      soundEffects.playError();
    }
  };

  const handleClearHistory = async () => {
    try {
      await assistantApi.clearHistory();
      await loadHistory();
      await loadStats();
      soundEffects.playSuccess();
    } catch (err) {
      console.error(err);
      soundEffects.playError();
    }
  };

  const handleReplaySpeech = (text: string) => {
    speak(text, {
      voiceName: settings.voiceName,
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
      language: settings.language,
    });
  };

  const handleTestVoice = () => {
    speak('Greetings, Commander. Voice Commander audio synthesis and MongoDB database are fully operational.', {
      voiceName: settings.voiceName,
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
      language: settings.language,
    });
  };

  return (
    <div className="flex h-screen bg-[#080B14] text-slate-100 antialiased overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
        onOpenDocs={() => setIsDocsOpen(true)}
        notesCount={notes.length}
        commandsCount={history.length}
        triggersCount={triggers.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <Navbar
          activePage={activePage}
          onPageChange={setActivePage}
          isListening={isListening}
          onToggleListening={toggleListening}
          onOpenDocs={() => setIsDocsOpen(true)}
          isJavaConnected={isJavaConnected}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          {activePage === 'dashboard' && (
            <DashboardPage
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              audioLevel={audioLevel}
              speechError={speechError}
              onToggleListening={toggleListening}
              onStartListening={startListening}
              onStopListening={stopListening}
              transcript={transcript}
              interimTranscript={interimTranscript}
              lastResponse={lastResponse}
              onExecuteCommand={(cmd) => executeCommand(cmd, 'voice')}
              onReplaySpeech={handleReplaySpeech}
              onNavigate={setActivePage}
              stats={stats}
              recentCommands={history}
              recentNotes={notes}
              isJavaConnected={isJavaConnected}
              selectedLanguage={settings.language}
            />
          )}

          {activePage === 'assistant' && (
            <VoiceAssistantPage
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              audioLevel={audioLevel}
              onToggleListening={toggleListening}
              onStartListening={startListening}
              onStopListening={stopListening}
              transcript={transcript}
              interimTranscript={interimTranscript}
              speechError={speechError}
              lastResponse={lastResponse}
              onExecuteCommand={(cmd) => executeCommand(cmd, 'voice')}
              onReplaySpeech={handleReplaySpeech}
              onNavigate={setActivePage}
              selectedLanguage={settings.language}
              onSelectLanguage={(lang) => setSettings((s) => ({ ...s, language: lang }))}
            />
          )}

          {activePage === 'notes' && (
            <NotesManagerPage
              notes={notes}
              onCreateNote={handleCreateNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onClearAllNotes={handleClearAllNotes}
              onStartVoiceNote={() => {
                setActivePage('assistant');
                startListening();
              }}
            />
          )}

          {activePage === 'triggers' && (
            <CustomTriggersPage
              onExecuteCommand={(cmd) => executeCommand(cmd, 'voice')}
            />
          )}

          {activePage === 'history' && (
            <CommandHistoryPage
              history={history}
              onClearHistory={handleClearHistory}
              onExecuteCommand={(cmd) => executeCommand(cmd, 'text')}
            />
          )}

          {activePage === 'database' && (
            <DatabaseStudioPage />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
              availableVoices={voices}
              onTestVoice={handleTestVoice}
              isJavaConnected={isJavaConnected}
              onRefreshHealth={checkBackendHealth}
              onOpenDocs={() => setIsDocsOpen(true)}
              onNavigateToDatabase={() => setActivePage('database')}
            />
          )}
        </main>
      </div>

      {/* Backend & Architecture Guide Modal */}
      <BackendGuideModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}
