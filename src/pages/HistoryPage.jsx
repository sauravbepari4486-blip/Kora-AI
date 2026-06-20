import { useAppStore } from '../store'

export default function HistoryPage() {
  const { chatHistory, uploadedFiles, clearChat } = useAppStore()

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white mono">History</h1>
          <p className="text-steel-500 text-xs mono">Past conversations and uploaded files</p>
        </div>
        {chatHistory.length > 0 && (
          <button onClick={clearChat}
            className="px-3 py-1.5 border border-red-800/40 text-red-400 rounded-lg text-xs mono hover:bg-red-900/20 transition-all">
            Clear History
          </button>
        )}
      </div>

      {chatHistory.length === 0 ? (
        <div className="glow-border rounded-xl bg-steel-900/40 p-8 text-center">
          <p className="text-steel-500 mono text-sm">No history yet.</p>
          <p className="text-steel-600 mono text-xs mt-1">Your analysis conversations will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chatHistory.slice().reverse().map((msg) => (
            <div key={msg.id} className={`rounded-xl px-4 py-3 border text-xs mono ${
              msg.role === 'user'
                ? 'bg-steel-800/40 border-steel-700/40 text-steel-300'
                : 'bg-blue-900/20 border-blue-800/30 text-steel-300'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium ${msg.role === 'user' ? 'text-steel-400' : 'text-blue-400'}`}>
                  {msg.role === 'user' ? 'You' : 'StructAI'}
                </span>
                <span className="text-steel-600">{new Date(msg.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-steel-400 line-clamp-2">{msg.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
