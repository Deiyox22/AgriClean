import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { seedIfEmpty } from './db/db'
import { useClientStore } from './store/useClientStore'
import { useEmployeeStore } from './store/useEmployeeStore'
import { useMissionStore } from './store/useMissionStore'
import { useVehicleStore } from './store/useVehicleStore'
import { useInvoiceStore } from './store/useInvoiceStore'
import { useQuoteStore } from './store/useQuoteStore'
import { useSettingsStore } from './store/useSettingsStore'
import { useAuthStore } from './store/useAuthStore'
import { useTeamStore } from './store/useTeamStore'
import { useMessagingStore } from './store/useMessagingStore'
import { useRealtime } from './hooks/useRealtime'
import ToastContainer from './components/ui/Toast'

// Public pages
const Landing = lazy(() => import('./pages/public/Landing'))
const CandidatPortal = lazy(() => import('./pages/public/CandidatPortal'))
const ClientPortal = lazy(() => import('./pages/public/ClientPortal'))
const Login = lazy(() => import('./pages/auth/Login'))

// Manager app pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ClientList = lazy(() => import('./pages/clients/ClientList'))
const ClientDetail = lazy(() => import('./pages/clients/ClientDetail'))
const TeamList = lazy(() => import('./pages/team/TeamList'))
const EmployeeDetail = lazy(() => import('./pages/team/EmployeeDetail'))
const EmployeeAgenda = lazy(() => import('./pages/team/EmployeeAgenda'))
const Candidatures = lazy(() => import('./pages/team/Candidatures'))
const Planning = lazy(() => import('./pages/planning/Planning'))
const MissionList = lazy(() => import('./pages/missions/MissionList'))
const MissionDetail = lazy(() => import('./pages/missions/MissionDetail'))
const MissionForm = lazy(() => import('./pages/missions/MissionForm'))
const Fleet = lazy(() => import('./pages/fleet/Fleet'))
const InvoiceList = lazy(() => import('./pages/invoicing/InvoiceList'))
const InvoiceDetail = lazy(() => import('./pages/invoicing/InvoiceDetail'))
const QuoteDetail = lazy(() => import('./pages/invoicing/QuoteDetail'))
const Settings = lazy(() => import('./pages/Settings'))
const EmployeeSpace = lazy(() => import('./pages/employee/EmployeeSpace'))
const Rapports = lazy(() => import('./pages/Rapports'))
const Alertes  = lazy(() => import('./pages/Alertes'))
const Messagerie = lazy(() => import('./pages/messaging/Messagerie'))

function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

function ManagerApp() {
  return (
    <Layout>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/team" element={<TeamList />} />
          <Route path="/team/candidatures" element={<Candidatures />} />
          <Route path="/team/:id" element={<EmployeeDetail />} />
          <Route path="/team/:id/agenda" element={<EmployeeAgenda />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/missions" element={<MissionList />} />
          <Route path="/missions/new" element={<MissionForm />} />
          <Route path="/missions/:id" element={<MissionDetail />} />
          <Route path="/missions/:id/edit" element={<MissionForm />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/invoicing" element={<InvoiceList />} />
          <Route path="/invoicing/devis/:id" element={<QuoteDetail />} />
          <Route path="/invoicing/:id" element={<InvoiceDetail />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/alertes" element={<Alertes />} />
          <Route path="/messagerie" element={<Messagerie />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

// AppInner est rendu DANS <BrowserRouter> — useNavigate() y est autorisé
function AppInner() {
  const loadClients = useClientStore((s) => s.load)
  const loadEmployees = useEmployeeStore((s) => s.load)
  const loadMissions = useMissionStore((s) => s.load)
  const loadVehicles = useVehicleStore((s) => s.load)
  const loadInvoices = useInvoiceStore((s) => s.load)
  const loadQuotes = useQuoteStore((s) => s.load)
  const loadSettings = useSettingsStore((s) => s.load)
  const loadTeams        = useTeamStore((s) => s.load)
  const managerLoggedIn  = useAuthStore((s) => s.managerLoggedIn)
  const employeeSession  = useAuthStore((s) => s.employeeSession)
  const loadUnreadTotal   = useMessagingStore((s) => s.loadUnreadTotal)
  const loadConversations = useMessagingStore((s) => s.loadConversations)

  const escalateOverdue = useInvoiceStore((s) => s.escalateOverdue)
  const theme = useSettingsStore((s) => s.settings.theme)

  // Apply dark mode class + persist in localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('agriclean-theme', theme ?? 'light')
  }, [theme])

  // Supabase Realtime sync (useNavigate disponible ici car on est dans le Router)
  useRealtime()

  useEffect(() => {
    const init = async () => {
      await seedIfEmpty()
      await Promise.all([
        loadClients(),
        loadEmployees(),
        loadMissions(),
        loadVehicles(),
        loadInvoices(),
        loadQuotes(),
        loadSettings(),
        loadTeams(),
      ])
      escalateOverdue()
      if (managerLoggedIn || employeeSession) {
        loadConversations()
        if (managerLoggedIn) loadUnreadTotal()
      }
    }
    init()
  }, [])

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/candidats" element={<CandidatPortal />} />
        <Route path="/espace-pro" element={<ClientPortal />} />
        <Route path="/connexion" element={
          managerLoggedIn ? <Navigate to="/dashboard" replace /> :
          employeeSession ? <Navigate to="/mon-espace" replace /> :
          <Login />
        } />

        {/* Employee route */}
        <Route path="/mon-espace" element={
          <ProtectedRoute requireEmployee>
            <EmployeeSpace />
          </ProtectedRoute>
        } />

        {/* Protected manager routes */}
        <Route path="/*" element={
          <ProtectedRoute requireManager>
            <ManagerApp />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <ToastContainer />
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </>
  )
}
