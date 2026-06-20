import { useState } from 'react'
import { structural, foundation, rebarData } from '../utils/calculations'
import { useAppStore } from '../store'

function ResultBox({ label, value, sub }) {
  return (
    <div className="bg-steel-800/40 rounded-lg px-3 py-2">
      <p className="text-steel-500 text-xs mono">{label}</p>
      <p className="text-blue-300 font-medium mono text-sm">{value}</p>
      {sub && <p className="text-steel-500 text-xs mono mt-0.5">{sub}</p>}
    </div>
  )
}

export default function CalculatorPage() {
  const { codeStandard } = useAppStore()
  const [activeTab, setActiveTab] = useState('beam')

  // safe number parser
  const toNum = (v) => {
    const n = Number(v)
    return isNaN(n) ? null : n
  }

  // Beam
  const [beamSpan, setBeamSpan] = useState('')
  const [beamCond, setBeamCond] = useState('simply_supported')

  const beamResult =
    toNum(beamSpan) !== null
      ? structural.beamDepthRuleOfThumb(toNum(beamSpan), beamCond)
      : null

  // Column
  const [colLoad, setColLoad] = useState('')
  const [fc, setFc] = useState('4000')
  const [fy, setFy] = useState('60000')

  const colResult =
    toNum(colLoad) !== null
      ? structural.minColumnSize(
          toNum(colLoad),
          toNum(fc),
          toNum(fy)
        )
      : null

  // Slab
  const [slabSpan, setSlabSpan] = useState('')
  const [slabType, setSlabType] = useState('two_way')

  const slabResult =
    toNum(slabSpan) !== null
      ? structural.slabThickness(toNum(slabSpan), slabType)
      : null

  // Footing
  const [footLoad, setFootLoad] = useState('')
  const [soilCap, setSoilCap] = useState('2.0')

  const footResult =
    toNum(footLoad) !== null && toNum(soilCap) !== null
      ? foundation.isolatedFooting({
          axialLoad_kip: toNum(footLoad),
          soilCapacity_ksf: toNum(soilCap),
        })
      : null

  // Rebar
  const [rebarSize, setRebarSize] = useState('#5')
  const [rebarCount, setRebarCount] = useState('')

  const rebarSystem = codeStandard === 'ACI318' ? 'US' : 'Metric'

  const rebarSizes = Object.keys(rebarData?.[rebarSystem] || {})

  const rebarBar = rebarData?.[rebarSystem]?.[rebarSize] || null

  const count = toNum(rebarCount)

  const rebarResult =
    count !== null
      ? rebarData.totalArea(rebarSize, count, rebarSystem)
      : null

  const tabs = [
    { id: 'beam', label: 'Beam Depth' },
    { id: 'column', label: 'Column Size' },
    { id: 'slab', label: 'Slab Thickness' },
    { id: 'footing', label: 'Footing Size' },
    { id: 'rebar', label: 'Rebar Area' },
  ]

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-white mono">
          Structural Calculator
        </h1>
        <p className="text-steel-500 text-xs mono">
          {codeStandard === 'ACI318' ? 'ACI 318-19' : 'BNBC 2020'} · Quick design checks
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs mono transition-all ${
              activeTab === t.id
                ? 'bg-blue-600/30 border border-blue-500/40 text-blue-300'
                : 'text-steel-400 hover:text-steel-200 border border-steel-700/50 hover:border-steel-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glow-border rounded-xl bg-steel-900/60 p-5 space-y-4">

        {/* Beam */}
        {activeTab === 'beam' && beamResult && (
          <>
            <ResultBox label="Min Depth (in)" value={`${beamResult.min_depth_in} in`} />
            <ResultBox label="Min Depth (cm)" value={`${beamResult.min_depth_cm} cm`} />
            <ResultBox label="Span/Depth Ratio" value={`L/${beamResult.span_to_depth_ratio}`} />
          </>
        )}

        {/* Column */}
        {activeTab === 'column' && colResult && (
          <>
            <ResultBox label="Required Ag" value={`${colResult.required_Ag_in2} in²`} />
            <ResultBox label="Min Side" value={`${colResult.min_side_in} in`} />
            <ResultBox label="Recommended" value={colResult.recommended_size} />
          </>
        )}

        {/* Slab */}
        {activeTab === 'slab' && slabResult && (
          <>
            <ResultBox label="Min Thickness (in)" value={`${slabResult.min_thickness_in} in`} />
            <ResultBox label="Min Thickness (mm)" value={`${slabResult.min_thickness_mm} mm`} />
          </>
        )}

        {/* Footing */}
        {activeTab === 'footing' && footResult && (
          <>
            <ResultBox label="Required Area" value={`${footResult.required_area_ft2} ft²`} />
            <ResultBox label="Min Side" value={`${footResult.min_side_ft} ft`} />
            <ResultBox label="Recommended" value={footResult.recommended_size} />
          </>
        )}

        {/* Rebar */}
        {activeTab === 'rebar' && rebarBar && (
          <>
            <ResultBox
              label="Diameter"
              value={
                rebarSystem === 'US'
                  ? `${rebarBar.diameter_in} in (${rebarBar.diameter_mm} mm)`
                  : `${rebarBar.diameter_mm} mm`
              }
            />

            <ResultBox
              label="Area per bar"
              value={
                rebarSystem === 'US'
                  ? `${rebarBar.area_in2} in²`
                  : `${rebarBar.area_mm2} mm²`
              }
            />

            {rebarResult && (
              <ResultBox
                label="Total Area"
                value={`${rebarResult.totalArea.toFixed(2)} ${rebarResult.unit}`}
              />
            )}
          </>
        )}

      </div>
    </div>
  )
}
