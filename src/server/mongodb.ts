import { MongoClient, Db, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { 
  CommandHistoryItem, 
  NoteItem, 
  CustomTriggerItem, 
  VoiceSettings, 
  MongoDbStatus, 
  DashboardStats 
} from '../types/assistant';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'mongodb_store.json');

// Initial seed data for MongoDB collections
const INITIAL_NOTES: NoteItem[] = [
  {
    id: 1,
    title: 'MongoDB Integration Active',
    content: 'Voice Commander is now backed by a full MongoDB database engine for voice logs, custom voice triggers, and notes.',
    category: 'System',
    color: '#10B981',
    pinned: true,
    tags: ['mongodb', 'system', 'database'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    title: 'Voice Commands & Automations',
    content: 'Speak "Open YouTube", "Add note meeting tomorrow", or create custom triggers stored in the database.',
    category: 'Guides',
    color: '#8B5CF6',
    pinned: true,
    tags: ['voice', 'productivity'],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    title: 'Project Roadmap Checklist',
    content: '1. Test MongoDB Atlas cluster URI.\n2. Add custom wake trigger.\n3. Export command logs for analytics.',
    category: 'Work',
    color: '#3B82F6',
    pinned: false,
    tags: ['roadmap', 'todo'],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

const INITIAL_TRIGGERS: CustomTriggerItem[] = [
  {
    id: 1,
    triggerPhrase: 'open my workspace',
    actionType: 'OPEN_URL',
    actionValue: 'https://github.com',
    response: 'Opening your developer workspace on GitHub.',
    category: 'Productivity',
    enabled: true,
    executionCount: 5,
    lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    triggerPhrase: 'launch music',
    actionType: 'OPEN_URL',
    actionValue: 'https://music.youtube.com',
    response: 'Playing relaxing focus beats on YouTube Music.',
    category: 'Media',
    enabled: true,
    executionCount: 12,
    lastExecutedAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    triggerPhrase: 'system status check',
    actionType: 'SPEAK',
    actionValue: 'MongoDB database is healthy, microphone active, all voice synthesis systems fully operational.',
    response: 'MongoDB database is healthy, microphone active, all voice synthesis systems fully operational.',
    category: 'System',
    enabled: true,
    executionCount: 8,
    lastExecutedAt: new Date(Date.now() - 900000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const INITIAL_COMMANDS: CommandHistoryItem[] = [
  {
    id: 1,
    command: 'what is the time',
    response: `The current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    status: 'SUCCESS',
    category: 'SYSTEM',
    source: 'voice',
    action: 'SHOW_TIME',
    executionTimeMs: 42,
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 2,
    command: 'open github',
    response: 'Opening GitHub.',
    status: 'SUCCESS',
    category: 'WEB',
    source: 'voice',
    action: 'OPEN_URL',
    targetUrl: 'https://github.com',
    executionTimeMs: 38,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 3,
    command: 'who are you',
    response: 'I am Voice Commander, your AI-powered smart voice assistant backed by MongoDB.',
    status: 'SUCCESS',
    category: 'GENERAL',
    source: 'text',
    action: 'SPEAK',
    executionTimeMs: 65,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

const DEFAULT_SETTINGS: VoiceSettings = {
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
};

interface LocalStoreData {
  commands: CommandHistoryItem[];
  notes: NoteItem[];
  custom_triggers: CustomTriggerItem[];
  user_settings: VoiceSettings;
  meta: {
    dbName: string;
    version: string;
    createdAt: string;
    updatedAt: string;
  };
}

class MongoService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;
  private uri: string = '';
  private dbName: string = 'voice_commander';
  private connectionError: string | null = null;
  private pingMs: number | null = null;
  private localStore: LocalStoreData;

  constructor() {
    this.ensureDataDir();
    this.localStore = this.loadLocalStore();
    this.uri = process.env.MONGODB_URI || '';
    this.dbName = process.env.MONGODB_DB_NAME || 'voice_commander';

    // Auto-attempt connection if MONGODB_URI is provided in environment
    if (this.uri && !this.uri.includes('username:password')) {
      this.initMongoConnection(this.uri, this.dbName).catch(err => {
        console.warn('Initial MongoDB connection warning (falling back to embedded MongoDB):', err.message);
      });
    }
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data dir:', err);
      }
    }
  }

  private loadLocalStore(): LocalStoreData {
    try {
      if (fs.existsSync(LOCAL_DB_FILE)) {
        const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.commands && parsed.notes && parsed.custom_triggers) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing local db store, initializing fresh store:', e);
    }

    const freshStore: LocalStoreData = {
      commands: [...INITIAL_COMMANDS],
      notes: [...INITIAL_NOTES],
      custom_triggers: [...INITIAL_TRIGGERS],
      user_settings: { ...DEFAULT_SETTINGS },
      meta: {
        dbName: 'voice_commander_embedded',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    this.saveLocalStore(freshStore);
    return freshStore;
  }

  private saveLocalStore(data?: LocalStoreData) {
    try {
      const storeToSave = data || this.localStore;
      storeToSave.meta.updatedAt = new Date().toISOString();
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(storeToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save local MongoDB store file:', e);
    }
  }

  public async initMongoConnection(uri: string, dbName: string = 'voice_commander'): Promise<boolean> {
    try {
      if (this.client) {
        try {
          await this.client.close();
        } catch {}
      }

      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
      });

      const start = Date.now();
      await client.connect();
      const testDb = client.db(dbName);
      await testDb.command({ ping: 1 });
      const latency = Date.now() - start;

      this.client = client;
      this.db = testDb;
      this.isConnected = true;
      this.uri = uri;
      this.dbName = dbName;
      this.connectionError = null;
      this.pingMs = latency;

      console.log(`Successfully connected to MongoDB [${dbName}] in ${latency}ms`);

      // Ensure indexes on collections
      await this.db.collection('commands').createIndex({ timestamp: -1 });
      await this.db.collection('commands').createIndex({ category: 1 });
      await this.db.collection('notes').createIndex({ pinned: -1, updatedAt: -1 });
      await this.db.collection('custom_triggers').createIndex({ triggerPhrase: 1 });

      // If remote collections are completely empty, seed them from initial store
      const cmdCount = await this.db.collection('commands').countDocuments();
      if (cmdCount === 0) {
        if (this.localStore.commands.length > 0) {
          await this.db.collection('commands').insertMany(this.localStore.commands as any);
        }
        if (this.localStore.notes.length > 0) {
          await this.db.collection('notes').insertMany(this.localStore.notes as any);
        }
        if (this.localStore.custom_triggers.length > 0) {
          await this.db.collection('custom_triggers').insertMany(this.localStore.custom_triggers as any);
        }
        await this.db.collection('user_settings').insertOne({ ...this.localStore.user_settings, _id: 'default_settings' as any });
      }

      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.connectionError = err.message || 'Connection failed';
      this.pingMs = null;
      throw err;
    }
  }

  public async testConnection(uri: string, dbName: string = 'voice_commander'): Promise<{ success: boolean; latencyMs?: number; message: string; collections?: string[] }> {
    try {
      const testClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      const start = Date.now();
      await testClient.connect();
      const testDb = testClient.db(dbName);
      await testDb.command({ ping: 1 });
      const latency = Date.now() - start;
      const collections = await testDb.listCollections().toArray();
      await testClient.close();
      return {
        success: true,
        latencyMs: latency,
        message: `Successfully connected to MongoDB cluster in ${latency}ms!`,
        collections: collections.map(c => c.name),
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Could not connect to MongoDB server',
      };
    }
  }

  public async disconnectMongo(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
    this.isConnected = false;
    this.uri = '';
    this.pingMs = null;
    this.connectionError = null;
  }

  private maskUri(uri: string): string {
    if (!uri) return '';
    try {
      return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:••••••••@');
    } catch {
      return 'mongodb://••••••••';
    }
  }

  public async getStatus(): Promise<MongoDbStatus> {
    const isAtlas = this.uri.includes('mongodb+srv://');
    const isLocal = this.uri.startsWith('mongodb://');
    let mode: 'atlas' | 'local_mongo' | 'embedded_mongo' = 'embedded_mongo';
    let modeLabel = 'Embedded Document DB (MongoDB-Compatible)';

    if (this.isConnected) {
      if (isAtlas) {
        mode = 'atlas';
        modeLabel = 'MongoDB Atlas Cloud';
      } else {
        mode = 'local_mongo';
        modeLabel = 'Local / Dedicated MongoDB';
      }
    }

    let commandCount = this.localStore.commands.length;
    let noteCount = this.localStore.notes.length;
    let triggerCount = this.localStore.custom_triggers.length;
    let settingsCount = 1;

    if (this.isConnected && this.db) {
      try {
        commandCount = await this.db.collection('commands').countDocuments();
        noteCount = await this.db.collection('notes').countDocuments();
        triggerCount = await this.db.collection('custom_triggers').countDocuments();
        settingsCount = await this.db.collection('user_settings').countDocuments();
      } catch (err) {
        console.warn('Error fetching counts from remote MongoDB:', err);
      }
    }

    const totalDocs = commandCount + noteCount + triggerCount + settingsCount;
    const estSize = `${Math.max(12, Math.round(totalDocs * 0.85 + 4))} KB`;

    return {
      connected: this.isConnected,
      mode,
      modeLabel,
      dbName: this.dbName,
      uriMasked: this.maskUri(this.uri),
      pingMs: this.pingMs,
      error: this.connectionError,
      collections: {
        commands: commandCount,
        notes: noteCount,
        custom_triggers: triggerCount,
        user_settings: settingsCount,
      },
      totalDocuments: totalDocs,
      storageSizeEstimate: estSize,
      lastChecked: new Date().toISOString(),
    };
  }

  // --- COMMANDS COLLECTION ---
  public async getCommands(limit = 100, search = ''): Promise<CommandHistoryItem[]> {
    if (this.isConnected && this.db) {
      const query: any = {};
      if (search) {
        query.$or = [
          { command: { $regex: search, $options: 'i' } },
          { response: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ];
      }
      const docs = await this.db
        .collection('commands')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return docs.map((d: any) => ({
        id: d._id ? d._id.toString() : d.id,
        _id: d._id ? d._id.toString() : undefined,
        command: d.command,
        response: d.response,
        status: d.status,
        category: d.category,
        source: d.source || 'voice',
        timestamp: d.timestamp,
        action: d.action,
        targetUrl: d.targetUrl,
        executionTimeMs: d.executionTimeMs,
      }));
    }

    let items = [...this.localStore.commands];
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        i =>
          i.command.toLowerCase().includes(s) ||
          i.response.toLowerCase().includes(s) ||
          i.category.toLowerCase().includes(s)
      );
    }
    return items.slice(0, limit);
  }

  public async saveCommand(cmd: Partial<CommandHistoryItem>): Promise<CommandHistoryItem> {
    const newCmd: CommandHistoryItem = {
      id: Date.now(),
      command: cmd.command || '',
      response: cmd.response || '',
      status: cmd.status || 'SUCCESS',
      category: cmd.category || 'GENERAL',
      source: cmd.source || 'voice',
      timestamp: cmd.timestamp || new Date().toISOString(),
      action: cmd.action,
      targetUrl: cmd.targetUrl,
      executionTimeMs: cmd.executionTimeMs || 25,
    };

    if (this.isConnected && this.db) {
      const res = await this.db.collection('commands').insertOne(newCmd as any);
      newCmd._id = res.insertedId.toString();
      newCmd.id = res.insertedId.toString();
    }

    this.localStore.commands.unshift(newCmd);
    if (this.localStore.commands.length > 500) {
      this.localStore.commands.pop();
    }
    this.saveLocalStore();
    return newCmd;
  }

  public async clearCommands(): Promise<boolean> {
    if (this.isConnected && this.db) {
      await this.db.collection('commands').deleteMany({});
    }
    this.localStore.commands = [];
    this.saveLocalStore();
    return true;
  }

  public async getStats(): Promise<DashboardStats> {
    let commands: CommandHistoryItem[] = [];
    let noteCount = 0;
    let triggerCount = 0;

    if (this.isConnected && this.db) {
      commands = (await this.db.collection('commands').find({}).toArray()) as any;
      noteCount = await this.db.collection('notes').countDocuments();
      triggerCount = await this.db.collection('custom_triggers').countDocuments();
    } else {
      commands = this.localStore.commands;
      noteCount = this.localStore.notes.length;
      triggerCount = this.localStore.custom_triggers.length;
    }

    const total = commands.length;
    const success = commands.filter(c => c.status === 'SUCCESS').length;
    const failed = commands.filter(c => c.status === 'FAILED').length;
    const unknown = commands.filter(c => c.status === 'UNKNOWN').length;
    const successRate = total > 0 ? Math.round((success / total) * 1000) / 10 : 100;

    return {
      totalCommands: total,
      successCommands: success,
      failedCommands: failed,
      unknownCommands: unknown,
      successRate,
      totalNotes: noteCount,
      totalTriggers: triggerCount,
      databaseMode: this.isConnected ? 'MongoDB Active' : 'Embedded MongoDB',
    };
  }

  // --- NOTES COLLECTION ---
  public async getNotes(search = ''): Promise<NoteItem[]> {
    if (this.isConnected && this.db) {
      const query: any = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ];
      }
      const docs = await this.db
        .collection('notes')
        .find(query)
        .sort({ pinned: -1, updatedAt: -1 })
        .toArray();

      return docs.map((d: any) => ({
        id: d._id ? d._id.toString() : d.id,
        _id: d._id ? d._id.toString() : undefined,
        title: d.title,
        content: d.content,
        category: d.category,
        color: d.color,
        pinned: !!d.pinned,
        tags: d.tags || [],
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));
    }

    let notes = [...this.localStore.notes];
    if (search) {
      const s = search.toLowerCase();
      notes = notes.filter(
        n =>
          n.title.toLowerCase().includes(s) ||
          n.content.toLowerCase().includes(s) ||
          n.category.toLowerCase().includes(s)
      );
    }
    return notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  public async createNote(noteData: Partial<NoteItem>): Promise<NoteItem> {
    const newNote: NoteItem = {
      id: Date.now(),
      title: noteData.title || 'Voice Note',
      content: noteData.content || '',
      category: noteData.category || 'General',
      color: noteData.color || '#8B5CF6',
      pinned: !!noteData.pinned,
      tags: noteData.tags || ['voice'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.isConnected && this.db) {
      const res = await this.db.collection('notes').insertOne(newNote as any);
      newNote._id = res.insertedId.toString();
      newNote.id = res.insertedId.toString();
    }

    this.localStore.notes.unshift(newNote);
    this.saveLocalStore();
    return newNote;
  }

  public async updateNote(id: string | number, update: Partial<NoteItem>): Promise<NoteItem | null> {
    const now = new Date().toISOString();

    if (this.isConnected && this.db) {
      let query: any = { id };
      if (typeof id === 'string' && ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      const updatedFields: any = { ...update, updatedAt: now };
      delete updatedFields._id;
      delete updatedFields.id;

      await this.db.collection('notes').updateOne(query, { $set: updatedFields });
      const doc = await this.db.collection('notes').findOne(query);
      if (doc) {
        return {
          id: doc._id ? doc._id.toString() : doc.id,
          _id: doc._id ? doc._id.toString() : undefined,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          color: doc.color,
          pinned: doc.pinned,
          tags: doc.tags || [],
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      }
    }

    const idx = this.localStore.notes.findIndex(n => String(n.id) === String(id) || (n._id && n._id === String(id)));
    if (idx !== -1) {
      this.localStore.notes[idx] = {
        ...this.localStore.notes[idx],
        ...update,
        updatedAt: now,
      };
      this.saveLocalStore();
      return this.localStore.notes[idx];
    }
    return null;
  }

  public async deleteNote(id: string | number): Promise<boolean> {
    if (this.isConnected && this.db) {
      let query: any = { id };
      if (typeof id === 'string' && ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      await this.db.collection('notes').deleteOne(query);
    }

    const initialLen = this.localStore.notes.length;
    this.localStore.notes = this.localStore.notes.filter(
      n => String(n.id) !== String(id) && n._id !== String(id)
    );
    this.saveLocalStore();
    return this.localStore.notes.length < initialLen;
  }

  public async clearNotes(): Promise<boolean> {
    if (this.isConnected && this.db) {
      await this.db.collection('notes').deleteMany({});
    }
    this.localStore.notes = [];
    this.saveLocalStore();
    return true;
  }

  // --- CUSTOM TRIGGERS COLLECTION ---
  public async getTriggers(): Promise<CustomTriggerItem[]> {
    if (this.isConnected && this.db) {
      const docs = await this.db.collection('custom_triggers').find({}).toArray();
      return docs.map((d: any) => ({
        id: d._id ? d._id.toString() : d.id,
        _id: d._id ? d._id.toString() : undefined,
        triggerPhrase: d.triggerPhrase,
        actionType: d.actionType,
        actionValue: d.actionValue,
        response: d.response,
        category: d.category || 'Custom',
        enabled: d.enabled !== false,
        executionCount: d.executionCount || 0,
        lastExecutedAt: d.lastExecutedAt,
        createdAt: d.createdAt,
      }));
    }
    return [...this.localStore.custom_triggers];
  }

  public async createTrigger(trigger: Partial<CustomTriggerItem>): Promise<CustomTriggerItem> {
    const newTrigger: CustomTriggerItem = {
      id: Date.now(),
      triggerPhrase: (trigger.triggerPhrase || '').trim().toLowerCase(),
      actionType: trigger.actionType || 'SPEAK',
      actionValue: trigger.actionValue || '',
      response: trigger.response || 'Custom command executed.',
      category: trigger.category || 'Custom',
      enabled: trigger.enabled !== false,
      executionCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (this.isConnected && this.db) {
      const res = await this.db.collection('custom_triggers').insertOne(newTrigger as any);
      newTrigger._id = res.insertedId.toString();
      newTrigger.id = res.insertedId.toString();
    }

    this.localStore.custom_triggers.unshift(newTrigger);
    this.saveLocalStore();
    return newTrigger;
  }

  public async updateTrigger(id: string | number, update: Partial<CustomTriggerItem>): Promise<CustomTriggerItem | null> {
    if (this.isConnected && this.db) {
      let query: any = { id };
      if (typeof id === 'string' && ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      const updatedFields: any = { ...update };
      delete updatedFields._id;
      delete updatedFields.id;

      await this.db.collection('custom_triggers').updateOne(query, { $set: updatedFields });
      const doc = await this.db.collection('custom_triggers').findOne(query);
      if (doc) {
        return {
          id: doc._id ? doc._id.toString() : doc.id,
          _id: doc._id ? doc._id.toString() : undefined,
          triggerPhrase: doc.triggerPhrase,
          actionType: doc.actionType,
          actionValue: doc.actionValue,
          response: doc.response,
          category: doc.category,
          enabled: doc.enabled,
          executionCount: doc.executionCount,
          lastExecutedAt: doc.lastExecutedAt,
          createdAt: doc.createdAt,
        };
      }
    }

    const idx = this.localStore.custom_triggers.findIndex(
      t => String(t.id) === String(id) || (t._id && t._id === String(id))
    );
    if (idx !== -1) {
      this.localStore.custom_triggers[idx] = {
        ...this.localStore.custom_triggers[idx],
        ...update,
      };
      this.saveLocalStore();
      return this.localStore.custom_triggers[idx];
    }
    return null;
  }

  public async deleteTrigger(id: string | number): Promise<boolean> {
    if (this.isConnected && this.db) {
      let query: any = { id };
      if (typeof id === 'string' && ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      await this.db.collection('custom_triggers').deleteOne(query);
    }

    const initialLen = this.localStore.custom_triggers.length;
    this.localStore.custom_triggers = this.localStore.custom_triggers.filter(
      t => String(t.id) !== String(id) && t._id !== String(id)
    );
    this.saveLocalStore();
    return this.localStore.custom_triggers.length < initialLen;
  }

  public async recordTriggerExecution(id: string | number): Promise<void> {
    const now = new Date().toISOString();
    if (this.isConnected && this.db) {
      let query: any = { id };
      if (typeof id === 'string' && ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      await this.db.collection('custom_triggers').updateOne(query, {
        $inc: { executionCount: 1 },
        $set: { lastExecutedAt: now },
      });
    }

    const trigger = this.localStore.custom_triggers.find(
      t => String(t.id) === String(id) || (t._id && t._id === String(id))
    );
    if (trigger) {
      trigger.executionCount = (trigger.executionCount || 0) + 1;
      trigger.lastExecutedAt = now;
      this.saveLocalStore();
    }
  }

  // --- USER SETTINGS COLLECTION ---
  public async getSettings(): Promise<VoiceSettings> {
    if (this.isConnected && this.db) {
      const doc = await this.db.collection('user_settings').findOne({});
      if (doc) {
        return {
          language: doc.language || 'en-US',
          voiceName: doc.voiceName || '',
          rate: doc.rate ?? 1.0,
          pitch: doc.pitch ?? 1.0,
          volume: doc.volume ?? 1.0,
          voiceResponsesEnabled: doc.voiceResponsesEnabled !== false,
          soundEffectsEnabled: doc.soundEffectsEnabled !== false,
          continuousListening: !!doc.continuousListening,
          wakeWordEnabled: doc.wakeWordEnabled !== false,
          wakeWord: doc.wakeWord || 'Commander',
        };
      }
    }
    return { ...this.localStore.user_settings };
  }

  public async saveSettings(settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
    this.localStore.user_settings = {
      ...this.localStore.user_settings,
      ...settings,
    };
    this.saveLocalStore();

    if (this.isConnected && this.db) {
      await this.db.collection('user_settings').updateOne(
        {},
        { $set: this.localStore.user_settings },
        { upsert: true }
      );
    }

    return this.localStore.user_settings;
  }

  // --- RAW DATABASE BROWSER / EXPLORER APIS ---
  public async getCollectionDocuments(collectionName: string, page = 1, limit = 20, search = ''): Promise<{ documents: any[]; total: number; page: number; limit: number }> {
    if (this.isConnected && this.db) {
      const query: any = {};
      if (search) {
        query.$or = [
          { command: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { triggerPhrase: { $regex: search, $options: 'i' } },
        ];
      }
      const skip = (page - 1) * limit;
      const total = await this.db.collection(collectionName).countDocuments(query);
      const docs = await this.db.collection(collectionName).find(query).skip(skip).limit(limit).toArray();
      return {
        documents: docs,
        total,
        page,
        limit,
      };
    }

    let arr: any[] = [];
    if (collectionName === 'commands') arr = this.localStore.commands;
    else if (collectionName === 'notes') arr = this.localStore.notes;
    else if (collectionName === 'custom_triggers') arr = this.localStore.custom_triggers;
    else if (collectionName === 'user_settings') arr = [this.localStore.user_settings];

    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(item => JSON.stringify(item).toLowerCase().includes(s));
    }

    const total = arr.length;
    const skip = (page - 1) * limit;
    const docs = arr.slice(skip, skip + limit);

    return {
      documents: docs,
      total,
      page,
      limit,
    };
  }

  public async insertRawDocument(collectionName: string, doc: any): Promise<any> {
    const cleanDoc = { ...doc };
    if (!cleanDoc.id && !cleanDoc._id) {
      cleanDoc.id = Date.now();
    }

    if (this.isConnected && this.db) {
      const res = await this.db.collection(collectionName).insertOne(cleanDoc);
      cleanDoc._id = res.insertedId;
      return cleanDoc;
    }

    if (collectionName === 'commands') this.localStore.commands.unshift(cleanDoc);
    else if (collectionName === 'notes') this.localStore.notes.unshift(cleanDoc);
    else if (collectionName === 'custom_triggers') this.localStore.custom_triggers.unshift(cleanDoc);
    this.saveLocalStore();
    return cleanDoc;
  }

  public async deleteRawDocument(collectionName: string, id: string): Promise<boolean> {
    if (this.isConnected && this.db) {
      let query: any = { id };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      await this.db.collection(collectionName).deleteOne(query);
    }

    if (collectionName === 'commands') {
      this.localStore.commands = this.localStore.commands.filter(c => String(c.id) !== id && c._id !== id);
    } else if (collectionName === 'notes') {
      this.localStore.notes = this.localStore.notes.filter(n => String(n.id) !== id && n._id !== id);
    } else if (collectionName === 'custom_triggers') {
      this.localStore.custom_triggers = this.localStore.custom_triggers.filter(t => String(t.id) !== id && t._id !== id);
    }
    this.saveLocalStore();
    return true;
  }

  public async seedDemoData(): Promise<void> {
    this.localStore = {
      commands: [...INITIAL_COMMANDS],
      notes: [...INITIAL_NOTES],
      custom_triggers: [...INITIAL_TRIGGERS],
      user_settings: { ...DEFAULT_SETTINGS },
      meta: {
        dbName: this.dbName,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    this.saveLocalStore();

    if (this.isConnected && this.db) {
      await this.db.collection('commands').deleteMany({});
      await this.db.collection('notes').deleteMany({});
      await this.db.collection('custom_triggers').deleteMany({});
      await this.db.collection('commands').insertMany(this.localStore.commands as any);
      await this.db.collection('notes').insertMany(this.localStore.notes as any);
      await this.db.collection('custom_triggers').insertMany(this.localStore.custom_triggers as any);
    }
  }

  public async exportAll(): Promise<LocalStoreData> {
    if (this.isConnected && this.db) {
      const commands = (await this.db.collection('commands').find({}).toArray()) as any;
      const notes = (await this.db.collection('notes').find({}).toArray()) as any;
      const triggers = (await this.db.collection('custom_triggers').find({}).toArray()) as any;
      const settings = (await this.db.collection('user_settings').findOne({})) as any;

      return {
        commands,
        notes,
        custom_triggers: triggers,
        user_settings: settings || this.localStore.user_settings,
        meta: {
          dbName: this.dbName,
          version: '1.0.0',
          createdAt: this.localStore.meta.createdAt,
          updatedAt: new Date().toISOString(),
        },
      };
    }
    return this.localStore;
  }
}

export const mongoService = new MongoService();
