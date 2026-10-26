import { createContext } from 'react'

export interface AppContextValue {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const AppContext = createContext<AppContextValue | undefined>(undefined)
