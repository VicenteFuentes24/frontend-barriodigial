import { EventType, type AuthenticationResult } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProfileProvider } from './auth/AuthProfileProvider';
import { msalInstance } from './auth/authConfig';
import './index.css';

async function bootstrap() {
  await msalInstance.initialize();

  const redirectResponse = await msalInstance.handleRedirectPromise();
  const redirectAccount = redirectResponse?.account;
  const existingAccount =
    msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

  if (redirectAccount) {
    msalInstance.setActiveAccount(redirectAccount);
  } else if (existingAccount) {
    msalInstance.setActiveAccount(existingAccount);
  }

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS) {
      const result = event.payload as AuthenticationResult | null;

      if (result?.account) {
        msalInstance.setActiveAccount(result.account);
      }
    }
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <AuthProfileProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProfileProvider>
      </MsalProvider>
    </StrictMode>,
  );
}

void bootstrap();
