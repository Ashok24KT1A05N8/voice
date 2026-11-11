import React, { useState } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Trash2,
  Edit2,
  Pin,
  Mic,
  AlertTriangle,
  X,
  Check,
  Tag,
  Palette,
} from 'lucide-react';
import { NoteItem } from '../types/assistant';

interface NotesManagerPageProps {
  notes: NoteItem[];
  onCreateNote: (note: Partial<NoteItem>) => Promise<void>;
  onUpdateNote: (id: string | number, note: Partial<NoteItem>) => Promise<void>;
  onDeleteNote: (id: string | number) => Promise<void>;
  onClearAllNotes: () => Promise<void>;
  onStartVoiceNote: () => void;
}

export const NotesManagerPage: React.FC<NotesManagerPageProps> = ({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onClearAllNotes,
  onStartVoiceNote,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    color: '#8B5CF6',
    pinned: false,
  });

  const categories = ['All', 'General', 'Voice', 'Tasks', 'Personal', 'Ideas'];
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#64748B'];

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || n.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      category: 'General',
      color: '#8B5CF6',
      pinned: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: NoteItem) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      color: note.color || '#8B5CF6',
      pinned: note.pinned,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    if (editingNote) {
      await onUpdateNote(editingNote.id, formData);
    } else {
      await onCreateNote({
        title: formData.title.trim() || 'Untitled Note',
        content: formData.content.trim(),
        category: formData.category,
        color: formData.color,
        pinned: formData.pinned,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Voice Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <StickyNote size={14} />
            <span>Smart Workspace</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Notes Manager</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal voice and text notes. Add notes by voice anytime with: <code className="text-purple-300">"Add note [your text]"</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={onStartVoiceNote}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Mic size={15} className="text-purple-400" />
            <span>Record Voice Note</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Note</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search notes by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
          />
        </div>

        {/* Category Filter Pills (Functional Buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}

          {notes.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="ml-auto text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              <Trash2 size={13} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <StickyNote size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">No Notes Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {search
                ? `No notes match "${search}". Try clearing your search filter.`
                : 'Your notebook is empty. Click "Create Note" or speak "Add note review weekly goals" to create your first note.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Create First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group space-y-3 relative overflow-hidden"
            >
              {/* Top Accent Stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: note.color || '#8B5CF6' }}
              />

              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-white tracking-tight line-clamp-1">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {note.pinned && <Pin size={13} className="text-amber-400 fill-amber-400" />}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(note)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit note"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {note.content}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium text-purple-400">{note.category}</span>
                <span className="font-mono tabular-nums">
                  {new Date(note.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Note */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Project Architecture Meeting"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Content *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your note here or dictate by voice..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Color Theme</label>
                  <div className="flex items-center gap-2 pt-1">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          formData.color === c ? 'ring-2 ring-white scale-110' : 'opacity-70'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNote"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="pinNote" className="text-xs text-slate-300 cursor-pointer">
                  Pin to top of list
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium shadow-md shadow-purple-900/30 transition-all cursor-pointer"
                >
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Clear All Notes */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-rose-500/40 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-white">Clear All Notes?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will permanently delete all <strong className="text-white">{notes.length} notes</strong>. This operation cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onClearAllNotes();
                  setIsClearConfirmOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Confirm Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
