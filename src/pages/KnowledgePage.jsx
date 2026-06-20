import { useState } from 'react'
import { useAppStore } from '../store'

const CATEGORIES = [
  { id: 'foundations', label: 'Foundations', icon: '⬡' },
  { id: 'sections', label: 'Section Details', icon: '◈' },
  { id: 'rebarSchedules', label: 'Rebar Schedules', icon: '≡' },
  { id: 'notes', label: 'General Notes', icon: '◷' },
]

export default function KnowledgePage() {
  const { knowledgeBase, addKnowledge, removeKnowledge } = useAppStore()
  const [activeCategory, setActiveCategory] = useState('foundations')
  const [form, setForm] = useState({ title: '', description: '', code: '', tags: '' })
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    if (!form.title.trim()) return
    addKnowledge(activeCategory, {
      title: form.title,
      description: form.description,
      code: form.code,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setForm({ title: '', description: '', code: '', tags: '' })
    setShowForm(false)
  }

  const items = knowledgeBase[activeCategory] || []

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white mono">Knowledge Base</h1>
          <p className="text-steel-500 text-xs mono">Your standard details, schedules, notes</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 rounded-lg text-xs mono hover:bg-blue-600/30 transition-all">
          + Add Entry
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mono transition-all ${
              activeCategory === cat.id
                ? 'bg-blue-600/30 border border-blue-500/40 text-blue-300'
                : 'text-steel-400 hover:text-steel-200 border border-steel-700/50 hover:border-steel-600'
            }`}>
            <span>{cat.icon}</span> {cat.label}
            <span className="bg-steel-700 text-steel-400 rounded px-1 text-xs">
              {(knowledgeBase[cat.id] || []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glow-border rounded-xl bg-steel-900/60 p-4 space-y-3">
          <h3 className="text-sm font-medium text-steel-300 mono">Add to {CATEGORIES.find(c => c.id === activeCategory)?.label}</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (e.g. Isolated Footing 10'x10')" 
            className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description / notes / specifications..."
            rows={3}
            className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            placeholder="Code reference (e.g. ACI 318-19 §13.3.1)"
            className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="Tags (comma separated: foundation, isolated, 4000psi)"
            className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="px-4 py-1.5 bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg text-xs mono hover:bg-blue-600/40 transition-all">
              Save Entry
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-steel-400 hover:text-steel-200 text-xs mono transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="glow-border rounded-xl bg-steel-900/40 p-8 text-center">
          <p className="text-steel-500 mono text-sm">No entries yet.</p>
          <p className="text-steel-600 mono text-xs mt-1">Add your standard details, typical sections, and rebar schedules here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="glow-border rounded-xl bg-steel-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mono">{item.title}</h3>
                  {item.description && (
                    <p className="text-steel-400 text-xs mono mt-1 leading-relaxed">{item.description}</p>
                  )}
                  {item.code && (
                    <p className="text-blue-400 text-xs mono mt-1">📋 {item.code}</p>
                  )}
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-steel-700/60 text-steel-400 rounded text-xs mono">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => removeKnowledge(activeCategory, item.id)}
                  className="text-steel-600 hover:text-red-400 text-xs mono shrink-0 transition-colors">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
