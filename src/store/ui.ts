import { create } from 'zustand';

/** Transient UI state that must not be persisted. */
export const useUi = create<{ focusMode: boolean; setFocusMode: (on: boolean) => void }>((set) => ({
  focusMode: false,
  setFocusMode: (focusMode) => set({ focusMode }),
}));
