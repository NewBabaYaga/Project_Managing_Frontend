import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { token, isLoading } = useAuth();
  // Wait until localStorage is restored before deciding to redirect
  if (isLoading) return null;
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
