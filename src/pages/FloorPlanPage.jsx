import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../store'

// ─── SKETCHPAD COMPONENT ─────────────────────────────────────
const ROOM_COLORS = {
  'Living Room': '#9FB88A', 'Kitchen': '#E3A857',
  'Bedroom': '#8DA9C4', 'Dining Room': '#B98FC9', 'Bathroom': '#6FB3A0'
}
const PRIORITY = ['Living Room', 'Kitchen', 'Bedroom', 'Dining Room', 'Bathroom']

function buildCells(targetCount, W0, D0) {
  let cells = [{ x: 0, y: 0, w: W0, h: D0 }]
  let guard = 0
  while (cells.length < targetCount && guard < 300) {
    guard++
    cells.sort((a, b) => (b.w * b.h) - (a.w * a.h))
    const cell = cells.shift()
    let vertical = cell.w >= cell.h
    if (Math.random() < 0.18) vertical = !vertical
    const ratio = 0.38 + Math.random() * 0.24
    if (vertical) {
      const w1 = cell.w * ratio
      cells.push({ x: cell.x, y: cell.y, w: w1, h: cell.h })
      cells.push({ x: cell.x + w1, y: cell.y, w: cell.w - w1, h: cell.h })
    } else {
      const h1 = cell.h * ratio
      cells.push({ x: cell.x, y: cell.y, w: cell.w, h: h1 })
      cells.push({ x: cell.x, y: cell.y + h1, w: cell.w, h: cell.h - h1 })
    }
  }
  return cells
}

function fmt(n) { return Math.round(n).toLocaleString('en-US') }

