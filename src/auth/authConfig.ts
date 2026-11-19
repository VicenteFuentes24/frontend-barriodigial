import {
  BrowserCacheLocation,
  LogLevel,
  PublicClientApplication,
  type AccountInfo,
  type Configuration,
  type RedirectRequest,
  type SilentRequest,
} from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const apiScope = import.meta.env.VITE_AZURE_API_SCOPE;
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const azureConfig = {
  tenantId,
  clientId,
  apiScope,
  redirectUri,
  apiBaseUrl,
};

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: 'https://login.microsoftonline.com/' + tenantId,
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
  scopes: [apiScope],
};

export function getApiTokenRequest(account: AccountInfo): SilentRequest {
  return {
    account,
    scopes: [apiScope],
  };
}

export const msalInstance = new PublicClientApplication(msalConfig);

