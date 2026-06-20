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

  // Beam state
  const [beamSpan, setBeamSpan] = useState('')
  const [beamCond, setBeamCond] = useState('simply_supported')
  const beamResult = beamSpan ? structural.beamDepthRuleOfThumb(parseFloat(beamSpan), beamCond) : null

  // Column state
  const [colLoad, setColLoad] = useState('')
  const [fc, setFc] = useState('4000')
  const [fy, setFy] = useState('60000')
  const colResult = colLoad ? structural.minColumnSize(parseFloat(colLoad), parseFloat(fc), parseFloat(fy)) : null

  // Slab state
  const [slabSpan, setSlabSpan] = useState('')
  const [slabType, setSlabType] = useState('two_way')
  const slabResult = slabSpan ? structural.slabThickness(parseFloat(slabSpan), slabType) : null

  // Footing state
  const [footLoad, setFootLoad] = useState('')
  const [soilCap, setSoilCap] = useState('2.0')
  const footResult = footLoad ? foundation.isolatedFooting({ axialLoad_kip: parseFloat(footLoad), soilCapacity_ksf: parseFloat(soilCap) }) : null

  // Rebar state
  const [rebarSize, setRebarSize] = useState('#5')
  const [rebarCount, setRebarCount] = useState('')
  const rebarSystem = codeStandard === 'ACI318' ? 'US' : 'Metric'
  const rebarSizes = Object.keys(rebarData[rebarSystem])
  const rebarResult = rebarCount ? rebarData.totalArea(rebarSize, parseInt(rebarCount), rebarSystem) : null
  const rebarBar = rebarData[rebarSystem][rebarSize]

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
        <h1 className="text-lg font-semibold text-white mono">Structural Calculator</h1>
        <p className="text-steel-500 text-xs mono">{codeStandard === 'ACI318' ? 'ACI 318-19' : 'BNBC 2020'} · Quick design checks</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs mono transition-all ${
              activeTab === t.id
                ? 'bg-blue-600/30 border border-blue-500/40 text-blue-300'
                : 'text-steel-400 hover:text-steel-200 border border-steel-700/50 hover:border-steel-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="glow-border rounded-xl bg-steel-900/60 p-5 space-y-4">

        {/* Beam depth */}
        {activeTab === 'beam' && (
          <>
            <h2 className="text-sm font-medium text-steel-300 mono">Minimum Beam Depth (ACI 318-19 Table 9.3.1.1)</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">Span (ft)</label>
                <input type="number" value={beamSpan} onChange={e => setBeamSpan(e.target.value)}
                  placeholder="e.g. 20" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">Condition</label>
                <select value={beamCond} onChange={e => setBeamCond(e.target.value)}
                  className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="simply_supported">Simply Supported</option>
                  <option value="one_end_continuous">One End Continuous</option>
                  <option value="both_ends_continuous">Both Ends Continuous</option>
                  <option value="cantilever">Cantilever</option>
                </select>
              </div>
            </div>
            {beamResult && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <ResultBox label="Min Depth (in)" value={`${beamResult.min_depth_in}"`} />
                <ResultBox label="Min Depth (cm)" value={`${beamResult.min_depth_cm} cm`} />
                <ResultBox label="Span/Depth ratio" value={`L/${beamResult.span_to_depth_ratio}`} />
                <div className="col-span-full bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2">
                  <p className="text-blue-400 text-xs mono">{beamResult.note}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Column size */}
        {activeTab === 'column' && (
          <>
            <h2 className="text-sm font-medium text-steel-300 mono">Min Column Size (ACI 318-19 §22.4.2)</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">Axial Load (kip)</label>
                <input type="number" value={colLoad} onChange={e => setColLoad(e.target.value)}
                  placeholder="e.g. 200" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">f'c (psi)</label>
                <select value={fc} onChange={e => setFc(e.target.value)}
                  className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="3000">3000 psi</option>
                  <option value="4000">4000 psi</option>
                  <option value="5000">5000 psi</option>
                  <option value="6000">6000 psi</option>
                </select>
              </div>
            </div>
            {colResult && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <ResultBox label="Required Ag" value={`${colResult.required_Ag_in2} in²`} />
                <ResultBox label="Min Side" value={`${colResult.min_side_in}"`} />
                <ResultBox label="Recommended" value={colResult.recommended_size} />
                <div className="col-span-full bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2">
                  <p className="text-blue-400 text-xs mono">{colResult.note}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Slab thickness */}
        {activeTab === 'slab' && (
          <>
            <h2 className="text-sm font-medium text-steel-300 mono">Min Slab Thickness (ACI 318-19)</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">Span (ft)</label>
                <input type="number" value={slabSpan} onChange={e => setSlabSpan(e.target.value)}
                  placeholder="e.g. 15" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">Slab Type</label>
                <select value={slabType} onChange={e => setSlabType(e.target.value)}
                  className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="two_way">Two-way slab</option>
                  <option value="one_way">One-way slab</option>
                </select>
              </div>
            </div>
            {slabResult && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <ResultBox label="Min Thickness (in)" value={`${slabResult.min_thickness_in}"`} />
                <ResultBox label="Min Thickness (cm)" value={`${slabResult.min_thickness_cm} cm`} />
                <ResultBox label="Min Thickness (mm)" value={`${slabResult.min_thickness_mm} mm`} />
                <div className="col-span-full bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2">
                  <p className="text-blue-400 text-xs mono">{slabResult.note}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footing size */}
        {activeTab === 'footing' && (
          <>
            <h2 className="text-sm font-medium text-steel-300 mono">Isolated Footing Sizing</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">Column Load (kip)</label>
                <input type="number" value={footLoad} onChange={e => setFootLoad(e.target.value)}
                  placeholder="e.g. 150" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">Soil Capacity (ksf)</label>
                <input type="number" value={soilCap} onChange={e => setSoilCap(e.target.value)}
                  placeholder="e.g. 2.0" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            {footResult && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <ResultBox label="Required Area" value={`${footResult.required_area_ft2} ft²`} />
                <ResultBox label="Min Side" value={`${footResult.min_side_ft} ft`} />
                <ResultBox label="Recommended" value={footResult.recommended_size} />
                <ResultBox label="Area Provided" value={`${footResult.area_provided_ft2} ft²`} />
              </div>
            )}
          </>
        )}

        {/* Rebar area */}
        {activeTab === 'rebar' && (
          <>
            <h2 className="text-sm font-medium text-steel-300 mono">
              Rebar Steel Area — {rebarSystem === 'US' ? 'US Customary (#3-#11)' : 'Metric (D10-D32)'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">Bar Size</label>
                <select value={rebarSize} onChange={e => setRebarSize(e.target.value)}
                  className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50">
                  {rebarSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-steel-500 mono mb-1 block">Number of Bars</label>
                <input type="number" value={rebarCount} onChange={e => setRebarCount(e.target.value)}
                  placeholder="e.g. 4" className="w-full bg-steel-800/60 border border-steel-600/50 rounded-lg px-3 py-2 text-white mono text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>

            {rebarBar && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ResultBox label="Diameter"
                  value={rebarSystem === 'US' ? `${rebarBar.diameter_in}" (${rebarBar.diameter_mm}mm)` : `${rebarBar.diameter_mm}mm`} />
                <ResultBox label="Area per bar"
                  value={rebarSystem === 'US' ? `${rebarBar.area_in2} in²` : `${rebarBar.area_mm2} mm²`} />
                {rebarResult && (
                  <>
                    <ResultBox label="Total Area"
                      value={`${rebarResult.totalArea.toFixed(2)} ${rebarResult.unit}`} />
                    <ResultBox label="Bar count" value={`${rebarCount} bars`} />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