function FloorPlanSketchpad() {
  const [counts, setCounts] = useState({ Bedroom: 2, Bathroom: 1, Kitchen: 1, 'Living Room': 1, 'Dining Room': 0 })
  const [totalArea, setTotalArea] = useState(1400)
  const [viewStyle, setViewStyle] = useState('blueprint')
  const [layout, setLayout] = useState(null)
  const [stats, setStats] = useState({ area: 0, rooms: 0, dims: '' })
  const svgRef = useRef(null)

  const generateLayout = useCallback(() => {
    let list = []
    PRIORITY.forEach(type => { for (let i = 0; i < (counts[type] || 0); i++) list.push(type) })
    if (list.length === 0) list = ['Living Room']
    const n = list.length
    const aspect = 1.15 + Math.random() * 0.55
    const W0 = Math.sqrt(aspect), D0 = 1 / W0
    let cells = buildCells(n, W0, D0)
    cells.sort((a, b) => (b.w * b.h) - (a.w * a.h))
    cells.forEach((c, i) => { c.type = list[i] || 'Bedroom' })
    setLayout({ leaves: cells, W0, D0 })
  }, [counts])

  useEffect(() => { generateLayout() }, [])

  useEffect(() => {
    if (!layout || !svgRef.current) return
    const factor = Math.sqrt(totalArea)
    const realW = layout.W0 * factor, realD = layout.D0 * factor
    const leaves = layout.leaves.map(c => ({
      x: c.x * factor, y: c.y * factor, w: c.w * factor, h: c.h * factor,
      type: c.type, area: c.w * c.h * totalArea
    }))

    const margin = 64, availW = 640 - margin * 2, availH = 460 - margin * 2 - 24
    const scale = Math.min(availW / realW, availH / realD)
    const offX = (640 - realW * scale) / 2, offY = (460 - realD * scale) / 2 + 8
    const px = x => offX + x * scale, py = y => offY + y * scale

    let s = ''
    if (viewStyle === 'isometric') {
      s = renderIso(realW, realD, leaves)
    } else {
      const filled = viewStyle === 'filled'
      s = `<rect x="0" y="0" width="640" height="460" fill="${filled ? '#1a2a3a' : '#0a1628'}"/>`
      if (!filled) {
        s += `<defs><pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="rgba(49,130,206,0.1)" stroke-width="1"/></pattern></defs>`
        s += `<rect x="0" y="0" width="640" height="460" fill="url(#grid)"/>`
      }
      leaves.forEach(l => {
        const x1 = px(l.x), y1 = py(l.y), w = l.w * scale, h = l.h * scale
        const fill = filled ? ROOM_COLORS[l.type] + 'cc' : 'rgba(49,130,206,0.08)'
        const stroke = filled ? '#e2e8f0' : '#63b3ed'
        s += `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${filled ? 1.5 : 1.25}"/>`
        s += `<text x="${x1 + w / 2}" y="${y1 + h / 2 - 5}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="11" font-weight="600" fill="${filled ? '#fff' : '#90cdf4'}">${l.type}</text>`
        s += `<text x="${x1 + w / 2}" y="${y1 + h / 2 + 10}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9" fill="${filled ? '#e2e8f0' : '#63b3ed'}">${fmt(l.area)} sq ft</text>`
      })
      s += `<rect x="${offX}" y="${offY}" width="${realW * scale}" height="${realD * scale}" fill="none" stroke="#f6ad55" stroke-width="2.5"/>`
      s += `<text x="${offX + realW * scale / 2}" y="${offY - 8}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="10" fill="#f6ad55">${fmt(realW)}' × ${fmt(realD)}'</text>`
      s += `<text x="610" y="24" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="12" font-weight="bold" fill="#f6ad55">N↑</text>`
    }
    svgRef.current.innerHTML = s
    setStats({ area: fmt(totalArea), rooms: leaves.length, dims: `${fmt(realW)}' × ${fmt(realD)}'` })
  }, [layout, totalArea, viewStyle])

  function renderIso(W, D, leaves) {
    const h = Math.min(W, D) * 0.32
    const isoRaw = (x, y, z) => {
      const a = Math.PI / 6
      return { x: (x - y) * Math.cos(a), y: (x + y) * Math.sin(a) - z }
    }
    const outer = [[0,0,0],[W,0,0],[W,D,0],[0,D,0],[0,0,h],[W,0,h],[W,D,h],[0,D,h]]
    const allPts = outer.map(p => isoRaw(p[0], p[1], p[2]))
    const xs = allPts.map(p => p.x), ys = allPts.map(p => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    const scale = Math.min(580 / (maxX - minX), 400 / (maxY - minY)) * 0.88
    const offX = 320 - scale * (minX + maxX) / 2, offY = 250 - scale * (minY + maxY) / 2
    const P = (x, y, z) => { const r = isoRaw(x, y, z); return [offX + r.x * scale, offY + r.y * scale] }
    const poly = arr => arr.map(p => p.join(',')).join(' ')
    let s = `<rect x="0" y="0" width="640" height="460" fill="#0a1628"/>`
    s += `<polygon points="${poly([P(0,0,0),P(W,0,0),P(W,D,0),P(0,D,0)])}" fill="rgba(49,130,206,0.05)" stroke="#334e68" stroke-width="1.5"/>`
    leaves.forEach(l => {
      const x1=l.x,y1=l.y,x2=l.x+l.w,y2=l.y+l.h
      s += `<polygon points="${poly([P(x1,y1,0),P(x2,y1,0),P(x2,y2,0),P(x1,y2,0)])}" fill="${ROOM_COLORS[l.type]}99" stroke="#e2e8f0" stroke-width="1"/>`
      const [lx,ly] = P(l.x+l.w/2, l.y+l.h/2, 1)
      s += `<text x="${lx}" y="${ly}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="10" font-weight="700" fill="#fff">${l.type}</text>`
    })
    s += `<polygon points="${poly([P(W,0,0),P(W,D,0),P(W,D,h),P(W,0,h)])}" fill="rgba(36,59,83,0.9)" stroke="#486581" stroke-width="1.5"/>`
    s += `<polygon points="${poly([P(0,D,0),P(W,D,0),P(W,D,h),P(0,D,h)])}" fill="rgba(16,42,67,0.9)" stroke="#486581" stroke-width="1.5"/>`
    s += `<polyline points="${poly([P(0,0,h),P(W,0,h),P(W,D,h),P(0,D,h),P(0,0,h)])}" fill="none" stroke="#63b3ed" stroke-width="1.5"/>`
    return s
  }

  const adjust = (type, delta) => {
    setCounts(c => ({ ...c, [type]: Math.max(0, Math.min(9, (c[type] || 0) + delta)) }))
  }

  useEffect(() => { generateLayout() }, [counts])

  const ROOMS = [
    { key: 'Bedroom', label: 'Bedroom' },
    { key: 'Bathroom', label: 'Bathroom' },
    { key: 'Kitchen', label: 'Kitchen' },
    { key: 'Living Room', label: 'Living Room' },
    { key: 'Dining Room', label: 'Dining Room' },
  ]

  return (
    <div className="glow-border rounded-xl bg-steel-900/60 p-5 space-y-4">
      <h2 className="text-sm font-medium text-steel-300 mono">⬡ Interactive Sketchpad</h2>
      <p className="text-steel-500 text-xs mono">Room count adjust করো → Generate চাপো → Blueprint/Filled/Isometric view</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Left panel */}
        <div className="space-y-2">
          <p className="text-steel-500 text-xs mono mb-2">ROOM PROGRAM</p>
          {ROOMS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1.5 border-b border-steel-700/30">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: ROOM_COLORS[key] }} />
                <span className="text-steel-300 text-xs mono">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => adjust(key, -1)}
                  className="w-5 h-5 rounded-full border border-steel-600/50 text-steel-400 hover:border-blue-400 hover:text-blue-300 text-xs flex items-center justify-center transition-all">−</button>
                <span className="text-blue-300 text-xs mono w-3 text-center">{counts[key]}</span>
                <button onClick={() => adjust(key, 1)}
                  className="w-5 h-5 rounded-full border border-steel-600/50 text-steel-400 hover:border-blue-400 hover:text-blue-300 text-xs flex items-center justify-center transition-all">+</button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <div className="flex justify-between mb-1">
              <span className="text-steel-400 text-xs mono">Gross Area</span>
              <span className="text-amber-400 text-xs mono">{fmt(totalArea)} sq ft</span>
            </div>
            <input type="range" min="400" max="4000" step="50" value={totalArea}
              onChange={e => setTotalArea(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1 cursor-pointer" />
          </div>

          <button onClick={generateLayout}
            className="w-full py-2 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 text-xs mono font-medium transition-all mt-2">
            ⟳ Generate New Layout
          </button>
        </div>

        {/* Right canvas */}
        <div className="sm:col-span-2 space-y-2">
          <div className="flex gap-1">
            {[['blueprint','Blueprint'],['filled','Filled'],['isometric','Isometric']].map(([id, label]) => (
              <button key={id} onClick={() => setViewStyle(id)}
                className={`px-3 py-1 rounded-lg text-xs mono border transition-all ${viewStyle === id ? 'bg-blue-600/30 border-blue-500/40 text-blue-300' : 'border-steel-700/40 text-steel-400 hover:border-steel-600'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-xl overflow-hidden border border-steel-700/40">
            <svg ref={svgRef} viewBox="0 0 640 460" xmlns="http://www.w3.org/2000/svg" className="w-full" />
          </div>

          <div className="flex gap-5 px-1">
            <div><span className="text-white text-sm mono font-medium">{stats.area}</span><p className="text-steel-500 text-xs mono">sq ft</p></div>
            <div><span className="text-white text-sm mono font-medium">{stats.rooms}</span><p className="text-steel-500 text-xs mono">Rooms</p></div>
            <div><span className="text-white text-sm mono font-medium">{stats.dims}</span><p className="text-steel-500 text-xs mono">Footprint</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
      if (data.error) throw new Error('Invalid API Key — Vercel এ VITE_GROQ_KEY check করো')
      const text = data.choices?.[0]?.message?.content || ''
      if (!text) throw new Error('AI response empty. Try again.')
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('AI valid JSON দেয়নি। আবার try করো।')
      const parsed = JSON.parse(jsonMatch[0])
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

      {/* Sketchpad */}
      <FloorPlanSketchpad />

      {/* AI Generator */}
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

      {/* Draftboard Sketchpad */}
      <DraftboardSketchpad />
    </div>
  )
}

// ─── DRAFTBOARD SKETCHPAD ────────────────────────────────────
function DraftboardSketchpad() {
  const svgRef = useRef(null)
  const [counts, setCounts] = useState({ Bedroom: 2, Bathroom: 1, Kitchen: 1, 'Living Room': 1, 'Dining Room': 0 })
  const [totalArea, setTotalArea] = useState(1400)
  const [viewStyle, setViewStyle] = useState('blueprint')
  const [stats, setStats] = useState({ area: '1,400', rooms: 0, dims: '' })
  const layoutRef = useRef(null)

  const ROOM_COLORS = {
    'Living Room': '#9FB88A', 'Kitchen': '#E3A857',
    'Bedroom': '#8DA9C4', 'Dining Room': '#B98FC9', 'Bathroom': '#6FB3A0'
  }
  const PRIORITY = ['Living Room', 'Kitchen', 'Bedroom', 'Dining Room', 'Bathroom']
  const fmt = n => Math.round(n).toLocaleString('en-US')

  const buildCells = (n, W0, D0) => {
    let cells = [{ x: 0, y: 0, w: W0, h: D0 }]
    let guard = 0
    while (cells.length < n && guard < 300) {
      guard++
      cells.sort((a, b) => (b.w * b.h) - (a.w * a.h))
      const cell = cells.shift()
      let vertical = cell.w >= cell.h
      if (Math.random() < 0.18) vertical = !vertical
      const ratio = 0.38 + Math.random() * 0.24
      if (vertical) {
        const w1 = cell.w * ratio
        cells.push({ x: cell.x, y: cell.y, w: w1, h: cell.h })
        cells.push({ x: cell.x + w1, y: cell.y, w: cell.w - w1, h: cell.h })
      } else {
        const h1 = cell.h * ratio
        cells.push({ x: cell.x, y: cell.y, w: cell.w, h: h1 })
        cells.push({ x: cell.x, y: cell.y + h1, w: cell.w, h: cell.h - h1 })
      }
    }
    return cells
  }

  const renderSVG = useCallback((layout, area, style) => {
    if (!layout || !svgRef.current) return
    const factor = Math.sqrt(area)
    const realW = layout.W0 * factor, realD = layout.D0 * factor
    const leaves = layout.leaves.map(c => ({
      x: c.x*factor, y: c.y*factor, w: c.w*factor, h: c.h*factor,
      type: c.type, area: c.w*c.h*area
    }))

    const isoRaw = (x, y, z) => {
      const a = Math.PI / 6
      return { x: (x - y) * Math.cos(a), y: (x + y) * Math.sin(a) - z }
    }

    let s = ''
    if (style === 'isometric') {
      const h = Math.min(realW, realD) * 0.32
      const outer = [[0,0,0],[realW,0,0],[realW,realD,0],[0,realD,0],[0,0,h],[realW,0,h],[realW,realD,h],[0,realD,h]]
      const allPts = outer.map(p => isoRaw(p[0], p[1], p[2]))
      const xs = allPts.map(p => p.x), ys = allPts.map(p => p.y)
      const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys)
      const sc = Math.min(580/(maxX-minX), 400/(maxY-minY)) * 0.9
      const ox = 320 - sc*(minX+maxX)/2, oy = 230 - sc*(minY+maxY)/2
      const P = (x,y,z) => { const r=isoRaw(x,y,z); return [ox+r.x*sc, oy+r.y*sc] }
      const poly = arr => arr.map(p=>p.join(',')).join(' ')
      s = '<rect x="0" y="0" width="640" height="460" fill="#0a1628"/>'
      s += `<polygon points="${poly([P(0,0,0),P(realW,0,0),P(realW,realD,0),P(0,realD,0)])}" fill="rgba(49,130,206,0.1)" stroke="#63b3ed" stroke-width="2"/>`
      leaves.forEach(l => {
        const x2=l.x+l.w, y2=l.y+l.h
        s += `<polygon points="${poly([P(l.x,l.y,0),P(x2,l.y,0),P(x2,y2,0),P(l.x,y2,0)])}" fill="${ROOM_COLORS[l.type]}99" stroke="#63b3ed" stroke-width="1.2"/>`
        const [lx,ly] = P(l.x+l.w/2, l.y+l.h/2, 2)
        s += `<text x="${lx}" y="${ly-3}" text-anchor="middle" font-family="monospace" font-size="10" font-weight="700" fill="#e2e8f0">${l.type}</text>`
        s += `<text x="${lx}" y="${ly+11}" text-anchor="middle" font-family="monospace" font-size="9" fill="#90cdf4">${fmt(l.area)} sq ft</text>`
      })
      s += `<polygon points="${poly([P(realW,0,0),P(realW,realD,0),P(realW,realD,h),P(realW,0,h)])}" fill="rgba(36,59,83,0.9)" stroke="#63b3ed" stroke-width="1.5"/>`
      s += `<polygon points="${poly([P(0,realD,0),P(realW,realD,0),P(realW,realD,h),P(0,realD,h)])}" fill="rgba(43,76,107,0.9)" stroke="#63b3ed" stroke-width="1.5"/>`
    } else {
      const margin = 64
      const sc = Math.min((640-margin*2)/realW, (400-margin*2)/realD)
      const ox = (640-realW*sc)/2, oy = (460-realD*sc)/2
      const px = x => ox+x*sc, py = y => oy+y*sc
      const filled = style === 'filled'
      s = '<rect x="0" y="0" width="640" height="460" fill="#0a1628"/>'
      if (!filled) s += '<defs><pattern id="grd" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="rgba(49,130,206,0.12)" stroke-width="1"/></pattern></defs><rect x="0" y="0" width="640" height="460" fill="url(#grd)"/>'
      leaves.forEach(l => {
        const x1=px(l.x), y1=py(l.y), w=l.w*sc, h=l.h*sc
        s += `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" fill="${filled ? ROOM_COLORS[l.type]+'bb' : 'rgba(49,130,206,0.08)'}" stroke="#63b3ed" stroke-width="1.5"/>`
        s += `<text x="${x1+w/2}" y="${y1+h/2-4}" text-anchor="middle" font-family="monospace" font-size="11" font-weight="600" fill="#e2e8f0">${l.type}</text>`
        s += `<text x="${x1+w/2}" y="${y1+h/2+11}" text-anchor="middle" font-family="monospace" font-size="9" fill="#90cdf4">${fmt(l.area)} sq ft</text>`
      })
      s += `<rect x="${ox}" y="${oy}" width="${realW*sc}" height="${realD*sc}" fill="none" stroke="#f6ad55" stroke-width="2.5"/>`
      s += `<text x="${ox+realW*sc/2}" y="${oy-10}" text-anchor="middle" font-family="monospace" font-size="10" fill="#90cdf4">${fmt(realW)}'</text>`
      s += `<text x="${ox-14}" y="${oy+realD*sc/2}" text-anchor="middle" font-family="monospace" font-size="10" fill="#90cdf4" transform="rotate(-90 ${ox-14} ${oy+realD*sc/2})">${fmt(realD)}'</text>`
      s += `<text x="615" y="28" text-anchor="middle" font-family="monospace" font-size="11" font-weight="700" fill="#f6ad55">N↑</text>`
    }
    svgRef.current.innerHTML = s
    setStats({ area: fmt(area), rooms: leaves.length, dims: `${fmt(realW)}' × ${fmt(realD)}'` })
  }, [])

  const generateLayout = useCallback((c, a, style) => {
    const roomList = []
    PRIORITY.forEach(type => { for (let i=0; i<(c[type]||0); i++) roomList.push(type) })
    if (!roomList.length) roomList.push('Living Room')
    const aspect = 1.15 + Math.random()*0.55
    const W0 = Math.sqrt(aspect), D0 = 1/W0
    let cells = buildCells(roomList.length, W0, D0)
    cells.sort((a,b) => (b.w*b.h)-(a.w*a.h))
    cells.forEach((cell, i) => { cell.type = roomList[i] || 'Bedroom' })
    const layout = { leaves: cells, W0, D0 }
    layoutRef.current = layout
    renderSVG(layout, a, style)
  }, [renderSVG])

  useEffect(() => { generateLayout(counts, totalArea, viewStyle) }, [])

  const updateCount = (type, delta) => {
    const nc = { ...counts, [type]: Math.max(0, Math.min(9, (counts[type]||0)+delta)) }
    setCounts(nc)
    generateLayout(nc, totalArea, viewStyle)
  }

  const handleArea = val => {
    setTotalArea(val)
    if (layoutRef.current) renderSVG(layoutRef.current, val, viewStyle)
  }

  const handleStyle = s => {
    setViewStyle(s)
    if (layoutRef.current) renderSVG(layoutRef.current, totalArea, s)
  }

  const ROOM_ROWS = [
    { type: 'Bedroom', color: '#8DA9C4' },
    { type: 'Bathroom', color: '#6FB3A0' },
    { type: 'Kitchen', color: '#E3A857' },
    { type: 'Living Room', color: '#9FB88A' },
    { type: 'Dining Room', color: '#B98FC9' },
  ]

  return (
    <div className="glow-border rounded-xl bg-steel-900/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-amber-400">◈</span>
        <h2 className="text-sm font-semibold text-white mono">Manual Sketchpad</h2>
        <span className="text-steel-500 text-xs mono">— room বাড়িয়ে কমিয়ে instantly দেখো</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <div className="glow-border rounded-xl p-3 space-y-2">
            <p className="text-steel-500 text-xs mono mb-2">ROOM PROGRAM</p>
            {ROOM_ROWS.map(({ type, color }) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-steel-300 text-xs mono">{type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateCount(type, -1)} className="w-6 h-6 rounded-full border border-steel-600/50 text-steel-300 hover:border-blue-500/50 hover:text-blue-300 flex items-center justify-center transition-all text-sm">−</button>
                  <span className="text-white text-xs mono w-4 text-center">{counts[type]}</span>
                  <button onClick={() => updateCount(type, 1)} className="w-6 h-6 rounded-full border border-steel-600/50 text-steel-300 hover:border-blue-500/50 hover:text-blue-300 flex items-center justify-center transition-all text-sm">+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="glow-border rounded-xl p-3">
            <div className="flex justify-between mb-2">
              <span className="text-steel-500 text-xs mono">Gross Area</span>
              <span className="text-amber-400 text-xs mono">{totalArea.toLocaleString()} sq ft</span>
            </div>
            <input type="range" min="400" max="4000" step="50" value={totalArea}
              onChange={e => handleArea(parseInt(e.target.value))}
              className="w-full" style={{ accentColor: '#f6ad55' }} />
          </div>
          <button onClick={() => generateLayout(counts, totalArea, viewStyle)}
            className="w-full py-2.5 rounded-xl border border-amber-500/40 bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 text-xs mono font-medium transition-all">
            ↻ Generate New Layout
          </button>
          <div className="grid grid-cols-3 gap-2">
            {[['Area', stats.area+' ft²'],['Rooms', stats.rooms],['Dims', stats.dims]].map(([label, val]) => (
              <div key={label} className="bg-steel-800/40 rounded-lg px-2 py-2 text-center">
                <p className="text-white text-xs mono font-medium">{val}</p>
                <p className="text-steel-500 text-xs mono">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-2">
          <div className="flex gap-1">
            {[['blueprint','Blueprint'],['filled','Filled'],['isometric','Isometric']].map(([id, label]) => (
              <button key={id} onClick={() => handleStyle(id)}
                className={`px-3 py-1.5 rounded-lg text-xs mono border transition-all ${viewStyle===id ? 'bg-blue-600/30 border-blue-500/40 text-blue-300' : 'border-steel-700/40 text-steel-400 hover:border-steel-600'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="rounded-xl overflow-hidden border border-steel-700/40" style={{ background: '#0a1628' }}>
            <svg ref={svgRef} viewBox="0 0 640 460" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
