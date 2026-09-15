import {
  BrowserCacheLocation,
  LogLevel,
  PublicClientApplication,
  type AccountInfo,
  type Configuration,
  type RedirectRequest,
  type SilentRequest,
} from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_AZURE_TENANT_ID?.trim() ?? '';
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID?.trim() ?? '';
const apiScope = import.meta.env.VITE_AZURE_API_SCOPE?.trim() ?? '';
const redirectUri =
  import.meta.env.VITE_AZURE_REDIRECT_URI?.trim() ?? window.location.origin;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

export const azureConfig = {
  tenantId,
  clientId,
  apiScope,
  redirectUri,
  apiBaseUrl,
  isConfigured: Boolean(tenantId && clientId && apiScope && apiBaseUrl),
};

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || 'missing-client-id',
    authority: tenantId
      ? 'https://login.microsoftonline.com/' + tenantId
      : 'https://login.microsoftonline.com/common',
    redirectUri,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest: RedirectRequest = {
  scopes: apiScope ? [apiScope] : [],
};

export function getApiTokenRequest(account: AccountInfo): SilentRequest {
  return {
    account,
    scopes: apiScope ? [apiScope] : [],
  };
}

export const msalInstance = new PublicClientApplication(msalConfig);

