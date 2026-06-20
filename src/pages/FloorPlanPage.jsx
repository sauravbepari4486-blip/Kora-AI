import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const API_KEY = import.meta.env.VITE_GROQ_KEY

const BUILDING_TYPES = [
  { id: 'residential_flat', label: 'Residential Flat' },
  { id: 'private_house', label: 'Private House' },
  { id: 'duplex', label: 'Duplex' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'mixed', label: 'Mixed Use' },
]

const CODE_STANDARDS = [
  { id: 'BNBC', label: 'BNBC 2020' },
  { id: 'IBC', label: 'IBC (USA)' },
]

const ROOM_COLORS = {
  bedroom: '#2d4a7a',
  master_bedroom: '#1a3a6b',
  living: '#2a5c3f',
  dining: '#3d5c2a',
  kitchen: '#7a4a1a',
  bathroom: '#1a5c6b',
  toilet: '#1a4a5c',
  balcony: '#4a3d1a',
  corridor: '#3d3d3d',
  staircase: '#5c3d1a',
  store: '#3d2a4a',
  garage: '#4a4a1a',
  lobby: '#2a4a4a',
}

const ROOM_LABELS = {
  bedroom: 'BED ROOM',
  master_bedroom: "MASTER BED",
  living: 'LIVING',
  dining: 'DINING',
  kitchen: 'KITCHEN',
  bathroom: 'BATH',
  toilet: 'TOILET',
  balcony: 'BALCONY',
  corridor: 'CORRIDOR',
  staircase: 'STAIR',
  store: 'STORE',
  garage: 'GARAGE',
  lobby: 'LOBBY',
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 loading-dots">
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block" />
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block" />
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block" />
    </div>
  )
}

