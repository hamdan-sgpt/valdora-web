import { useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import RulesModal from './components/RulesModal'
import AuthModal from './components/AuthModal'
import PlayerDashboard from './components/PlayerDashboard'
import { AuthProvider } from './context/AuthContext'
import { RouterProvider, useRouter } from './context/RouterContext'

import HomePage from './pages/HomePage'
import GameplayPage from './pages/GameplayPage'
import PlayersPage from './pages/PlayersPage'
import GuidePage from './pages/GuidePage'
import TeamPage from './pages/TeamPage'
import GalleryPage from './pages/GalleryPage'
import MediaLivePage from './pages/MediaLivePage'

function MainContent({ onOpenRules }) {
  const { currentPath } = useRouter()

  switch (currentPath) {
    case '/gameplay':
    case '/fitur':
    case '/features':
    case '/ras':
      return <GameplayPage />
    case '/players':
    case '/pemain':
    case '/skill':
    case '/skills':
      return <PlayersPage />
    case '/team':
    case '/pengurus':
    case '/admin':
    case '/staff':
      return <TeamPage />
    case '/panduan':
    case '/guide':
    case '/how-to-join':
    case '/cara-main':
      return <GuidePage onOpenRules={onOpenRules} />
    case '/galeri':
    case '/gallery':
    case '/screenshot':
    case '/screenshots':
      return <GalleryPage />
    case '/live':
    case '/media':
    case '/stream':
    case '/share-media':
      return <MediaLivePage />
    case '/':
    default:
      return <HomePage />
  }
}

export default function App() {
  const [isRulesOpen, setIsRulesOpen] = useState(false)

  return (
    <RouterProvider>
      <AuthProvider>
        <div className="app-root">
          <Navbar onOpenRules={() => setIsRulesOpen(true)} />
          
          <main>
            <MainContent onOpenRules={() => setIsRulesOpen(true)} />
          </main>

          <Footer onOpenRules={() => setIsRulesOpen(true)} />

          <RulesModal 
            isOpen={isRulesOpen} 
            onClose={() => setIsRulesOpen(false)} 
          />

          {/* Modal Auth & Dashboard Petualang */}
          <AuthModal />
          <PlayerDashboard />
        </div>
      </AuthProvider>
    </RouterProvider>
  )
}
