import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { mongoService } from './src/server/mongodb.ts';
import type { 
  CommandResponseData, 
  CommandCategory, 
  CommandStatus 
} from './src/types/assistant.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google GenAI client if GEMINI_API_KEY is present
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

// Normalization helper
function normalizeText(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAny(text: string, ...phrases: string[]): boolean {
  return phrases.some(p => text.includes(p));
}

function extractNoteContent(rawInput: string): string {
  const match = rawInput.match(/^(?:add\s+note|take\s+a\s+note|create\s+note|new\s+note)(?:\s+that|\s+to|\s*:|\s+)(.*)$/i);
  return match && match[1] ? match[1].trim() : '';
}

// Smart Command Processor with MongoDB custom triggers & AI fallback
async function processCommand(
  rawCommand: string, 
  source: 'voice' | 'text' = 'voice', 
  _language: string = 'en-US'
): Promise<CommandResponseData> {
  const startTime = Date.now();
  const normalized = normalizeText(rawCommand);
  const now = new Date();

  // 1. Check Custom Triggers from MongoDB first!
  try {
    const customTriggers = await mongoService.getTriggers();
    const matchingTrigger = customTriggers.find(t => 
      t.enabled && (
        normalized === normalizeText(t.triggerPhrase) || 
        normalized.includes(normalizeText(t.triggerPhrase))
      )
    );

    if (matchingTrigger) {
      await mongoService.recordTriggerExecution(matchingTrigger.id);

      let action: CommandResponseData['action'] = 'SPEAK';
      let targetUrl: string | undefined;

      if (matchingTrigger.actionType === 'OPEN_URL') {
        action = 'OPEN_URL';
        targetUrl = matchingTrigger.actionValue;
      } else if (matchingTrigger.actionType === 'ADD_NOTE') {
        action = 'ADD_NOTE';
        await mongoService.createNote({
          title: `Trigger: ${matchingTrigger.triggerPhrase}`,
          content: matchingTrigger.actionValue,
          category: 'Automation',
          color: '#EC4899',
        });
      }

      return {
        command: rawCommand,
        recognizedText: rawCommand,
        action,
        category: 'CUSTOM' as CommandCategory,
        status: 'SUCCESS' as CommandStatus,
        response: matchingTrigger.response || `Custom automation triggered: ${matchingTrigger.triggerPhrase}`,
        targetUrl,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
      };
    }
  } catch (err) {
    console.error('Error checking custom triggers:', err);
  }

  // 2. Built-in Greetings & Help
  if (/^(hello|hi|hey|greetings|hola|namaste)/.test(normalized)) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'SPEAK',
      category: 'GENERAL',
      status: 'SUCCESS',
      response: 'Hello Commander! How can I assist you today?',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (normalized.includes('good morning')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'SPEAK',
      category: 'GENERAL',
      status: 'SUCCESS',
      response: "Good morning! All MongoDB services and voice systems are operational.",
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (normalized.includes('good afternoon')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'SPEAK',
      category: 'GENERAL',
      status: 'SUCCESS',
      response: 'Good afternoon Commander! Ready for command dispatch.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (normalized.includes('good evening')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'SPEAK',
      category: 'GENERAL',
      status: 'SUCCESS',
      response: 'Good evening Commander! I am here to help manage your notes and workflows.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (normalized.includes('who are you') || normalized.includes('what is your name')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'SPEAK',
      category: 'GENERAL',
      status: 'SUCCESS',
      response: 'I am Voice Commander, your AI-powered smart voice assistant backed by MongoDB database storage.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (normalized.includes('what can you do') || normalized === 'capabilities') {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'SPEAK',
      category: 'GENERAL',
      status: 'SUCCESS',
      response: 'I can launch web applications, store voice notes in MongoDB, track execution history, trigger custom automations, and answer complex questions using Gemini AI.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (normalized === 'help' || normalized.includes('show commands') || normalized.includes('what are the commands')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'SPEAK',
      category: 'GENERAL',
      status: 'SUCCESS',
      response: "Try speaking: 'Open YouTube', 'What is the time?', 'Add note submit project', 'Show database', 'Open settings', or custom triggers.",
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  // 3. Web Navigation Commands
  const webMappings: Array<{ phrases: string[]; url: string; name: string }> = [
    { phrases: ['open google', 'launch google', 'go to google'], url: 'https://www.google.com', name: 'Google' },
    { phrases: ['open youtube', 'launch youtube', 'go to youtube'], url: 'https://www.youtube.com', name: 'YouTube' },
    { phrases: ['open github', 'launch github', 'go to github'], url: 'https://github.com', name: 'GitHub' },
    { phrases: ['open gmail', 'launch gmail', 'go to gmail', 'check email'], url: 'https://mail.google.com', name: 'Gmail' },
    { phrases: ['open chatgpt', 'launch chatgpt'], url: 'https://chat.openai.com', name: 'ChatGPT' },
    { phrases: ['open wikipedia', 'launch wikipedia'], url: 'https://www.wikipedia.org', name: 'Wikipedia' },
    { phrases: ['open spotify', 'launch spotify'], url: 'https://open.spotify.com', name: 'Spotify' },
    { phrases: ['open reddit', 'launch reddit'], url: 'https://www.reddit.com', name: 'Reddit' },
    { phrases: ['open linkedin', 'launch linkedin'], url: 'https://www.linkedin.com', name: 'LinkedIn' },
    { phrases: ['open twitter', 'launch twitter', 'open x', 'launch x'], url: 'https://x.com', name: 'X' },
  ];

  for (const mapping of webMappings) {
    if (containsAny(normalized, ...mapping.phrases)) {
      return {
        command: rawCommand,
        recognizedText: rawCommand,
        action: 'OPEN_URL',
        category: 'WEB',
        status: 'SUCCESS',
        targetUrl: mapping.url,
        response: `Opening ${mapping.name}.`,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  // 4. System Time & Date
  if (containsAny(normalized, 'what is the time', 'what time is it', 'tell me the time', 'current time')) {
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'SHOW_TIME',
      category: 'SYSTEM',
      status: 'SUCCESS',
      response: `The current time is ${timeStr}`,
      data: { time: timeStr },
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (containsAny(normalized, "what is today's date", 'what is the date', 'what day is it', "today's date", 'current date')) {
    const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'SHOW_DATE',
      category: 'SYSTEM',
      status: 'SUCCESS',
      response: `Today's date is ${dateStr}`,
      data: { date: dateStr },
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  // 5. Notes Commands (Stored directly into MongoDB!)
  if (normalized.startsWith('add note') || normalized.startsWith('take a note') || normalized.startsWith('create note') || normalized.startsWith('new note')) {
    const noteContent = extractNoteContent(rawCommand);
    if (!noteContent) {
      return {
        command: rawCommand,
        recognizedText: rawCommand,
        action: 'SPEAK',
        category: 'NOTES',
        status: 'FAILED',
        response: 'Please specify what you would like to write in the note.',
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
      };
    }

    const newNote = await mongoService.createNote({
      title: 'Voice Note',
      content: noteContent,
      category: 'Voice',
      color: '#8B5CF6',
      pinned: false,
      tags: ['voice', 'transcription'],
    });

    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'ADD_NOTE',
      category: 'NOTES',
      status: 'SUCCESS',
      response: `Note stored in MongoDB: "${noteContent}"`,
      data: { note: newNote },
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (containsAny(normalized, 'show my notes', 'show notes', 'view notes', 'list notes', 'my notes')) {
    const notes = await mongoService.getNotes();
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'NAVIGATE_APP',
      navigationTarget: 'notes',
      category: 'NOTES',
      status: 'SUCCESS',
      response: `Displaying your MongoDB notes. You have ${notes.length} ${notes.length === 1 ? 'note' : 'notes'} saved.`,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (containsAny(normalized, 'delete last note', 'remove last note', 'delete previous note')) {
    const notes = await mongoService.getNotes();
    if (notes.length > 0) {
      const lastNote = notes[0];
      await mongoService.deleteNote(lastNote.id);
      return {
        command: rawCommand,
        recognizedText: rawCommand,
        action: 'DELETE_NOTE',
        category: 'NOTES',
        status: 'SUCCESS',
        response: `Successfully deleted note "${lastNote.title}" from MongoDB.`,
        data: { deletedNoteId: lastNote.id },
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
      };
    }
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'DELETE_NOTE',
      category: 'NOTES',
      status: 'FAILED',
      response: 'You do not have any notes to delete in MongoDB.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  // 6. Navigation Commands
  if (containsAny(normalized, 'open dashboard', 'go to dashboard', 'show dashboard', 'home')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'NAVIGATE_APP',
      navigationTarget: 'dashboard',
      category: 'NAVIGATION',
      status: 'SUCCESS',
      response: 'Navigating to Dashboard.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (containsAny(normalized, 'open database', 'show database', 'mongo database', 'view database', 'mongodb')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'NAVIGATE_APP',
      navigationTarget: 'database',
      category: 'NAVIGATION',
      status: 'SUCCESS',
      response: 'Opening MongoDB Database Studio.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (containsAny(normalized, 'open triggers', 'show triggers', 'custom commands', 'voice triggers')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'NAVIGATE_APP',
      navigationTarget: 'triggers',
      category: 'NAVIGATION',
      status: 'SUCCESS',
      response: 'Opening Custom Voice Triggers.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (containsAny(normalized, 'show command history', 'open command history', 'open history', 'show history')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'NAVIGATE_APP',
      navigationTarget: 'history',
      category: 'NAVIGATION',
      status: 'SUCCESS',
      response: 'Opening Command Execution History.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (containsAny(normalized, 'open settings', 'go to settings', 'show settings', 'voice settings', 'configure')) {
    return {
      command: rawCommand,
      recognizedText: rawCommand,
      action: 'NAVIGATE_APP',
      navigationTarget: 'settings',
      category: 'NAVIGATION',
      status: 'SUCCESS',
      response: 'Opening System & Voice Settings.',
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    };
  }

  // 7. AI Fallback with Gemini if configured
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are Voice Commander, an intelligent voice assistant with a MongoDB database backend. Respond concisely in 1-2 spoken sentences to the user command: "${rawCommand}". Keep answers conversational, helpful, and natural to listen to.`,
      });

      const reply = response.text?.trim() || "I've processed your query.";
      return {
        command: rawCommand,
        recognizedText: rawCommand,
        action: 'SPEAK',
        category: 'AI',
        status: 'SUCCESS',
        response: reply,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn('Gemini AI fallback error:', err);
    }
  }

  // 8. Default fallback for unknown command
  return {
    command: rawCommand,
    recognizedText: rawCommand,
    action: 'UNKNOWN',
    category: 'UNKNOWN',
    status: 'UNKNOWN',
    response: `I heard "${rawCommand}", but didn't recognize that command. Say "Help" for suggested voice commands or create a custom trigger in MongoDB.`,
    timestamp: new Date().toISOString(),
    executionTimeMs: Date.now() - startTime,
  };
}

// --- API ROUTES ---

// 1. Command Dispatch Endpoint
app.post('/api/command', async (req: Request, res: Response) => {
  const { command, source = 'voice', language = 'en-US' } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command text is required' });
  }

  try {
    const result = await processCommand(command, source, language);

    // Save execution record in MongoDB
    await mongoService.saveCommand({
      command: result.command,
      response: result.response,
      status: result.status,
      category: result.category,
      source,
      action: result.action,
      targetUrl: result.targetUrl,
      executionTimeMs: result.executionTimeMs,
      timestamp: result.timestamp,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Command processing failed:', error);
    return res.status(500).json({
      command,
      recognizedText: command,
      action: 'UNKNOWN',
      category: 'UNKNOWN',
      status: 'FAILED',
      response: 'An error occurred while processing the command.',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// 2. Command History Endpoints (MongoDB backed)
app.get('/api/history', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 100;
  const search = (req.query.search as string) || '';
  const history = await mongoService.getCommands(limit, search);
  return res.json(history);
});

app.delete('/api/history', async (_req: Request, res: Response) => {
  await mongoService.clearCommands();
  return res.json({ success: true, message: 'MongoDB command history cleared' });
});

app.get('/api/history/stats', async (_req: Request, res: Response) => {
  const stats = await mongoService.getStats();
  return res.json(stats);
});

// 3. Notes Endpoints (MongoDB backed)
app.get('/api/notes', async (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  const notes = await mongoService.getNotes(search);
  return res.json(notes);
});

app.post('/api/notes', async (req: Request, res: Response) => {
  const { title, content, category, color, pinned, tags } = req.body;
  if (!title && !content) {
    return res.status(400).json({ error: 'Title or content required' });
  }
  const note = await mongoService.createNote({
    title: title || 'Untitled Note',
    content: content || '',
    category: category || 'General',
    color: color || '#8B5CF6',
    pinned: !!pinned,
    tags: tags || [],
  });
  return res.status(201).json(note);
});

app.put('/api/notes/:id', async (req: Request, res: Response) => {
  const updated = await mongoService.updateNote(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Note not found in MongoDB' });
  }
  return res.json(updated);
});

app.delete('/api/notes/:id', async (req: Request, res: Response) => {
  const success = await mongoService.deleteNote(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Note not found in MongoDB' });
  }
  return res.json({ success: true, message: 'Note deleted from MongoDB' });
});

app.delete('/api/notes', async (req: Request, res: Response) => {
  const confirm = req.query.confirm === 'true';
  if (!confirm) {
    return res.status(400).json({ error: 'Confirmation (?confirm=true) required to clear all notes' });
  }
  await mongoService.clearNotes();
  return res.json({ success: true, message: 'All notes cleared from MongoDB' });
});

// 4. Custom Triggers Endpoints (MongoDB backed)
app.get('/api/triggers', async (_req: Request, res: Response) => {
  const triggers = await mongoService.getTriggers();
  return res.json(triggers);
});

app.post('/api/triggers', async (req: Request, res: Response) => {
  const { triggerPhrase, actionType, actionValue, response, category, enabled } = req.body;
  if (!triggerPhrase) {
    return res.status(400).json({ error: 'triggerPhrase is required' });
  }
  const trigger = await mongoService.createTrigger({
    triggerPhrase,
    actionType,
    actionValue,
    response,
    category,
    enabled,
  });
  return res.status(201).json(trigger);
});

app.put('/api/triggers/:id', async (req: Request, res: Response) => {
  const updated = await mongoService.updateTrigger(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Trigger not found' });
  }
  return res.json(updated);
});

app.delete('/api/triggers/:id', async (req: Request, res: Response) => {
  const success = await mongoService.deleteTrigger(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Trigger not found' });
  }
  return res.json({ success: true, message: 'Trigger deleted' });
});

// 5. Settings Endpoints (MongoDB backed)
app.get('/api/settings', async (_req: Request, res: Response) => {
  const settings = await mongoService.getSettings();
  return res.json(settings);
});

app.post('/api/settings', async (req: Request, res: Response) => {
  const settings = await mongoService.saveSettings(req.body);
  return res.json(settings);
});

// 6. MongoDB Database Administration & Studio Endpoints
app.get('/api/database/status', async (_req: Request, res: Response) => {
  const status = await mongoService.getStatus();
  return res.json(status);
});

app.post('/api/database/test-connection', async (req: Request, res: Response) => {
  const { uri, dbName } = req.body;
  if (!uri) {
    return res.status(400).json({ success: false, message: 'MongoDB URI is required' });
  }
  const result = await mongoService.testConnection(uri, dbName || 'voice_commander');
  return res.json(result);
});

app.post('/api/database/connect', async (req: Request, res: Response) => {
  const { uri, dbName = 'voice_commander' } = req.body;
  if (!uri) {
    return res.status(400).json({ success: false, message: 'MongoDB URI is required' });
  }
  try {
    await mongoService.initMongoConnection(uri, dbName);
    const status = await mongoService.getStatus();
    return res.json({ success: true, message: 'Connected to MongoDB cluster!', status });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to connect to MongoDB' });
  }
});

app.post('/api/database/disconnect', async (_req: Request, res: Response) => {
  await mongoService.disconnectMongo();
  const status = await mongoService.getStatus();
  return res.json({ success: true, message: 'Switched to embedded MongoDB mode', status });
});

app.get('/api/database/collections/:name', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const search = (req.query.search as string) || '';
  const result = await mongoService.getCollectionDocuments(req.params.name, page, limit, search);
  return res.json(result);
});

app.post('/api/database/collections/:name', async (req: Request, res: Response) => {
  const doc = await mongoService.insertRawDocument(req.params.name, req.body);
  return res.status(201).json(doc);
});

app.delete('/api/database/collections/:name/:id', async (req: Request, res: Response) => {
  await mongoService.deleteRawDocument(req.params.name, req.params.id);
  return res.json({ success: true, message: 'Document deleted from MongoDB' });
});

app.post('/api/database/seed', async (_req: Request, res: Response) => {
  await mongoService.seedDemoData();
  const status = await mongoService.getStatus();
  return res.json({ success: true, message: 'Database reset & seeded successfully', status });
});

app.get('/api/database/export', async (_req: Request, res: Response) => {
  const exportData = await mongoService.exportAll();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="voice_commander_mongodb_backup.json"');
  return res.json(exportData);
});

// Vite middleware / Static server setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Voice Commander with MongoDB server running at http://localhost:${PORT}`);
  });
}

startServer();
