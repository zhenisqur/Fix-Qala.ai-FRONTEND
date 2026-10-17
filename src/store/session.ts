import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '../api/client';
import { Issue } from '../types';

type User = { name: string; phone: string };

type State = {
  user: User | null;
  issues: Issue[];
  myIds: string[];
  loading: boolean;
  error: string | null;
  login: (u: User) => void;
  addMine: (id: string) => void;
  loadIssues: (lat?: number, lng?: number) => Promise<void>;
};

export const useSession = create<State>()(
  persist(
    (set) => ({
      user: null,
      issues: [],
      myIds: [],
      loading: false,
      error: null,
      login: (user) => set({ user }),
      addMine: (id) => set((s) => (s.myIds.includes(id) ? s : { myIds: [id, ...s.myIds] })),
      loadIssues: async (lat, lng) => {
        set({ loading: true, error: null });
        try {
          const issues = await api.listIssues(lat, lng);
          set({ issues, loading: false });
        } catch {
          set({ loading: false, error: 'Нет связи с сервером' });
        }
      },
    }),
    {
      name: 'fixqala-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ myIds: s.myIds }),
    },
  ),
);