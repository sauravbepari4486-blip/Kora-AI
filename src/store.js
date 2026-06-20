import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      // ── Auth ──────────────────────────────────────
      isAuthenticated: false,
      login: (pw) => {
        const PASS = import.meta.env.VITE_APP_PASSWORD || 'kora-ai2024'
        if (pw === PASS) { set({ isAuthenticated: true }); return true }
        return false
      },
      logout: () => set({ isAuthenticated: false }),

      // ── Language ──────────────────────────────────
      language: 'bn', // 'bn' = Bengali, 'en' = English
      setLanguage: (l) => set({ language: l }),

      // ── License ───────────────────────────────────
      licenseKey: null,
      licenseType: 'personal', // 'personal' | 'commercial' | 'trial'
      setLicense: (key, type) => set({ licenseKey: key, licenseType: type }),

      // ── Code standard ─────────────────────────────
      codeStandard: 'ACI318',
      setCodeStandard: (c) => set({ codeStandard: c }),

      // ── Chat history ──────────────────────────────
      chatHistory: [],
      addMessage: (msg) => set((s) => ({
        chatHistory: [...s.chatHistory, { ...msg, id: Date.now(), timestamp: new Date().toISOString() }]
      })),
      clearChat: () => set({ chatHistory: [] }),

      // ── Training data ─────────────────────────────
      trainingData: [],
      addTrainingData: (item) => set((s) => ({
        trainingData: [...s.trainingData, { ...item, id: Date.now(), timestamp: new Date().toISOString() }]
      })),
      removeTrainingData: (id) => set((s) => ({
        trainingData: s.trainingData.filter(i => i.id !== id)
      })),

      // ── Knowledge base ────────────────────────────
      knowledgeBase: { foundations: [], sections: [], rebarSchedules: [], notes: [] },
      addKnowledge: (cat, item) => set((s) => ({
        knowledgeBase: { ...s.knowledgeBase, [cat]: [...(s.knowledgeBase[cat] || []), { ...item, id: Date.now() }] }
      })),
      removeKnowledge: (cat, id) => set((s) => ({
        knowledgeBase: { ...s.knowledgeBase, [cat]: s.knowledgeBase[cat].filter(i => i.id !== id) }
      })),
    }),
    {
      name: 'kora-ai-v2',
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        codeStandard: s.codeStandard,
        language: s.language,
        licenseKey: s.licenseKey,
        licenseType: s.licenseType,
        trainingData: s.trainingData,
        knowledgeBase: s.knowledgeBase,
        chatHistory: s.chatHistory,
      })
    }
  )
)
