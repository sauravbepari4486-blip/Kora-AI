import { useState } from 'react'
import { convert, elevation } from '../utils/calculations'

const UNIT_OPTIONS = ['ft', 'in', 'cm', 'mm', 'm']

export default function UnitConverterPage() {
  const [value, setValue] = useState('')
  const [fromUnit, setFromUnit] = useState('ft')
  const [feetInput, setFeetInput] = useState('')
  const [inchInput, setInchInput] = useState('')

  // RL/EL/GL
  const [gl, setGl] = useState('')
  const [el, setEl] = useState('')

  const results = value && !isNaN(parseFloat(value))
    ? convert.toAllUnits(parseFloat(value), fromUnit)
    : null

  const feetInchResult = (feetInput || inchInput)
    ? (() => {
        const ft = parseFloat(feetInput) || 0
        const inch = parseFloat(inchInput) || 0
        const totalFt = ft + inch / 12
        return convert.toAllUnits(totalFt, 'ft')
      })()
    : null

  const elevResult = (gl && el && !isNaN(gl) && !isNaN(el))
    ? elevation.depthFromGL(parseFloat(gl), parseFloat(el))
    : null

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white mono">Unit Converter</h1>
        <p className="text-steel-500 text-xs mono">ft · in · cm · mm · m — RL/EL/GL depth</p>
      </div>

      {/* Simple converter */}
      <div className="glow-border rounded-xl bg-steel-900/60 p-5">
        <h2 className="text-sm font-medium text-steel-300 mono mb-3">Quick Convert</h2>
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Enter value"
            className="flex-1 bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50"
          />
          <select
            value={fromUnit}
            onChange={e => setFromUnit(e.target.value)}
            className="bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50"
          >
            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        {results && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Feet-Inch', value: results.ftFormatted },
              { label: 'Decimal ft', value: `${results.ft} ft` },
              { label: 'Inches', value: `${results.in}"` },
              { label: 'Centimeters', value: `${results.cm} cm` },
              { label: 'Millimeters', value: `${results.mm} mm` },
              { label: 'Meters', value: `${results.m} m` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-steel-800/40 rounded-lg px-3 py-2">
                <p className="text-steel-500 text-xs mono">{label}</p>
                <p className="text-blue-300 font-medium mono text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feet-Inch entry */}
      <div className="glow-border rounded-xl bg-steel-900/60 p-5">
        <h2 className="text-sm font-medium text-steel-300 mono mb-3">Feet-Inch Entry</h2>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-steel-500 mono mb-1 block">Feet</label>
            <input type="number" value={feetInput} onChange={e => setFeetInput(e.target.value)}
              placeholder="0" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-steel-500 mono mb-1 block">Inches</label>
            <input type="number" value={inchInput} onChange={e => setInchInput(e.target.value)}
              placeholder="0" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
        </div>

        {feetInchResult && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Formatted', value: feetInchResult.ftFormatted },
              { label: 'Inches', value: `${feetInchResult.in}"` },
              { label: 'cm', value: `${feetInchResult.cm} cm` },
              { label: 'mm', value: `${feetInchResult.mm} mm` },
              { label: 'm', value: `${feetInchResult.m} m` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-steel-800/40 rounded-lg px-3 py-2">
                <p className="text-steel-500 text-xs mono">{label}</p>
                <p className="text-blue-300 font-medium mono text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RL/EL/GL depth */}
      <div className="glow-border rounded-xl bg-steel-900/60 p-5">
        <h2 className="text-sm font-medium text-steel-300 mono mb-1">RL / EL / GL Depth Calculator</h2>
        <p className="text-steel-500 text-xs mono mb-3">Enter as decimal feet (e.g. GL = 0, EL = -3.5)</p>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-steel-500 mono mb-1 block">GL (Grade Level) ft</label>
            <input type="number" value={gl} onChange={e => setGl(e.target.value)}
              placeholder="e.g. 0" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-steel-500 mono mb-1 block">EL (Bottom) ft</label>
            <input type="number" value={el} onChange={e => setEl(e.target.value)}
              placeholder="e.g. -3.5" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
        </div>

        {elevResult && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Depth (ft-in)', value: elevResult.formatted },
              { label: 'Depth (ft)', value: `${elevResult.depth_ft} ft` },
              { label: 'Depth (in)', value: `${elevResult.depth_in}"` },
              { label: 'Depth (cm)', value: `${elevResult.depth_cm} cm` },
              { label: 'Depth (mm)', value: `${elevResult.depth_mm} mm` },
              { label: 'Depth (m)', value: `${elevResult.depth_m} m` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-steel-800/40 rounded-lg px-3 py-2">
                <p className="text-steel-500 text-xs mono">{label}</p>
                <p className="text-amber-300 font-medium mono text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
