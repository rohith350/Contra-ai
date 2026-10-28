import { AppProvider } from './context/AppContext'
import { MainLayout } from './layouts/MainLayout'
import { HomePage } from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { useNavigation } from './hooks/useNavigation'
import './styles/App.css'

function App() {
  const { route, navigateTo } = useNavigation()

  return (
    <AppProvider>
      <MainLayout>
        {route === 'dashboard' ? (
          <DashboardPage onNavigateHome={() => navigateTo('landing')} />
        ) : (
          <HomePage onEnterDashboard={() => navigateTo('dashboard')} />
        )}
      </MainLayout>
    </AppProvider>
  )
}

export default App
