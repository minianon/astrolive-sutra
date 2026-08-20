import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from './lib/store'
import Onboard from './screens/Onboard'
import Home from './screens/Home'
import Circles from './screens/Circles'
import Join from './screens/Join'
import Consult from './screens/Consult'
import AstrologerConsole from './screens/Astrologer'
import Plans from './screens/Plans'
import Memory from './screens/Memory'
import Growth from './screens/Growth'
import Trust from './screens/Trust'

/**
 * HashRouter, not BrowserRouter — deliberately.
 * This deploys to GitHub Pages, which serves a 404 for deep paths on a static
 * host. The single most important demo in this prototype is a stranger opening
 * an invite link, so deep links have to survive a cold load. Hash routing
 * guarantees that, and keeps the invite payload out of the request the server
 * sees.
 */

/** Anything requiring a chart redirects to onboarding first. */
function Gate({ children }: { children: React.ReactNode }) {
  const { onboarded } = useStore()
  if (!onboarded) return <Navigate to="/onboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/onboard" element={<Onboard />} />
          {/* Join must NOT be gated — a new person arrives here with no chart. */}
          <Route path="/join" element={<Join />} />

          <Route path="/" element={<Gate><Home /></Gate>} />
          <Route path="/circles" element={<Gate><Circles /></Gate>} />
          <Route path="/consult/:id" element={<Gate><Consult /></Gate>} />
          <Route path="/plans" element={<Gate><Plans /></Gate>} />
          <Route path="/memory" element={<Gate><Memory /></Gate>} />

          {/* Consoles and the trust page stand alone. */}
          <Route path="/astrologer" element={<AstrologerConsole />} />
          <Route path="/growth" element={<Growth />} />
          <Route path="/trust" element={<Trust />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
