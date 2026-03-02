import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
    persist(
        (set) => ({
            soundEnabled: true,
            setSoundEnabled: (v) => set({ soundEnabled: v }),
        }),
        {
            name: 'antigravity-settings',
        }
    )
);
