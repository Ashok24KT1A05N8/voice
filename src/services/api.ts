import {
  CommandResponseData,
  NoteItem,
  CommandHistoryItem,
  DashboardStats,
  CustomTriggerItem,
  VoiceSettings,
  MongoDbStatus,
} from '../types/assistant';

const API_BASE = '/api';

export const assistantApi = {
  // Check live MongoDB backend status
  async checkHealth(): Promise<{
    status: string;
    backend: string;
    isMongoConnected: boolean;
    mode: string;
    dbName: string;
    mongoStatus?: MongoDbStatus;
  }> {
    try {
      const res = await fetch(`${API_BASE}/database/status`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const mongoStatus: MongoDbStatus = await res.json();
        return {
          status: 'UP',
          backend: mongoStatus.connected ? `MongoDB (${mongoStatus.modeLabel})` : 'Embedded MongoDB Store',
          isMongoConnected: mongoStatus.connected,
          mode: mongoStatus.mode,
          dbName: mongoStatus.dbName,
          mongoStatus,
        };
      }
    } catch (err) {
      console.warn('API health check error:', err);
    }

    return {
      status: 'UP',
      backend: 'Embedded MongoDB Engine',
      isMongoConnected: false,
      mode: 'embedded_mongo',
      dbName: 'voice_commander',
    };
  },

  // Main Command Processing Pipeline (persisted directly to MongoDB)
  async processCommand(
    command: string,
    source: 'voice' | 'text' = 'voice',
    language: string = 'en-US'
  ): Promise<CommandResponseData> {
    const rawInput = command.trim();
    const res = await fetch(`${API_BASE}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ command: rawInput, source, language }),
    });

    if (!res.ok) {
      throw new Error(`Command processing failed with status ${res.status}`);
    }

    return await res.json();
  },

  // Notes Operations (stored in MongoDB 'notes' collection)
  async getNotes(search?: string): Promise<NoteItem[]> {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    const url = `${API_BASE}/notes${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch notes from MongoDB');
    return await res.json();
  },

  async createNote(note: Partial<NoteItem>): Promise<NoteItem> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!res.ok) throw new Error('Failed to create note in MongoDB');
    return await res.json();
  },

  async updateNote(id: string | number, updated: Partial<NoteItem>): Promise<NoteItem> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error('Failed to update note in MongoDB');
    return await res.json();
  },

  async deleteNote(id: string | number): Promise<{ success: boolean; id: string | number }> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete note from MongoDB');
    return { success: true, id };
  },

  async clearAllNotes(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notes?confirm=true`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear notes in MongoDB');
    return await res.json();
  },

  // Command History Operations (stored in MongoDB 'commands' collection)
  async getHistory(limit = 100, search?: string): Promise<CommandHistoryItem[]> {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (search) params.set('search', search);

    const res = await fetch(`${API_BASE}/history?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch history from MongoDB');
    return await res.json();
  },

  async clearHistory(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear command history in MongoDB');
    return await res.json();
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/history/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats from MongoDB');
    return await res.json();
  },

  // Custom Triggers Operations (stored in MongoDB 'custom_triggers' collection)
  async getTriggers(): Promise<CustomTriggerItem[]> {
    const res = await fetch(`${API_BASE}/triggers`);
    if (!res.ok) throw new Error('Failed to fetch triggers from MongoDB');
    return await res.json();
  },

  async createTrigger(trigger: Partial<CustomTriggerItem>): Promise<CustomTriggerItem> {
    const res = await fetch(`${API_BASE}/triggers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trigger),
    });
    if (!res.ok) throw new Error('Failed to create trigger in MongoDB');
    return await res.json();
  },

  async updateTrigger(id: string | number, updated: Partial<CustomTriggerItem>): Promise<CustomTriggerItem> {
    const res = await fetch(`${API_BASE}/triggers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error('Failed to update trigger in MongoDB');
    return await res.json();
  },

  async deleteTrigger(id: string | number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/triggers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete trigger from MongoDB');
    return await res.json();
  },

  // User Settings Operations (stored in MongoDB 'user_settings' collection)
  async getSettings(): Promise<VoiceSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to load settings from MongoDB');
    return await res.json();
  },

  async saveSettings(settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings in MongoDB');
    return await res.json();
  },

  // MongoDB Database Management & Studio
  async getDatabaseStatus(): Promise<MongoDbStatus> {
    const res = await fetch(`${API_BASE}/database/status`);
    if (!res.ok) throw new Error('Failed to fetch MongoDB status');
    return await res.json();
  },

  async testMongoConnection(uri: string, dbName?: string): Promise<{ success: boolean; latencyMs?: number; message: string; collections?: string[] }> {
    const res = await fetch(`${API_BASE}/database/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, dbName }),
    });
    return await res.json();
  },

  async connectMongo(uri: string, dbName?: string): Promise<{ success: boolean; message: string; status: MongoDbStatus }> {
    const res = await fetch(`${API_BASE}/database/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, dbName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to connect to MongoDB');
    }
    return data;
  },

  async disconnectMongo(): Promise<{ success: boolean; message: string; status: MongoDbStatus }> {
    const res = await fetch(`${API_BASE}/database/disconnect`, {
      method: 'POST',
    });
    return await res.json();
  },

  async getCollectionDocuments(collectionName: string, page = 1, limit = 20, search = ''): Promise<{ documents: any[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);

    const res = await fetch(`${API_BASE}/database/collections/${collectionName}?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to load documents from MongoDB collection "${collectionName}"`);
    return await res.json();
  },

  async insertRawDocument(collectionName: string, doc: any): Promise<any> {
    const res = await fetch(`${API_BASE}/database/collections/${collectionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    if (!res.ok) throw new Error(`Failed to insert document into ${collectionName}`);
    return await res.json();
  },

  async deleteRawDocument(collectionName: string, id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/database/collections/${collectionName}/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async seedDatabase(): Promise<{ success: boolean; message: string; status: MongoDbStatus }> {
    const res = await fetch(`${API_BASE}/database/seed`, {
      method: 'POST',
    });
    return await res.json();
  },

  exportDatabaseUrl(): string {
    return `${API_BASE}/database/export`;
  },
};
