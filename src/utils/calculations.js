// ── Unit conversions ─────────────────────────────────────────
export const convert = {
  toAllUnits: (value, fromUnit) => {
    let mm
    switch (fromUnit.toLowerCase()) {
      case 'ft': case 'feet': mm = value * 304.8; break
      case 'in': case 'inch': mm = value * 25.4; break
      case 'cm': mm = value * 10; break
      case 'm': case 'meter': mm = value * 1000; break
      case 'mm': mm = value; break
      default: return null
    }
    const ft = mm / 304.8
    const floorFt = Math.floor(ft)
    const remIn = Math.round((ft - floorFt) * 12)
    return {
      mm: Math.round(mm * 100) / 100,
      cm: Math.round(mm / 10 * 100) / 100,
      m: Math.round(mm / 1000 * 1000) / 1000,
      ft: Math.round(ft * 1000) / 1000,
      in: Math.round(mm / 25.4 * 100) / 100,
      ftFormatted: remIn === 12 ? `${floorFt + 1}'-0"` : `${floorFt}'-${remIn}"`,
    }
  }
}

// ── Elevation ────────────────────────────────────────────────
export const elevation = {
  depthFromGL: (gl, bottom) => {
    const depth = Math.abs(gl - bottom)
    const ft = depth; const floorFt = Math.floor(ft); const remIn = Math.round((ft - floorFt) * 12)
    return {
      depth_ft: Math.round(depth * 1000) / 1000,
      depth_in: Math.round(depth * 12 * 100) / 100,
      depth_cm: Math.round(depth * 30.48 * 100) / 100,
      depth_mm: Math.round(depth * 304.8),
      depth_m: Math.round(depth * 0.3048 * 1000) / 1000,
      formatted: remIn === 12 ? `${floorFt + 1}'-0"` : `${floorFt}'-${remIn}"`,
    }
  }
}

// ── Rebar data ───────────────────────────────────────────────
export const rebarData = {
  US: {
    '#3': { diameter_in: 0.375, area_in2: 0.11, diameter_mm: 9.5 },
    '#4': { diameter_in: 0.500, area_in2: 0.20, diameter_mm: 12.7 },
    '#5': { diameter_in: 0.625, area_in2: 0.31, diameter_mm: 15.9 },
    '#6': { diameter_in: 0.750, area_in2: 0.44, diameter_mm: 19.1 },
    '#7': { diameter_in: 0.875, area_in2: 0.60, diameter_mm: 22.2 },
    '#8': { diameter_in: 1.000, area_in2: 0.79, diameter_mm: 25.4 },
    '#9': { diameter_in: 1.128, area_in2: 1.00, diameter_mm: 28.7 },
    '#10': { diameter_in: 1.270, area_in2: 1.27, diameter_mm: 32.3 },
    '#11': { diameter_in: 1.410, area_in2: 1.56, diameter_mm: 35.8 },
  },
  Metric: {
    'D10': { diameter_mm: 10, area_mm2: 78.5 },
    'D12': { diameter_mm: 12, area_mm2: 113.1 },
    'D16': { diameter_mm: 16, area_mm2: 201.1 },
    'D20': { diameter_mm: 20, area_mm2: 314.2 },
    'D22': { diameter_mm: 22, area_mm2: 380.1 },
    'D25': { diameter_mm: 25, area_mm2: 490.9 },
    'D32': { diameter_mm: 32, area_mm2: 804.2 },
  },
  totalArea: (size, count, sys = 'US') => {
    const bar = rebarData[sys][size]; if (!bar) return null
    const key = sys === 'US' ? 'area_in2' : 'area_mm2'
    return { totalArea: bar[key] * count, unit: sys === 'US' ? 'in²' : 'mm²', perBar: bar[key] }
  }
}

