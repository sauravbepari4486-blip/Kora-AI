import { NavLink } from 'react-router-dom'
import { useAppStore } from '../store'

const NAV = [
  { to: '/', icon: '⬡', label: { bn: 'ড্রইং বিশ্লেষণ', en: 'Analyze Drawing' }, exact: true },
  { to: '/floorplan', icon: '▣', label: { bn: 'ফ্লোর প্ল্যান', en: 'Floor Plan' } },
  { to: '/calculate', icon: '∑', label: { bn: 'ক্যালকুলেটর', en: 'Calculator' } },
  { to: '/units', icon: '⇄', label: { bn: 'ইউনিট কনভার্টার', en: 'Unit Converter' } },
  { to: '/knowledge', icon: '◈', label: { bn: 'নলেজ বেস', en: 'Knowledge Base' } },
  { to: '/training', icon: '★', label: { bn: 'ট্রেনিং হাব', en: 'Training Hub' } },
  { to: '/history', icon: '◷', label: { bn: 'ইতিহাস', en: 'History' } },
]

export default function Sidebar() {
  const { codeStandard, setCodeStandard, logout, trainingData, language, setLanguage, licenseType } = useAppStore()
  const L = language || 'bn'

  return (
    <aside className="w-52 shrink-0 flex flex-col h-full" style={{ background: 'rgba(6,15,30,0.95)', borderRight: '1px solid rgba(49,130,206,0.15)' }}>

      {/* Logo */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(49,130,206,0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'rgba(49,130,206,0.2)', border: '1px solid rgba(49,130,206,0.4)' }}>
            <span className="text-blue-400 text-xs font-bold mono">K</span>
          </div>
          <span className="text-white font-bold mono tracking-wider text-sm">Kora AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs mono" style={{ color: '#486581' }}>
            {licenseType === 'commercial' ? '● Commercial' : '● Personal License'}
          </span>
        </div>
      </div>

      {/* Language toggle */}
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(49,130,206,0.1)' }}>
        <p className="text-xs mono mb-1.5" style={{ color: '#486581' }}>LANGUAGE</p>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(49,130,206,0.2)' }}>
          {[['bn','বাংলা'],['en','English']].map(([id, label]) => (
            <button key={id} onClick={() => setLanguage(id)}
              className="flex-1 py-1.5 text-xs mono transition-all"
              style={{
                background: L === id ? 'rgba(49,130,206,0.3)' : 'transparent',
                color: L === id ? '#90cdf4' : '#627d98',
                fontWeight: L === id ? '600' : '400',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Code standard */}
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(49,130,206,0.1)' }}>
        <p className="text-xs mono mb-1.5" style={{ color: '#486581' }}>
          {L === 'bn' ? 'কোড স্ট্যান্ডার্ড' : 'CODE STANDARD'}
        </p>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(49,130,206,0.2)' }}>
          {[['ACI318','ACI 318'],['BNBC2020','BNBC']].map(([id, label]) => (
            <button key={id} onClick={() => setCodeStandard(id)}
              className="flex-1 py-1.5 text-xs mono transition-all"
              style={{
                background: codeStandard === id
                  ? id === 'ACI318' ? 'rgba(49,130,206,0.35)' : 'rgba(56,161,105,0.35)'
                  : 'transparent',
                color: codeStandard === id
                  ? id === 'ACI318' ? '#90cdf4' : '#68d391'
                  : '#627d98',
                fontWeight: codeStandard === id ? '600' : '400',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all mono ${isActive ? 'active-nav' : ''}`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(49,130,206,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(49,130,206,0.25)' : '1px solid transparent',
              color: isActive ? '#90cdf4' : '#627d98',
            })}>
            <span className="w-4 text-center">{item.icon}</span>
            <span>{item.label[L]}</span>
            {item.to === '/training' && (trainingData?.length || 0) > 0 && (
              <span className="ml-auto text-xs px-1.5 rounded"
                style={{ background: 'rgba(56,161,105,0.2)', color: '#68d391' }}>
                {trainingData.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(49,130,206,0.1)' }}>
        <button onClick={logout}
          className="w-full text-xs mono py-1.5 rounded-lg transition-all"
          style={{ color: '#486581' }}
          onMouseEnter={e => e.target.style.color = '#fc8181'}
          onMouseLeave={e => e.target.style.color = '#486581'}>
          ⊗ {L === 'bn' ? 'লগআউট' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}
