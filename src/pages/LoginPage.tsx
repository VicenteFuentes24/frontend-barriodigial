import { InteractionStatus } from '@azure/msal-browser';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { Building2, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { azureConfig, loginRequest } from '../auth/authConfig';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';

export default function LoginPage() {
  const { accounts, inProgress, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated || accounts.length > 0) {
      navigate('/dashboard', { replace: true });
    }
  }, [accounts.length, isAuthenticated, navigate]);

  const startLogin = () => {
    setError('');
    instance.loginRedirect(loginRequest).catch(() => {
      setError('No fue posible iniciar sesión con Microsoft.');
    });
  };

  const isBusy = inProgress !== InteractionStatus.None;

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="login-icon" aria-hidden="true">
            <Building2 size={34} />
          </div>
          <div>
            <p className="eyebrow">Municipalidad digital</p>
            <h1>BarrioDigital</h1>
          </div>
        </div>

        <p className="login-copy">Gestión digital de trámites comunales</p>

        {!azureConfig.isConfigured ? (
          <ErrorState
            title="Configuración pendiente"
            message="Completa las variables VITE_AZURE_TENANT_ID, VITE_AZURE_CLIENT_ID, VITE_AZURE_API_SCOPE y VITE_API_BASE_URL antes de iniciar sesión."
          />
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}

        <Button
          disabled={!azureConfig.isConfigured || isBusy}
          onClick={startLogin}
        >
          <LogIn size={18} aria-hidden="true" />
          {isBusy ? 'Conectando...' : 'Iniciar sesión con Microsoft'}
        </Button>
      </section>
    </main>
  );
}
