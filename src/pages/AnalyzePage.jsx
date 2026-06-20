import { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppStore } from '../store'
import { buildSystemPrompt } from '../utils/calculations'

const GROQ = 'https://api.groq.com/openai/v1/chat/completions'
const KEY = import.meta.env.VITE_GROQ_KEY

const TRAIN_CATS = [
  { id: 'foundation', label: 'Foundation' },
  { id: 'section', label: 'Section' },
  { id: 'rebar', label: 'Rebar' },
  { id: 'beam_column', label: 'Beam/Column' },
  { id: 'boss_style', label: 'Boss Style' },
  { id: 'material', label: 'Material' },
  { id: 'general', label: 'General' },
]

function Dots() {
  return (
    <div className="flex gap-1 loading-dots py-1">
      {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block" />)}
    </div>
  )
}

function Msg({ m }) {
  const isUser = m.role === 'user'
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded shrink-0 flex items-center justify-center text-xs mono font-bold ${isUser ? 'bg-steel-600 text-steel-200' : 'bg-blue-600/30 border border-blue-500/40 text-blue-300'}`}>
        {isUser ? 'R' : 'AI'}
      </div>
      <div className={`max-w-[78%] rounded-xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-steel-700/60 text-steel-200 rounded-tr-none' : 'bg-steel-800/80 border border-steel-700/40 text-steel-100 rounded-tl-none'}`}>
        {m.files?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {m.files.map((f,i) => (
              <span key={i} className="flex items-center gap-1 bg-steel-700/50 border border-steel-600/40 rounded px-2 py-0.5 text-xs mono text-steel-300">
                ⬡ {f.name}
              </span>
            ))}
          </div>
        )}
        {m.loading ? <Dots /> : <p className="whitespace-pre-wrap font-sans text-sm select-text">{m.content}</p>}
      </div>
    </div>
  )
}

