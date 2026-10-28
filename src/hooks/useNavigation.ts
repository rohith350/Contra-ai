import { useState, useEffect } from 'react'

export type AppRoute = 'landing' | 'dashboard'

export function useNavigation() {
  const [route, setRoute] = useState<AppRoute>(() => {
    const hash = window.location.hash.toLowerCase().replace('#', '')
    if (hash === 'dashboard' || hash === 'investigate' || hash === 'live' || hash === 'dossier') {
      return 'dashboard'
    }
    return 'landing'
  })

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '')
      if (hash === 'dashboard' || hash === 'investigate' || hash === 'live' || hash === 'dossier') {
        setRoute('dashboard')
      } else {
        setRoute('landing')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateTo = (newRoute: AppRoute) => {
    window.location.hash = newRoute === 'landing' ? '' : '#dashboard'
    setRoute(newRoute)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { route, navigateTo }
}
