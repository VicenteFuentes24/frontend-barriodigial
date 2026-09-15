import { InteractionStatus } from '@azure/msal-browser';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingState from '../components/ui/LoadingState';

export default function ProtectedRoute() {
  const { accounts, inProgress, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  useEffect(() => {
    if (!instance.getActiveAccount() && accounts[0]) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [accounts, instance]);

  if (inProgress !== InteractionStatus.None) {
    return <LoadingState message="Validando sesión..." fullPage />;
  }

  if (!isAuthenticated && accounts.length === 0) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
