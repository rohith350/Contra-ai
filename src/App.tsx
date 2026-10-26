import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import { MainLayout } from './layouts/MainLayout'
import { HomePage } from './pages/HomePage'
import { StartInvestigationPage } from './pages/StartInvestigationPage'
import { LiveInvestigationPage } from './pages/LiveInvestigationPage'
import { EvidenceDossierPage } from './pages/EvidenceDossierPage'
import { useNavigation } from './hooks/useNavigation'
import { SAMPLE_INVESTIGATION_REPORT } from './services/sample-report'
import type { InvestigationReport } from './types/investigation'
import './styles/App.css'

function App() {
  const { route, navigateTo } = useNavigation()
  const [currentHypothesis, setCurrentHypothesis] = useState(
    'Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles.'
  )
  const [activeReport, setActiveReport] = useState<InvestigationReport>(SAMPLE_INVESTIGATION_REPORT)

  const handleStartInvestigation = (hypothesis: string) => {
    setCurrentHypothesis(hypothesis)
    // Update active report hypothesis so the synthesized dossier accurately reflects the query
    setActiveReport((prev) => ({
      ...prev,
      hypothesis,
    }))
    navigateTo('live')
  }

  return (
    <AppProvider>
      <MainLayout>
        {route === 'investigate' && (
          <StartInvestigationPage
            onStartInvestigation={handleStartInvestigation}
            onNavigateHome={() => navigateTo('landing')}
          />
        )}

        {route === 'live' && (
          <LiveInvestigationPage
            hypothesis={currentHypothesis}
            onComplete={() => navigateTo('dossier')}
            onCancel={() => navigateTo('investigate')}
          />
        )}

        {route === 'dossier' && (
          <EvidenceDossierPage
            report={activeReport}
            onNewInvestigation={() => navigateTo('investigate')}
            onNavigateHome={() => navigateTo('landing')}
          />
        )}

        {route === 'landing' && (
          <HomePage onEnterDashboard={() => navigateTo('investigate')} />
        )}
      </MainLayout>
    </AppProvider>
  )
}

export default App
