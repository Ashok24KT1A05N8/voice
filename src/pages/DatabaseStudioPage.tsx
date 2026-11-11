import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Download, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Search, 
  Code, 
  Key, 
  Layers, 
  Activity, 
  Zap, 
  Copy, 
  Check, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { assistantApi } from '../services/api';
import type { MongoDbStatus } from '../types/assistant';

export const DatabaseStudioPage: React.FC = () => {
  const [status, setStatus] = useState<MongoDbStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCollection, setActiveCollection] = useState<'commands' | 'notes' | 'custom_triggers' | 'user_settings'>('commands');
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Connection form state
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [mongoUriInput, setMongoUriInput] = useState<string>('');
  const [dbNameInput, setDbNameInput] = useState<string>('voice_commander');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // New Document modal
  const [showInsertModal, setShowInsertModal] = useState<boolean>(false);
  const [newDocJson, setNewDocJson] = useState<string>('{\n  "title": "New Document",\n  "content": "Sample content stored in MongoDB"\n}');
  const [insertError, setInsertError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await assistantApi.getDatabaseStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  const fetchCollectionDocs = async () => {
    setLoading(true);
    try {
      const res = await assistantApi.getCollectionDocuments(activeCollection, 1, 50, searchTerm);
      setDocuments(res.documents);
      setTotalDocs(res.total);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    fetchCollectionDocs();
  }, [activeCollection, searchTerm]);

  const handleTestConnection = async () => {
    if (!mongoUriInput.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await assistantApi.testMongoConnection(mongoUriInput.trim(), dbNameInput.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) return;
    setIsConnecting(true);
    try {
      const res = await assistantApi.connectMongo(mongoUriInput.trim(), dbNameInput.trim());
      setStatus(res.status);
      setShowConnectModal(false);
      fetchCollectionDocs();
    } catch (err: any) {
      alert(err.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Switch back to local embedded MongoDB engine?')) return;
    try {
      const res = await assistantApi.disconnectMongo();
      setStatus(res.status);
      fetchCollectionDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeed = async () => {
    if (!confirm('This will seed initial sample documents into MongoDB collections. Continue?')) return;
    setIsSeeding(true);
    try {
      const res = await assistantApi.seedDatabase();
      setStatus(res.status);
      fetchCollectionDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm(`Delete document "${id}" from MongoDB?`)) return;
    try {
      await assistantApi.deleteRawDocument(activeCollection, id);
      fetchCollectionDocs();
      fetchStatus();
      if (selectedDoc && (String(selectedDoc.id) === id || selectedDoc._id === id)) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInsertDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setInsertError(null);
    try {
      const parsed = JSON.parse(newDocJson);
      await assistantApi.insertRawDocument(activeCollection, parsed);
      setShowInsertModal(false);
      fetchCollectionDocs();
      fetchStatus();
    } catch (err: any) {
      setInsertError(err.message || 'Invalid JSON syntax');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database size={18} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">MongoDB Database Studio</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time document storage for voice commands, notes, triggers, and automations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchStatus}
            title="Refresh Status"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>

          <a
            href={assistantApi.exportDatabaseUrl()}
            download="voice_commander_mongodb.json"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Download size={14} className="text-indigo-400" />
            <span>Export JSON</span>
          </a>

          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Zap size={14} className="text-amber-400" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
          </button>

          {status?.connected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/40 transition-colors cursor-pointer"
            >
              <XCircle size={14} />
              <span>Disconnect Cluster</span>
            </button>
          ) : (
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Server size={14} />
              <span>Connect MongoDB Atlas</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics & Connection Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Engine Status */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Database Mode</span>
            <div className={`w-2 h-2 rounded-full ${status?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'}`} />
          </div>
          <div className="text-base font-semibold text-white">
            {status?.modeLabel || 'Embedded Document DB'}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">
            {status?.connected ? status.uriMasked : 'In-memory + disk persistent'}
          </div>
        </div>

        {/* Card 2: Database Name & Ping */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active Database</span>
            <Database size={14} className="text-emerald-400" />
          </div>
          <div className="text-base font-semibold text-emerald-400 font-mono">
            {status?.dbName || 'voice_commander'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <Activity size={12} className="text-slate-500" />
            <span>Latency: {status?.pingMs !== null && status?.pingMs !== undefined ? `${status.pingMs} ms` : 'Local (0 ms)'}</span>
          </div>
        </div>

        {/* Card 3: Total Documents */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Documents</span>
            <Layers size={14} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {status?.totalDocuments ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across 4 collections
          </div>
        </div>

        {/* Card 4: Estimated Storage */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Storage Size</span>
            <Code size={14} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {status?.storageSizeEstimate || '16 KB'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            BSON / JSON format
          </div>
        </div>
      </div>

      {/* Collection Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          {(
            [
              { id: 'commands', label: 'commands', count: status?.collections?.commands ?? 0, desc: 'Voice logs' },
              { id: 'notes', label: 'notes', count: status?.collections?.notes ?? 0, desc: 'Voice notes' },
              { id: 'custom_triggers', label: 'custom_triggers', count: status?.collections?.custom_triggers ?? 0, desc: 'Automations' },
              { id: 'user_settings', label: 'user_settings', count: status?.collections?.user_settings ?? 1, desc: 'Settings' },
            ] as const
          ).map((col) => {
            const isActive = activeCollection === col.id;
            return (
              <button
                key={col.id}
                onClick={() => {
                  setActiveCollection(col.id);
                  setSelectedDoc(null);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>{col.label}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                  {col.count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (activeCollection === 'commands') {
              setNewDocJson(JSON.stringify({
                command: 'what is the weather',
                response: 'The weather is clear and 72 degrees Fahrenheit.',
                status: 'SUCCESS',
                category: 'GENERAL',
                source: 'voice',
                timestamp: new Date().toISOString()
              }, null, 2));
            } else if (activeCollection === 'notes') {
              setNewDocJson(JSON.stringify({
                title: 'New MongoDB Note',
                content: 'Take note via voice command or MongoDB studio.',
                category: 'Work',
                color: '#10B981',
                pinned: false,
                tags: ['database', 'note']
              }, null, 2));
            } else if (activeCollection === 'custom_triggers') {
              setNewDocJson(JSON.stringify({
                triggerPhrase: 'launch music',
                actionType: 'OPEN_URL',
                actionValue: 'https://music.youtube.com',
                response: 'Playing chill focus music.',
                category: 'Media',
                enabled: true
              }, null, 2));
            } else {
              setNewDocJson(JSON.stringify({
                language: 'en-US',
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                wakeWord: 'Commander'
              }, null, 2));
            }
            setShowInsertModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors shrink-0 cursor-pointer"
        >
          <Plus size={14} />
          <span>Insert Document</span>
        </button>
      </div>

      {/* Main Grid: Document List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Documents Browser */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search in ${activeCollection} (regex supported)...`}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Documents Table / List */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-emerald-400" />
                Loading documents from MongoDB...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No documents found in collection <span className="font-mono text-slate-400">"{activeCollection}"</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-[580px] overflow-y-auto">
                {documents.map((doc, idx) => {
                  const docId = doc._id ? (typeof doc._id === 'object' ? doc._id.$oid || JSON.stringify(doc._id) : String(doc._id)) : String(doc.id || idx);
                  const isSelected = selectedDoc && (selectedDoc._id === doc._id || selectedDoc.id === doc.id);

                  let title = doc.command || doc.title || doc.triggerPhrase || (doc.wakeWord ? `Settings (${doc.language})` : `Document #${docId}`);
                  let subtitle = doc.response || doc.content || doc.actionValue || doc.category || '';

                  return (
                    <div
                      key={docId}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-3.5 flex items-start justify-between gap-3 transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                            _id: {docId.slice(0, 10)}...
                          </span>
                          <span className="font-medium text-slate-200 truncate">
                            {title}
                          </span>
                          {doc.category && (
                            <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                              {doc.category}
                            </span>
                          )}
                        </div>

                        {subtitle && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {subtitle}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-0.5">
                          {doc.timestamp && <span>{new Date(doc.timestamp).toLocaleTimeString()}</span>}
                          {doc.createdAt && <span>{new Date(doc.createdAt).toLocaleDateString()}</span>}
                          {doc.status && (
                            <span className={doc.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}>
                              {doc.status}
                            </span>
                          )}
                          {doc.executionCount !== undefined && (
                            <span>Hits: {doc.executionCount}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(docId, docId);
                          }}
                          title="Copy ObjectId"
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {copiedId === docId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(docId);
                          }}
                          title="Delete from MongoDB"
                          className="p-1.5 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Document JSON Inspector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-emerald-400" />
                <span className="text-xs font-semibold text-white">Document BSON / JSON</span>
              </div>
              {selectedDoc && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(selectedDoc, null, 2), 'doc-body')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  {copiedId === 'doc-body' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>Copy Document</span>
                </button>
              )}
            </div>

            {selectedDoc ? (
              <div className="mt-3 space-y-3">
                <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-[460px] border border-slate-800">
                  <pre>{JSON.stringify(selectedDoc, null, 2)}</pre>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Collection: {activeCollection}
                  </span>
                  <button
                    onClick={() => {
                      const docId = selectedDoc._id ? String(selectedDoc._id) : String(selectedDoc.id);
                      handleDeleteDocument(docId);
                    }}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete Record</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <FileText size={20} className="mx-auto mb-2 text-slate-600" />
                Click on any document on the left to inspect its complete MongoDB JSON structure.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Server size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connect to MongoDB Cluster</h3>
                  <p className="text-xs text-slate-400">Enter your MongoDB Atlas or local MongoDB connection string</p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  MongoDB URI Connection String
                </label>
                <input
                  type="text"
                  value={mongoUriInput}
                  onChange={(e) => setMongoUriInput(e.target.value)}
                  placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/voice_commander"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports MongoDB Atlas (SRV) and local mongod (e.g., <code className="text-slate-400">mongodb://localhost:27017</code>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Database Name
                </label>
                <input
                  type="text"
                  value={dbNameInput}
                  onChange={(e) => setDbNameInput(e.target.value)}
                  placeholder="voice_commander"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}>
                  {testResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-semibold">{testResult.message}</div>
                    {testResult.latencyMs !== undefined && (
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Roundtrip Ping: {testResult.latencyMs} ms
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !mongoUriInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isTesting ? 'Testing Ping...' : 'Test Connection'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConnecting || !mongoUriInput.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Cluster'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Document Modal */}
      {showInsertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Insert Document into "{activeCollection}"</h3>
              </div>
              <button
                onClick={() => setShowInsertModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInsertDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Document JSON
                </label>
                <textarea
                  rows={10}
                  value={newDocJson}
                  onChange={(e) => setNewDocJson(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {insertError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{insertError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInsertModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  Insert Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