// Draw floor plan on canvas
function FloorPlanCanvas({ rooms, plotW, plotH, mode }) {
  const canvasRef = useRef(null)
  const PADDING = 60
  const CANVAS_W = 700
  const CANVAS_H = 500

  useEffect(() => {
    if (!rooms || rooms.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Scale
    const scaleX = (CANVAS_W - PADDING * 2) / plotW
    const scaleY = (CANVAS_H - PADDING * 2) / plotH
    const scale = Math.min(scaleX, scaleY)

    const offsetX = (CANVAS_W - plotW * scale) / 2
    const offsetY = (CANVAS_H - plotH * scale) / 2

    // Background
    ctx.fillStyle = mode === 'colored' ? '#0a1628' : '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Grid (blueprint style for line mode)
    if (mode === 'line') {
      ctx.strokeStyle = '#e8e8e8'
      ctx.lineWidth = 0.5
      for (let x = 0; x < CANVAS_W; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke()
      }
      for (let y = 0; y < CANVAS_H; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
      }
    }

    // Draw each room
    rooms.forEach(room => {
      const rx = offsetX + room.x * scale
      const ry = offsetY + room.y * scale
      const rw = room.w * scale
      const rh = room.h * scale

      if (mode === 'colored') {
        // Fill
        ctx.fillStyle = ROOM_COLORS[room.type] || '#2a3a4a'
        ctx.fillRect(rx, ry, rw, rh)
        // Border
        ctx.strokeStyle = '#63b3ed'
        ctx.lineWidth = 1.5
        ctx.strokeRect(rx, ry, rw, rh)
        // Label
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${Math.max(9, Math.min(12, rw / 6))}px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(ROOM_LABELS[room.type] || room.type.toUpperCase(), rx + rw / 2, ry + rh / 2 - 6)
        // Dimensions
        ctx.fillStyle = '#90cdf4'
        ctx.font = `${Math.max(8, Math.min(10, rw / 7))}px monospace`
        ctx.fillText(`${room.w}'×${room.h}'`, rx + rw / 2, ry + rh / 2 + 10)
      } else {
        // Line/AutoCAD mode
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.strokeRect(rx, ry, rw, rh)
        // Hatch for wet areas
        if (['bathroom','toilet','kitchen'].includes(room.type)) {
          ctx.strokeStyle = '#888888'
          ctx.lineWidth = 0.5
          for (let i = 0; i < rw + rh; i += 8) {
            ctx.beginPath()
            ctx.moveTo(rx + Math.max(0, i - rh), ry + Math.min(rh, i))
            ctx.lineTo(rx + Math.min(rw, i), ry + Math.max(0, i - rw))
            ctx.stroke()
          }
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 2
          ctx.strokeRect(rx, ry, rw, rh)
        }
        // Label
        ctx.fillStyle = '#000000'
        ctx.font = `bold ${Math.max(9, Math.min(11, rw / 6))}px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(ROOM_LABELS[room.type] || room.type.toUpperCase(), rx + rw / 2, ry + rh / 2 - 5)
        ctx.font = `${Math.max(8, Math.min(10, rw / 7))}px monospace`
        ctx.fillText(`${room.w}'×${room.h}'`, rx + rw / 2, ry + rh / 2 + 8)
      }
    })

    // Dimension lines
    const totalW = plotW * scale
    const totalH = plotH * scale
    ctx.strokeStyle = mode === 'colored' ? '#63b3ed' : '#000000'
    ctx.fillStyle = mode === 'colored' ? '#63b3ed' : '#000000'
    ctx.lineWidth = 1
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'

    // Bottom dimension
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY + totalH + 20)
    ctx.lineTo(offsetX + totalW, offsetY + totalH + 20)
    ctx.stroke()
    ctx.fillText(`${plotW}'-0"`, offsetX + totalW / 2, offsetY + totalH + 35)

    // Right dimension
    ctx.save()
    ctx.translate(offsetX + totalW + 30, offsetY + totalH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${plotH}'-0"`, 0, 0)
    ctx.restore()

    // Plot border
    ctx.strokeStyle = mode === 'colored' ? '#f6ad55' : '#000000'
    ctx.lineWidth = 3
    ctx.strokeRect(offsetX, offsetY, totalW, totalH)

    // North arrow
    ctx.fillStyle = mode === 'colored' ? '#f6ad55' : '#333'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('N↑', offsetX + totalW - 15, offsetY + 20)

  }, [rooms, plotW, plotH, mode])

  return (
    <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
      className="w-full rounded-xl border border-steel-700/50"
      style={{ maxHeight: '500px', objectFit: 'contain' }} />
  )
}

export default function FloorPlanPage() {
  const { codeStandard } = useAppStore()
  const [form, setForm] = useState({
    plotWidth: '', plotDepth: '',
    plotUnit: 'ft',
    floors: '1',
    buildingType: 'residential_flat',
    bedrooms: '2',
    bathrooms: '2',
    codeStd: codeStandard || 'BNBC',
    extras: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [viewMode, setViewMode] = useState('colored') // 'colored' | 'line'
  const [activeLayout, setActiveLayout] = useState('architectural') // architectural | electrical | plumbing | structural

  const buildPrompt = () => {
    const unit = form.plotUnit
    return `You are an expert architect and structural engineer. Generate a complete building design.

PLOT: ${form.plotWidth}${unit} × ${form.plotDepth}${unit}
BUILDING TYPE: ${form.buildingType}
FLOORS: ${form.floors}
BEDROOMS: ${form.bedrooms}
BATHROOMS: ${form.bathrooms}
CODE STANDARD: ${form.codeStd}
SPECIAL REQUIREMENTS: ${form.extras || 'None'}

Respond ONLY with a valid JSON object (no markdown, no explanation). Format:
{
  "summary": "Brief description of design",
  "totalArea": "XXX sq ft",
  "efficiency": "XX%",
  "rooms": [
    {"type": "living", "name": "Living Room", "w": 18, "h": 14, "x": 0, "y": 0, "area": "252 sq ft", "notes": "..."},
    {"type": "bedroom", "name": "Bedroom 1", "w": 12, "h": 12, "x": 18, "y": 0, "area": "144 sq ft", "notes": "..."}
  ],
  "electrical": {
    "mainPanel": "200A service panel at entry",
    "circuits": ["Kitchen: 20A dedicated", "AC: 240V dedicated", "General: 15A circuits"],
    "outlets": "Per ${form.codeStd} code requirements",
    "lighting": "LED fixtures, natural light optimization",
    "safety": ["GFCI in wet areas", "Smoke detectors", "Carbon monoxide detectors"]
  },
  "plumbing": {
    "supplyLine": "3/4 inch main supply",
    "drainage": "4 inch main drain",
    "hotWater": "Water heater location and size",
    "fixtures": ["Kitchen sink", "Bathroom fixtures"],
    "notes": "Wet areas clustered for efficiency"
  },
  "structural": {
    "foundation": "Foundation type and depth",
    "columns": "Column grid and sizes",
    "beams": "Beam sizes and spans",
    "slabs": "Slab thickness",
    "loadBearing": "Load bearing walls identified"
  },
  "safety": {
    "fire": ["Exit routes", "Fire extinguisher locations"],
    "natural_disaster": ["Earthquake: shear walls, tie beams", "Cyclone: wind bracing"],
    "electrical_safety": ["Grounding system", "Circuit breakers"],
    "plumbing_safety": ["Backflow prevention", "Pressure relief valves"]
  },
  "roomDetails": "Complete room list with dimensions in text format"
}

IMPORTANT: All room x,y,w,h values must fit within plot ${form.plotWidth}×${form.plotDepth}. Rooms must not overlap. Use feet as unit for room dimensions.`
  }

  const generate = async () => {
    if (!form.plotWidth || !form.plotDepth) return
    setLoading(true)
    setResult(null)

    try {
      const resp = await fetch(GROQ_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 3000,
          messages: [
            { role: 'system', content: 'You are an expert architect. Always respond with valid JSON only, no markdown.' },
            { role: 'user', content: buildPrompt() }
          ]
        })
      })
      const data = await resp.json()
      const text = data.choices?.[0]?.message?.content || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setResult(parsed)
    } catch (err) {
      setResult({ error: `Error: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const LAYOUT_TABS = [
    { id: 'architectural', label: 'Architectural', icon: '⬡' },
    { id: 'electrical', label: 'Electrical', icon: '⚡' },
    { id: 'plumbing', label: 'Plumbing', icon: '◉' },
    { id: 'structural', label: 'Structural', icon: '▣' },
    { id: 'safety', label: 'Safety', icon: '⚠' },
  ]

  return (
    <div className="p-5 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-white mono">Floor Plan Generator</h1>
        <p className="text-steel-500 text-xs mono">Plot size দাও → Complete building design পাও</p>
      </div>

      {/* Input form */}
      <div className="glow-border rounded-xl bg-steel-900/60 p-5 space-y-4">
        <h2 className="text-sm font-medium text-steel-300 mono">Plot & Building Info</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Plot width */}
          <div>
            <label className="text-xs text-steel-500 mono mb-1 block">Plot Width</label>
            <div className="flex gap-1">
              <input type="number" value={form.plotWidth}
                onChange={e => setForm(f => ({ ...f, plotWidth: e.target.value }))}
                placeholder="e.g. 30"
                className="flex-1 bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
          </div>

          {/* Plot depth */}
          <div>
            <label className="text-xs text-steel-500 mono mb-1 block">Plot Depth</label>
            <input type="number" value={form.plotDepth}
              onChange={e => setForm(f => ({ ...f, plotDepth: e.target.value }))}
              placeholder="e.g. 40"
              className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
          </div>

          {/* Unit */}
          <div>
            <label className="text-xs text-steel-500 mono mb-1 block">Unit</label>
            <select value={form.plotUnit} onChange={e => setForm(f => ({ ...f, plotUnit: e.target.value }))}
              className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
              <option value="ft">Feet (ft)</option>
              <option value="m">Meter (m)</option>
              <option value="katha">Katha (BD)</option>
            </select>
          </div>

          {/* Building type */}
          <div>
            <label className="text-xs text-steel-500 mono mb-1 block">Building Type</label>
            <select value={form.buildingType} onChange={e => setForm(f => ({ ...f, buildingType: e.target.value }))}
              className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
              {BUILDING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          {/* Floors */}
          <div>
            <label className="text-xs text-steel-500 mono mb-1 block">Floors</label>
            <select value={form.floors} onChange={e => setForm(f => ({ ...f, floors: e.target.value }))}
              className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Floor{n>1?'s':''}</option>)}
            </select>
          </div>

          {/* Code */}
          <div>
            <label className="text-xs text-steel-500 mono mb-1 block">Code Standard</label>
            <select value={form.codeStd} onChange={e => setForm(f => ({ ...f, codeStd: e.target.value }))}
              className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
              {CODE_STANDARDS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="text-xs text-steel-500 mono mb-1 block">Bedrooms</label>
            <select value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))}
              className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Bedroom{n>1?'s':''}</option>)}
            </select>
          </div>

          {/* Bathrooms */}
          <div>
            <label className="text-xs text-steel-500 mono mb-1 block">Bathrooms</label>
            <select value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))}
              className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n} Bathroom{n>1?'s':''}</option>)}
            </select>
          </div>
        </div>

        {/* Extra requirements */}
        <div>
          <label className="text-xs text-steel-500 mono mb-1 block">Special Requirements (optional)</label>
          <input type="text" value={form.extras}
            onChange={e => setForm(f => ({ ...f, extras: e.target.value }))}
            placeholder="e.g. garage, prayer room, servant quarter, wheelchair accessible..."
            className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
        </div>

        <button onClick={generate} disabled={loading || !form.plotWidth || !form.plotDepth}
          className="w-full py-3 bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:bg-blue-600/40 hover:text-white rounded-xl mono text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          {loading ? <span className="flex items-center justify-center gap-2">Generating design <LoadingDots /></span> : '⬡ Generate Complete Floor Plan'}
        </button>
      </div>

      {/* Error */}
      {result?.error && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-red-400 mono text-sm">{result.error}</div>
      )}

      {/* Results */}
      {result && !result.error && (
        <div className="space-y-4">

          {/* Summary bar */}
          <div className="glow-border rounded-xl bg-steel-900/60 p-4 flex flex-wrap gap-4">
            <div>
              <p className="text-steel-500 text-xs mono">Total Area</p>
              <p className="text-white font-medium mono">{result.totalArea}</p>
            </div>
            <div>
              <p className="text-steel-500 text-xs mono">Efficiency</p>
              <p className="text-green-400 font-medium mono">{result.efficiency}</p>
            </div>
            <div className="flex-1">
              <p className="text-steel-500 text-xs mono">Design Summary</p>
              <p className="text-steel-300 text-xs mono">{result.summary}</p>
            </div>
          </div>

          {/* Layout tabs */}
          <div className="flex flex-wrap gap-1">
            {LAYOUT_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveLayout(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mono transition-all border ${
                  activeLayout === t.id
                    ? 'bg-blue-600/30 border-blue-500/40 text-blue-300'
                    : 'border-steel-700/40 text-steel-400 hover:border-steel-600'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Architectural - Floor Plan */}
          {activeLayout === 'architectural' && (
            <div className="space-y-3">
              {/* View mode toggle */}
              <div className="flex items-center gap-2">
                <span className="text-steel-500 text-xs mono">View:</span>
                <div className="flex rounded-lg overflow-hidden border border-steel-600/50">
                  <button onClick={() => setViewMode('colored')}
                    className={`px-3 py-1 text-xs mono transition-all ${viewMode === 'colored' ? 'bg-blue-600/40 text-blue-300' : 'text-steel-400 hover:bg-steel-700/50'}`}>
                    Colored
                  </button>
                  <button onClick={() => setViewMode('line')}
                    className={`px-3 py-1 text-xs mono transition-all ${viewMode === 'line' ? 'bg-blue-600/40 text-blue-300' : 'text-steel-400 hover:bg-steel-700/50'}`}>
                    AutoCAD Style
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div className="glow-border rounded-xl overflow-hidden bg-steel-900/40 p-2">
                <FloorPlanCanvas
                  rooms={result.rooms}
                  plotW={parseFloat(form.plotWidth)}
                  plotH={parseFloat(form.plotDepth)}
                  mode={viewMode}
                />
              </div>

              {/* Room list */}
              <div className="glow-border rounded-xl bg-steel-900/60 p-4">
                <h3 className="text-sm font-medium text-steel-300 mono mb-3">Room Schedule</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.rooms?.map((room, i) => (
                    <div key={i} className="flex items-center justify-between bg-steel-800/40 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ background: ROOM_COLORS[room.type] || '#2a3a4a' }} />
                        <span className="text-steel-300 text-xs mono">{room.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-300 text-xs mono">{room.w}'×{room.h}'</span>
                        <span className="text-steel-500 text-xs mono ml-2">{room.area}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Electrical */}
          {activeLayout === 'electrical' && result.electrical && (
            <div className="glow-border rounded-xl bg-steel-900/60 p-5 space-y-3">
              <h3 className="text-sm font-medium text-yellow-300 mono">⚡ Electrical Layout</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-steel-500 text-xs mono mb-1">Main Panel</p>
                  <p className="text-steel-300 text-sm mono">{result.electrical.mainPanel}</p>
                </div>
                <div>
                  <p className="text-steel-500 text-xs mono mb-1">Outlets</p>
                  <p className="text-steel-300 text-sm mono">{result.electrical.outlets}</p>
                </div>
                <div>
                  <p className="text-steel-500 text-xs mono mb-1">Lighting</p>
                  <p className="text-steel-300 text-sm mono">{result.electrical.lighting}</p>
                </div>
                <div>
                  <p className="text-steel-500 text-xs mono mb-1">Circuits</p>
                  <ul className="space-y-1">
                    {result.electrical.circuits?.map((c, i) => (
                      <li key={i} className="text-steel-300 text-xs mono">• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <p className="text-steel-500 text-xs mono mb-1">Safety Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {result.electrical.safety?.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-yellow-900/20 border border-yellow-700/40 text-yellow-300 rounded text-xs mono">⚡ {s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Plumbing */}
          {activeLayout === 'plumbing' && result.plumbing && (
            <div className="glow-border rounded-xl bg-steel-900/60 p-5 space-y-3">
              <h3 className="text-sm font-medium text-blue-300 mono">◉ Plumbing Layout</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-steel-500 text-xs mono mb-1">Supply Line</p>
                  <p className="text-steel-300 text-sm mono">{result.plumbing.supplyLine}</p>
                </div>
                <div>
                  <p className="text-steel-500 text-xs mono mb-1">Drainage</p>
                  <p className="text-steel-300 text-sm mono">{result.plumbing.drainage}</p>
                </div>
                <div>
                  <p className="text-steel-500 text-xs mono mb-1">Hot Water</p>
                  <p className="text-steel-300 text-sm mono">{result.plumbing.hotWater}</p>
                </div>
                <div>
                  <p className="text-steel-500 text-xs mono mb-1">Notes</p>
                  <p className="text-steel-300 text-sm mono">{result.plumbing.notes}</p>
                </div>
              </div>
              <div>
                <p className="text-steel-500 text-xs mono mb-1">Fixtures</p>
                <div className="flex flex-wrap gap-2">
                  {result.plumbing.fixtures?.map((f, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-900/20 border border-blue-700/40 text-blue-300 rounded text-xs mono">◉ {f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Structural */}
          {activeLayout === 'structural' && result.structural && (
            <div className="glow-border rounded-xl bg-steel-900/60 p-5 space-y-3">
              <h3 className="text-sm font-medium text-purple-300 mono">▣ Structural Design</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(result.structural).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-steel-500 text-xs mono mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                    <p className="text-steel-300 text-sm mono">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety */}
          {activeLayout === 'safety' && result.safety && (
            <div className="glow-border rounded-xl bg-steel-900/60 p-5 space-y-4">
              <h3 className="text-sm font-medium text-red-300 mono">⚠ Safety & Disaster Protection</h3>
              {Object.entries(result.safety).map(([key, items]) => (
                <div key={key}>
                  <p className="text-steel-400 text-xs mono mb-2 uppercase">{key.replace(/_/g, ' ')}</p>
                  <div className="space-y-1">
                    {Array.isArray(items)
                      ? items.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-red-400 text-xs mt-0.5">⚠</span>
                            <span className="text-steel-300 text-xs mono">{item}</span>
                          </div>
                        ))
                      : <p className="text-steel-300 text-xs mono">{items}</p>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
