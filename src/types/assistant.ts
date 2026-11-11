export type CommandCategory = 'GENERAL' | 'WEB' | 'SYSTEM' | 'NOTES' | 'NAVIGATION' | 'AI' | 'CUSTOM' | 'UNKNOWN';
export type CommandStatus = 'SUCCESS' | 'FAILED' | 'UNKNOWN';

export interface CommandResponseData {
  id?: string | number;
  command: string;
  recognizedText: string;
  action: 'OPEN_URL' | 'SHOW_TIME' | 'SHOW_DATE' | 'ADD_NOTE' | 'DELETE_NOTE' | 'CLEAR_NOTES_PROMPT' | 'NAVIGATE_APP' | 'SPEAK' | 'CUSTOM_TRIGGER' | 'UNKNOWN';
  category: CommandCategory;
  status: CommandStatus;
  response: string;
  targetUrl?: string;
  navigationTarget?: string;
  data?: Record<string, any>;
  timestamp: string;
  executionTimeMs?: number;
}

export interface NoteItem {
  id: string | number;
  _id?: string;
  title: string;
  content: string;
  category: string;
  color: string;
  pinned: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommandHistoryItem {
  id: string | number;
  _id?: string;
  command: string;
  response: string;
  status: CommandStatus;
  category: CommandCategory;
  source: 'voice' | 'text';
  timestamp: string;
  action?: string;
  targetUrl?: string;
  executionTimeMs?: number;
}

export interface CustomTriggerItem {
  id: string | number;
  _id?: string;
  triggerPhrase: string;
  actionType: 'OPEN_URL' | 'SPEAK' | 'ADD_NOTE' | 'SYSTEM_ALERT';
  actionValue: string;
  response: string;
  category: string;
  enabled: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalCommands: number;
  successCommands: number;
  failedCommands: number;
  unknownCommands: number;
  successRate: number;
  totalNotes: number;
  totalTriggers?: number;
  databaseMode?: string;
}

export interface VoiceSettings {
  language: string; // 'en-US' | 'en-IN' | 'te-IN' | 'hi-IN'
  voiceName: string;
  rate: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 1.5
  volume: number; // 0 to 1
  voiceResponsesEnabled: boolean;
  soundEffectsEnabled: boolean;
  continuousListening: boolean;
  wakeWordEnabled?: boolean;
  wakeWord?: string;
}

export interface MongoDbStatus {
  connected: boolean;
  mode: 'atlas' | 'local_mongo' | 'embedded_mongo';
  modeLabel: string;
  dbName: string;
  uriMasked: string;
  pingMs: number | null;
  error?: string | null;
  collections: {
    commands: number;
    notes: number;
    custom_triggers: number;
    user_settings: number;
  };
  totalDocuments: number;
  storageSizeEstimate: string;
  lastChecked: string;
}

export type ActivePage = 'dashboard' | 'assistant' | 'notes' | 'history' | 'triggers' | 'database' | 'settings';

