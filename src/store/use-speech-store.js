import { create } from "zustand";

export const useSpeechStore = create((set) => ({
    // State
    transcript: "",
    interimTranscript: "",
    isListening: false,
    isSupported: true,
    isLoading: false,
    voices: [],
    selectedVoice: null,

    // Actions
    setTranscript: (transcript) => set({ transcript }),
    setInterimTranscript: (interimTranscript) => set({ interimTranscript }),
    setListening: (isListening) => set({ isListening }),
    setSupported: (isSupported) => set({ isSupported }),
    setLoading: (isLoading) => set({ isLoading }),
    resetTranscript: () => set({ transcript: "", interimTranscript: "" }),
    updateFinalTranscript: (newText) =>
        set((state) => ({ transcript: (state.transcript + " " + newText).trim() })),
    setVoices: (voices) => set({ voices }),
    setSelectedVoice: (voice) => set({ selectedVoice: voice }),
}));