// ── Foundation calcs ─────────────────────────────────────────
export const foundation = {
  isolatedFooting: ({ axialLoad_kip, soilCapacity_ksf, selfWeightFactor = 1.1 }) => {
    const area = (axialLoad_kip * selfWeightFactor) / soilCapacity_ksf
    const side = Math.sqrt(area)
    const rounded = Math.ceil(side * 2) / 2
    return {
      required_area_ft2: Math.round(area * 100) / 100,
      min_side_ft: Math.round(side * 100) / 100,
      recommended_size: `${rounded}' × ${rounded}'`,
      recommended_size_in: `${rounded * 12}" × ${rounded * 12}"`,
      area_provided_ft2: rounded * rounded,
    }
  },
  minDepth_ACI: () => ({ min_depth_in: 6, cover_in: 3, note: 'ACI 318-19 §13.3.1: Min 6" for footings on soil, 3" clear cover' }),
}

// ── Structural quick calcs ───────────────────────────────────
export const structural = {
  beamDepth: (span_ft, cond = 'simply_supported') => {
    const ratios = { simply_supported: 16, one_end_continuous: 18.5, both_ends_continuous: 21, cantilever: 8 }
    const ratio = ratios[cond] || 16
    const depth_in = (span_ft * 12) / ratio
    return { min_depth_in: Math.round(depth_in * 10) / 10, min_depth_cm: Math.round(depth_in * 2.54 * 10) / 10, ratio, note: `ACI 318-19 Table 9.3.1.1 — L/${ratio}` }
  },
  columnSize: (load_kip, fc_psi = 4000, fy_psi = 60000) => {
    const fc = fc_psi / 1000; const fy = fy_psi / 1000; const rho = 0.02; const phi = 0.65
    const Ag = load_kip / (phi * (0.8 * (0.85 * fc * (1 - rho) + fy * rho)))
    const side = Math.sqrt(Ag)
    const rounded = Math.ceil(side / 2) * 2
    return { Ag: Math.round(Ag * 100) / 100, min_side: Math.round(side * 10) / 10, recommended: `${rounded}" × ${rounded}"`, note: `ACI 318-19 §22.4.2` }
  },
  slabThickness: (span_ft, type = 'two_way') => {
    const t = type === 'two_way' ? Math.max(5, (span_ft * 12) / 33) : Math.max(3.5, (span_ft * 12) / 20)
    return { in: Math.round(t * 10) / 10, cm: Math.round(t * 2.54 * 10) / 10, mm: Math.round(t * 25.4), note: `ACI 318-19 ${type === 'two_way' ? '§8.3.1.1' : '§7.3.1.1'}` }
  },
  footingSize: (load_kip, soil_ksf = 2.0) => {
    const area = (load_kip * 1.1) / soil_ksf
    const side = Math.sqrt(area)
    const rounded = Math.ceil(side * 2) / 2
    return { area: Math.round(area * 100) / 100, min_side: Math.round(side * 100) / 100, recommended: `${rounded}' × ${rounded}'` }
  }
}

// ── System prompt builder ────────────────────────────────────
export const buildSystemPrompt = (codeStandard, knowledgeBase, trainingData) => {
  const kbText = Object.entries(knowledgeBase || {})
    .map(([cat, items]) => items.length > 0 ? `${cat}: ${items.map(i => i.title).join(', ')}` : null)
    .filter(Boolean).join('\n')

  const trainText = (trainingData || []).slice(0, 12).map((t, i) =>
    `[T${i+1}] ${t.category}: ${t.title}\n${(t.content || '').slice(0, 500)}`
  ).join('\n\n')

  return `You are StructAI — expert structural engineer & architect assistant.

CODE: ${codeStandard === 'ACI318' ? 'ACI 318-19 (default)' : 'BNBC 2020'}

EXPERTISE: Foundation, Beam, Column, Slab, Rebar, Section analysis, AutoCAD DXF interpretation, RL/EL/GL elevations, unit conversions (ft-in-cm-mm-m), load calculations, building codes.

UNITS: Always show results in multiple units. Step-by-step calculations. Reference ACI/BNBC sections.

DXF ANALYSIS: Identify structural elements, check dimensions, suggest rebar with bar sizes and spacing, note code violations with ⚠️.

${kbText ? `KNOWLEDGE BASE:\n${kbText}` : ''}
${trainText ? `TRAINING DATA (use as reference):\n${trainText}` : ''}

LANGUAGE: Respond in Bengali/Banglish mixed with English technical terms. English for measurements and code refs.
FORMAT: Lead with key finding. Step-by-step calcs. Flag issues with ⚠️. Recommendations with ✅.`
}
