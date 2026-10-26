import { useContext } from 'react'
import { AppContext, type AppContextValue } from '../context/app-context-definition'

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
