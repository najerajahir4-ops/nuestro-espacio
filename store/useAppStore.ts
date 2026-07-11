import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  name: string;
  colorTheme: string | null;
  profilePic: string | null;
  bio: string | null;
}

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  accentColor: string;
  partnerStatus: { isOnline: boolean; lastSeen?: Date | null; profilePic?: string | null; name?: string } | null;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
  setPartnerStatus: (status: { isOnline: boolean; lastSeen?: Date | null; profilePic?: string | null; name?: string } | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'dark',
      accentColor: '#db2777',
      partnerStatus: null,
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setPartnerStatus: (partnerStatus) => set({ partnerStatus }),
    }),
    {
      name: 'couple-app-storage',
    }
  )
);
