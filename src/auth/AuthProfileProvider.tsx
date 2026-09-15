import { InteractionStatus, type AccountInfo } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { getApiErrorMessage } from '../services/apiClient';
import { authService } from '../services/authService';
import type { AppRole, UserProfile } from '../types/auth';
import { buildUserProfileFromBff } from './authUtils';

interface AuthProfileContextValue {
  account: AccountInfo | null;
  profile: UserProfile | null;
  roles: AppRole[];
  isLoading: boolean;
  error: string;
  refreshProfile: () => void;
}

const AuthProfileContext = createContext<AuthProfileContextValue | undefined>(
  undefined,
);

function getAccountKey(account: AccountInfo | null) {
  return (
    account?.homeAccountId ||
    account?.localAccountId ||
    account?.username ||
    'anonymous'
  );
}

export function AuthProfileProvider({ children }: PropsWithChildren) {
  const { accounts, inProgress, instance } = useMsal();
  const account = instance.getActiveAccount() ?? accounts[0] ?? null;
  const accountKey = getAccountKey(account);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestedKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!instance.getActiveAccount() && accounts[0]) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [accounts, instance]);

  const refreshProfile = useCallback(() => {
    requestedKeyRef.current = null;
    setRefreshVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) {
      return;
    }

    if (!account) {
      requestedKeyRef.current = null;
      setProfile(null);
      setRoles([]);
      setError('');
      setIsLoading(false);
      return;
    }

    const requestKey = accountKey + ':' + refreshVersion;
    if (requestedKeyRef.current === requestKey) {
      return;
    }

    let isCancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    requestedKeyRef.current = requestKey;
    setIsLoading(true);
    setError('');

    authService
      .getMe()
      .then((me) => {
        if (isCancelled || requestId !== requestIdRef.current) {
          return;
        }

        const nextProfile = buildUserProfileFromBff(me);
        setProfile(nextProfile);
        setRoles(nextProfile.roles);
      })
      .catch((loadError) => {
        if (isCancelled || requestId !== requestIdRef.current) {
          return;
        }

        setProfile(null);
        setRoles([]);
        setError(
          getApiErrorMessage(
            loadError,
            'No fue posible cargar tu perfil desde el BFF.',
          ),
        );
      })
      .finally(() => {
        if (!isCancelled && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [accountKey, inProgress, refreshVersion]);

  const value = useMemo<AuthProfileContextValue>(
    () => ({
      account,
      profile,
      roles,
      isLoading,
      error,
      refreshProfile,
    }),
    [account, error, isLoading, profile, refreshProfile, roles],
  );

  return (
    <AuthProfileContext.Provider value={value}>
      {children}
    </AuthProfileContext.Provider>
  );
}

export function useAuthProfile() {
  const context = useContext(AuthProfileContext);

  if (!context) {
    throw new Error('useAuthProfile debe usarse dentro de AuthProfileProvider.');
  }

  return context;
}