// ─── TRAINING INPUT BOX ──────────────────────────────────────
function TrainingBox() {
  const { addTrainingData, trainingData, removeTrainingData } = useAppStore()
  const [cat, setCat] = useState('foundation')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [saved, setSaved] = useState(false)

  const onDrop = useCallback(f => setFiles(p => [...p, ...f]), [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, noClick: true,
    accept: { 'image/*': [], 'application/pdf': ['.pdf'], '.dxf': [], 'text/*': [] },
    maxSize: 20 * 1024 * 1024,
  })

  const readFile = f => new Promise(res => {
    const r = new FileReader()
    r.onload = e => res(e.target.result)
    if (f.name.endsWith('.dxf') || f.type.startsWith('text/')) r.readAsText(f)
    else res(`[File: ${f.name}]`)
  })

  const save = async () => {
    if (!title && !content && !files.length) return
    const fc = []
    for (const f of files) { const c = await readFile(f); fc.push({ name: f.name, type: f.type, content: typeof c === 'string' ? c.slice(0, 8000) : c }) }
    addTrainingData({ category: cat, title: title || files.map(f => f.name).join(', '), content, files: fc, fileNames: files.map(f => f.name) })
    setTitle(''); setContent(''); setFiles([])
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-4 p-4" {...getRootProps()}>
      <input {...getInputProps()} />

      {/* Add form */}
      <div className="border border-green-700/40 rounded-xl bg-green-900/10 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-green-300 text-xs font-medium mono">TRAINING INPUT</span>
          <span className="text-steel-500 text-xs mono ml-1">— AI শিখবে, জবাব দেবে না</span>
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1">
          {TRAIN_CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`px-2 py-0.5 rounded text-xs mono border transition-all ${cat === c.id ? 'bg-green-700/40 border-green-600/50 text-green-300' : 'border-steel-700/40 text-steel-500 hover:border-steel-600'}`}>
              {c.label}
            </button>
          ))}
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Title (e.g. Standard Isolated Footing, Boss এর section style)"
          className="w-full bg-steel-900/60 border border-steel-700/40 rounded-lg px-3 py-2 text-white mono text-xs focus:outline-none focus:border-green-600/50" />

        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Details, specs, dimensions, boss এর instruction লিখো..."
          rows={3}
          className="w-full bg-steel-900/60 border border-steel-700/40 rounded-lg px-3 py-2 text-white mono text-xs focus:outline-none focus:border-green-600/50 resize-none" />

        {/* File drop */}
        <div className={`border border-dashed rounded-lg px-3 py-2 text-center transition-all ${isDragActive ? 'border-green-500 bg-green-900/20' : 'border-steel-700/40'}`}>
          <label className="cursor-pointer flex items-center justify-center gap-2">
            <input type="file" multiple className="hidden" accept=".dxf,.pdf,.png,.jpg,.jpeg,.txt"
              onChange={e => setFiles(p => [...p, ...Array.from(e.target.files)])} />
            <span className="text-steel-500 text-xs mono">⬡ Drag file বা </span>
            <span className="text-green-400 text-xs mono underline">Browse</span>
          </label>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1 bg-green-900/30 border border-green-700/40 rounded px-1.5 py-0.5">
                  <span className="text-green-400 text-xs">⬡</span>
                  <span className="text-xs mono text-green-300">{f.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_,j)=>j!==i))} className="text-steel-500 hover:text-red-400 text-xs ml-0.5">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={save}
          className={`w-full py-2 rounded-lg text-xs mono font-medium transition-all border ${saved ? 'bg-green-700/40 border-green-500/50 text-green-200' : 'bg-green-800/20 border-green-700/40 text-green-300 hover:bg-green-700/30'}`}>
          {saved ? '✓ Saved!' : '◈ Save to Training Hub'}
        </button>
      </div>

      {/* Saved list */}
      {(trainingData?.length || 0) > 0 && (
        <div className="space-y-2">
          <p className="text-steel-500 text-xs mono">Saved ({trainingData.length} entries):</p>
          {trainingData.slice().reverse().map(item => (
            <div key={item.id} className="bg-steel-900/60 border border-steel-700/40 rounded-xl px-4 py-2.5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-xs mono">{item.category}</span>
                  <span className="text-steel-300 text-xs mono">{item.title}</span>
                </div>
                {item.fileNames?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {item.fileNames.map((n,i) => <span key={i} className="text-xs mono text-green-500 bg-green-900/20 px-1 py-0.5 rounded">⬡ {n}</span>)}
                  </div>
                )}
              </div>
              <button onClick={() => removeTrainingData(item.id)} className="text-steel-600 hover:text-red-400 text-xs mono shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────
export default function AnalyzePage() {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([{
    id: 0, role: 'assistant',
    content: 'Kora AI ready. প্রশ্ন করুন বা drawing দিন।\n\n✅ DXF / PDF / Image upload\n✅ Foundation, Beam, Column, Slab\n✅ Rebar sizing & spacing\n✅ RL / EL / GL calculations\n✅ ACI 318-19 & BNBC 2020\n✅ Training data automatically use হবে'
  }])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('work')
  const bottomRef = useRef(null)
  const { codeStandard, knowledgeBase, trainingData, addMessage } = useAppStore()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const onDrop = useCallback(f => setFiles(p => [...p, ...f]), [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, noClick: true,
    accept: { 'image/*': [], 'application/pdf': ['.pdf'], '.dxf': [] },
    maxSize: 20 * 1024 * 1024,
  })

  const readDXF = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsText(f) })

  const buildMsg = async (text, fList) => {
    const parts = []
    for (const f of fList) {
      if (f.name.toLowerCase().endsWith('.dxf')) {
        const txt = await readDXF(f)
        parts.push(`[DXF: ${f.name}]\n\`\`\`\n${txt.slice(0, 12000)}\n\`\`\`\nAnalyze this AutoCAD DXF.`)
      } else {
        parts.push(`[File: ${f.name}] — Analyze this structural drawing/document.`)
      }
    }
    if (text.trim()) parts.push(text)
    return parts.join('\n\n') || 'Hello'
  }

  const send = async () => {
    if (!input.trim() && !files.length) return
    if (loading) return
    const uMsg = { id: Date.now(), role: 'user', content: input, files: files.map(f => ({ name: f.name })) }
    const aiMsg = { id: Date.now() + 1, role: 'assistant', loading: true, content: '' }
    setMsgs(p => [...p, uMsg, aiMsg])
    setInput('')
    const fCopy = [...files]; setFiles([])
    setLoading(true)

    try {
      const userContent = await buildMsg(input, fCopy)
      const sys = buildSystemPrompt(codeStandard, knowledgeBase, trainingData)
      const history = msgs.filter(m => !m.loading).slice(-8)
        .map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' }))
        .concat([{ role: 'user', content: userContent }])

      const resp = await fetch(GROQ, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 2048, messages: [{ role: 'system', content: sys }, ...history] })
      })
      const data = await resp.json()
      const txt = data.choices?.[0]?.message?.content || data.error?.message || 'API Error'
      setMsgs(p => p.map(m => m.id === aiMsg.id ? { ...m, loading: false, content: txt } : m))
      addMessage({ role: 'user', content: input })
      addMessage({ role: 'assistant', content: txt })
    } catch (e) {
      setMsgs(p => p.map(m => m.id === aiMsg.id ? { ...m, loading: false, content: `Error: ${e.message}` } : m))
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header tabs */}
      <div className="px-5 py-2.5 border-b border-steel-700/40 flex items-center justify-between shrink-0">
        <div className="flex gap-1">
          <button onClick={() => setTab('work')}
            className={`px-4 py-1.5 rounded-lg text-xs mono font-medium border transition-all ${tab === 'work' ? 'bg-blue-600/30 border-blue-500/40 text-blue-300' : 'border-steel-700/40 text-steel-400 hover:border-steel-600'}`}>
            ⬡ Work Area
          </button>
          <button onClick={() => setTab('train')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs mono font-medium border transition-all ${tab === 'train' ? 'bg-green-700/30 border-green-600/40 text-green-300' : 'border-steel-700/40 text-steel-400 hover:border-steel-600'}`}>
            ◈ Training Input
            {(trainingData?.length || 0) > 0 && <span className="bg-green-800/50 text-green-400 rounded px-1">{trainingData.length}</span>}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-steel-400 mono">Groq Ready</span>
        </div>
      </div>

      {/* Training tab */}
      {tab === 'train' && <div className="flex-1 overflow-y-auto"><TrainingBox /></div>}

      {/* Work tab */}
      {tab === 'work' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 relative" {...getRootProps()}>
            <input {...getInputProps()} />
            {isDragActive && (
              <div className="absolute inset-0 z-50 bg-blue-900/80 flex items-center justify-center border-2 border-dashed border-blue-400 rounded">
                <div className="text-center">
                  <div className="text-4xl mb-2">⬡</div>
                  <p className="text-blue-300 mono">Drop DXF / PDF / Image here</p>
                </div>
              </div>
            )}
            {msgs.map(m => <Msg key={m.id} m={m} />)}
            <div ref={bottomRef} />
          </div>

          {files.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {files.map((f,i) => (
                <div key={i} className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/40 rounded-lg px-2 py-1">
                  <span className="text-blue-400 text-xs">⬡</span>
                  <span className="text-xs mono text-blue-300">{f.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_,j) => j!==i))} className="text-steel-400 hover:text-red-400 text-xs ml-1">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 pb-4 shrink-0">
            <div className="flex gap-2 bg-steel-800/60 border border-steel-600/40 rounded-xl p-2 focus-within:border-blue-500/40 transition-all">
              <label className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-steel-700/60 cursor-pointer text-steel-400 hover:text-blue-400 shrink-0 transition-colors">
                <input type="file" className="hidden" multiple accept=".dxf,.pdf,.png,.jpg,.jpeg"
                  onChange={e => setFiles(p => [...p, ...Array.from(e.target.files)])} />
                <span className="text-lg">⬡</span>
              </label>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="প্রশ্ন করুন বা drawing দিন... (Enter to send, Shift+Enter new line)"
                rows={1}
                className="flex-1 bg-transparent text-steel-200 placeholder-steel-500 text-sm mono resize-none outline-none leading-6 py-1 min-h-[32px] max-h-32" />
              <button onClick={send} disabled={loading || (!input.trim() && !files.length)}
                className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 hover:bg-blue-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0">
                →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
