import { isIP } from 'node:net';
import react from '@vitejs/plugin-react';
import { defineConfig, type UserConfig } from 'vite';

const requiredVariables = [
  'VITE_AZURE_TENANT_ID',
  'VITE_AZURE_CLIENT_ID',
  'VITE_AZURE_API_SCOPE',
  'VITE_AZURE_REDIRECT_URI',
  'VITE_API_BASE_URL',
] as const;

function httpsUrl(variable: string, value: string) {
  const url = URL.parse(value);
  const hostname = url?.hostname.replace(/\.$/, '') ?? '';
  if (!url || url.protocol !== 'https:' || url.username || url.password || url.hash
      || !hostname.includes('.') || isIP(hostname)
      || /\.(localhost|local|localdomain|internal|home\.arpa)$/.test(hostname)) {
    throw new Error(`${variable} debe ser una URL HTTPS con un dominio público.`);
  }
  return url;
}

export default defineConfig((): UserConfig => {
  const values = Object.fromEntries(requiredVariables.map((key) => [key, process.env[key]?.trim() ?? '']));
  const missing = requiredVariables.filter((key) => !values[key]);
  if (missing.length) {
    throw new Error(`Faltan variables de Amplify: ${missing.join(', ')}.`);
  }

  httpsUrl('VITE_AZURE_REDIRECT_URI', values.VITE_AZURE_REDIRECT_URI);
  const api = httpsUrl('VITE_API_BASE_URL', values.VITE_API_BASE_URL);
  if (!/^[a-z0-9]+\.execute-api\.us-east-1\.amazonaws\.com$/.test(api.hostname)
      || api.port || api.search || !/^\/(?:(?!api(?:\/|$))[A-Za-z0-9_-]+\/?)?$/.test(api.pathname)) {
    throw new Error('VITE_API_BASE_URL debe ser la URL base de API Gateway en us-east-1, con stage opcional y sin /api.');
  }

  return {
    plugins: [react()],
    envDir: false,
    envPrefix: [],
    define: Object.fromEntries(requiredVariables.map((key) => [`import.meta.env.${key}`, JSON.stringify(values[key])])),
  };
});
