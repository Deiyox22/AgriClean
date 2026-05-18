import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function ProtectedRoute({ children }) {
  const managerLoggedIn = useAuthStore((s) => s.managerLoggedIn)
  const location = useLocation()

  if (!managerLoggedIn) {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  return children
}
