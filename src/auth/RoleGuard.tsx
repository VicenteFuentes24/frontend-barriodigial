import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { Navigate, Outlet } from 'react-router-dom';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import { useAuthProfile } from '../hooks/useAuthProfile';
import type { AppRole } from '../types/auth';
import { hasAnyRole } from './authUtils';

interface RoleGuardProps {
  allowedRoles: AppRole[];
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { accounts, inProgress, instance } = useMsal();
  const { error, isLoading, profile, refreshProfile, roles } = useAuthProfile();
  const account = instance.getActiveAccount() ?? accounts[0] ?? null;

  if (inProgress !== InteractionStatus.None || isLoading) {
    return <LoadingState message="Validando permisos..." fullPage />;
  }

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return (
      <ErrorState
        title="No se pudo validar tu perfil"
        message={error}
        onRetry={refreshProfile}
      />
    );
  }

  if (!profile) {
    return (
      <ErrorState
        title="Perfil no disponible"
        message="No fue posible obtener los roles desde el BFF."
        onRetry={refreshProfile}
      />
    );
  }

  if (!hasAnyRole(roles, allowedRoles)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
