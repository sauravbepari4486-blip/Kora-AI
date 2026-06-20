import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store'

export default function LoginPage() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [phase, setPhase] = useState(0) // 0=anim, 1=typed, 2=form
  const [typed, setTyped] = useState('')
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const login = useAppStore(s => s.login)
  const TITLE = 'KORA AI'

  // ── 3D Grid canvas animation ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let t = 0
    let frame

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Dark bg
      ctx.fillStyle = '#060f1e'
      ctx.fillRect(0, 0, W, H)

      // ── 3D perspective grid ──
      const ROWS = 20, COLS = 24
      const vanishX = W / 2, vanishY = H * 0.42
      const gridW = W * 1.4, gridH = H * 0.6
      const startX = (W - gridW) / 2, startY = vanishY

      // Horizontal lines (perspective)
      for (let r = 0; r <= ROWS; r++) {
        const progress = r / ROWS
        const ease = progress * progress
        const y = vanishY + ease * gridH
        const xLeft = vanishX - (vanishX - startX) * ease
        const xRight = vanishX + (W - vanishX - (W - startX - gridW)) * ease
        const alpha = Math.max(0, 0.6 - ease * 0.4) * (0.4 + 0.6 * Math.min(1, t / 60))
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.03 - r * 0.3)
        ctx.strokeStyle = r % 5 === 0
          ? `rgba(99,179,237,${alpha * pulse * 1.5})`
          : `rgba(49,130,206,${alpha * 0.5})`
        ctx.lineWidth = r % 5 === 0 ? 1.2 : 0.5
        ctx.beginPath(); ctx.moveTo(xLeft, y); ctx.lineTo(xRight, y); ctx.stroke()
      }

      // Vertical lines (perspective)
      for (let c = 0; c <= COLS; c++) {
        const progress = c / COLS
        const xBottom = startX + progress * gridW
        const alpha = (0.15 + 0.3 * Math.sin(t * 0.02 + c * 0.2)) * Math.min(1, t / 80)
        const isMajor = c % 6 === 0
        ctx.strokeStyle = isMajor ? `rgba(99,179,237,${alpha * 2})` : `rgba(49,130,206,${alpha})`
        ctx.lineWidth = isMajor ? 1 : 0.4
        ctx.beginPath(); ctx.moveTo(vanishX, vanishY); ctx.lineTo(xBottom, vanishY + gridH); ctx.stroke()
      }

      // ── Structural frame wireframe ──
      if (t > 40) {
        const progress = Math.min(1, (t - 40) / 80)
        const fW = W * 0.55, fH = H * 0.32
        const fX = (W - fW) / 2, fY = H * 0.05

        // Main frame lines
        const frameLines = [
          [fX, fY + fH, fX + fW, fY + fH],           // base
          [fX, fY, fX + fW, fY],                       // top
          [fX, fY, fX, fY + fH],                       // left
          [fX + fW, fY, fX + fW, fY + fH],             // right
          [fX + fW * 0.33, fY, fX + fW * 0.33, fY + fH], // col1
          [fX + fW * 0.66, fY, fX + fW * 0.66, fY + fH], // col2
          [fX, fY + fH * 0.5, fX + fW, fY + fH * 0.5],   // mid beam
        ]

        frameLines.forEach(([x1, y1, x2, y2], i) => {
          const lineP = Math.min(1, progress * frameLines.length - i * 0.8)
          if (lineP <= 0) return
          const ex = x1 + (x2 - x1) * lineP
          const ey = y1 + (y2 - y1) * lineP
          ctx.strokeStyle = `rgba(99,179,237,${0.7 * Math.min(1, lineP * 3)})`
          ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke()
        })

        // Column boxes
        if (progress > 0.7) {
          const colP = (progress - 0.7) / 0.3
          const cols = [[fX, fY], [fX + fW * 0.33, fY], [fX + fW * 0.66, fY], [fX + fW, fY],
                        [fX, fY + fH], [fX + fW * 0.33, fY + fH], [fX + fW * 0.66, fY + fH], [fX + fW, fY + fH]]
          cols.forEach(([cx, cy]) => {
            ctx.fillStyle = `rgba(43,108,176,${0.8 * colP})`
            ctx.strokeStyle = `rgba(99,179,237,${colP})`
            ctx.lineWidth = 1
            ctx.fillRect(cx - 5, cy - 5, 10, 10)
            ctx.strokeRect(cx - 5, cy - 5, 10, 10)
          })
        }

        // Dimension annotations
        if (progress > 0.85) {
          const annP = (progress - 0.85) / 0.15
          ctx.fillStyle = `rgba(144,205,244,${annP * 0.9})`
          ctx.font = `${Math.round(9 * annP)}px JetBrains Mono, monospace`
          ctx.textAlign = 'center'
          ctx.fillText("STRUCTURAL FRAME", W / 2, fY - 10)
          ctx.font = `8px JetBrains Mono, monospace`
          ctx.fillStyle = `rgba(246,173,85,${annP * 0.8})`
          ctx.fillText(`W=${Math.round(fW)}'  H=${Math.round(fH)}'`, W / 2, fY + fH + 18)
        }
      }

      // ── Scan line ──
      const scanY = vanishY + ((t * 3) % (gridH + 20)) - 10
      const scanGrad = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3)
      scanGrad.addColorStop(0, 'transparent')
      scanGrad.addColorStop(0.5, `rgba(99,179,237,${0.3 * Math.min(1, t / 30)})`)
      scanGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 3, W, 6)

      // ── Corner decorations ──
      const corners = [[20, 20, 1, 1], [W - 20, 20, -1, 1], [20, H - 20, 1, -1], [W - 20, H - 20, -1, -1]]
      const cornAlpha = Math.min(1, t / 60)
      corners.forEach(([x, y, dx, dy]) => {
        ctx.strokeStyle = `rgba(99,179,237,${cornAlpha * 0.5})`
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * 20, y); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + dy * 20); ctx.stroke()
      })

      t++

      // After 120 frames start typing
      if (t === 100) setPhase(1)
      frame = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [])

  // ── Typing animation ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 1) return
    let i = 0
    const t = setInterval(() => {
      setTyped(TITLE.slice(0, ++i))
      if (i >= TITLE.length) { clearInterval(t); setTimeout(() => setPhase(2), 400) }
    }, 100)
    return () => clearInterval(t)
  }, [phase])

  const handleSubmit = e => {
    e.preventDefault()
    if (!login(pw)) { setErr('Access denied. Invalid password.'); setPw(''); setTimeout(() => setErr(''), 3000) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#060f1e' }}>
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="border border-blue-500/20 rounded-2xl backdrop-blur-sm p-8 relative"
          style={{ background: 'rgba(6,15,30,0.85)', boxShadow: '0 0 60px rgba(49,130,206,0.08)' }}>

          {/* Corner decorations */}
          {[['-top-px -left-px','border-t-2 border-l-2','rounded-tl-2xl'],
            ['-top-px -right-px','border-t-2 border-r-2','rounded-tr-2xl'],
            ['-bottom-px -left-px','border-b-2 border-l-2','rounded-bl-2xl'],
            ['-bottom-px -right-px','border-b-2 border-r-2','rounded-br-2xl']
          ].map(([pos, border, radius], i) => (
            <div key={i} className={`absolute ${pos} w-5 h-5 ${border} ${radius} border-blue-400/60`} />
          ))}

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 border border-blue-500/50 rounded flex items-center justify-center"
                style={{ background: 'rgba(49,130,206,0.2)' }}>
                <span className="text-blue-400 font-bold mono text-sm">K</span>
              </div>
              <h1 className="text-3xl font-bold tracking-widest mono" style={{ color: '#e2e8f0' }}>
                {typed}
                {phase < 2 && <span className="text-blue-400 animate-pulse">|</span>}
              </h1>
            </div>
            {phase >= 2 && (
              <p className="text-xs mono animate-fade-up" style={{ color: '#627d98' }}>
                Structural Engineering AI Assistant
              </p>
            )}
          </div>

          {/* Form */}
          {phase >= 2 && (
            <form onSubmit={handleSubmit} className="space-y-3 animate-fade-up">
              <div className="relative">
                <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                  placeholder="Enter access password" autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm mono outline-none transition-all"
                  style={{
                    background: 'rgba(16,42,67,0.8)',
                    border: '1px solid rgba(49,130,206,0.3)',
                    color: '#e2e8f0',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,179,237,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(49,130,206,0.3)'}
                />
              </div>
              {err && <p className="text-red-400 text-xs mono text-center">{err}</p>}
              <button type="submit"
                className="w-full py-3 rounded-xl mono text-sm font-medium transition-all"
                style={{
                  background: 'rgba(49,130,206,0.15)',
                  border: '1px solid rgba(49,130,206,0.4)',
                  color: '#90cdf4',
                }}
                onMouseEnter={e => { e.target.style.background = 'rgba(49,130,206,0.3)'; e.target.style.color = '#fff' }}
                onMouseLeave={e => { e.target.style.background = 'rgba(49,130,206,0.15)'; e.target.style.color = '#90cdf4' }}>
                ACCESS SYSTEM →
              </button>
              <p className="text-center text-xs mono" style={{ color: '#334e68' }}>
                ACI 318-19 · BNBC 2020 · Personal License
              </p>
            </form>
          )}
        </div>
        <p className="text-center text-xs mono mt-3" style={{ color: '#243b53' }}>
          v2.0 · Kora AI · Rajdip · Engineering Assistant
        </p>
      </div>
    </div>
  )
}
