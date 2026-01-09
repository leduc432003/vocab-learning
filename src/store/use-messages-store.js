import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useMessagesStore = create()(
    persist(
        (set, get) => ({
            messages: [],
            addMessage: (text) => {
                const newMessage = {
                    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                    text,
                    timestamp: Date.now(),
                };
                set({ messages: [...get().messages, newMessage] });
            },
            deleteMessage: (id) =>
                set((state) => ({
                    messages: state.messages.filter((msg) => msg.id !== id),
                })),
            clearMessages: () => set({ messages: [] }),
        }),
        {
            name: "messages-storage",
            version: 1,
        }
    )
);
