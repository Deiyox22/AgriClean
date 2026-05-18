import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function ProtectedRoute({ children, requireManager = false, requireEmployee = false }) {
  const managerLoggedIn = useAuthStore((s) => s.managerLoggedIn)
  const employeeSession = useAuthStore((s) => s.employeeSession)
  const location = useLocation()

  if (requireManager && !managerLoggedIn) {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  if (requireEmployee && !employeeSession) {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  // Si aucun n'est spécifié, on vérifie juste si l'un des deux est connecté
  if (!requireManager && !requireEmployee && !managerLoggedIn && !employeeSession) {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  return children
}
