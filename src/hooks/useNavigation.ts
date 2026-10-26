import { useState, useEffect } from 'react'

export type AppRoute = 'landing' | 'investigate' | 'live' | 'dossier'

export function useNavigation() {
  const [route, setRoute] = useState<AppRoute>(() => {
    const hash = window.location.hash.toLowerCase().replace('#', '')
    if (hash === 'investigate') return 'investigate'
    if (hash === 'live') return 'live'
    if (hash === 'dossier') return 'dossier'
    return 'landing'
  })

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '')
      if (hash === 'investigate') setRoute('investigate')
      else if (hash === 'live') setRoute('live')
      else if (hash === 'dossier') setRoute('dossier')
      else setRoute('landing')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateTo = (newRoute: AppRoute) => {
    window.location.hash = newRoute === 'landing' ? '' : `#${newRoute}`
    setRoute(newRoute)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { route, navigateTo }
}
