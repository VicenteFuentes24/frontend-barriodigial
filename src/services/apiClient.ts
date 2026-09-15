import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { azureConfig, getApiTokenRequest, msalInstance } from '../auth/authConfig';

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getApiBaseUrl() {
  return azureConfig.apiBaseUrl.replace(/\/$/, '');
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  return getApiBaseUrl() + normalizedPath;
}

function getDefaultMessage(status: number) {
  if (status === 401) {
    return 'Tu sesión no pudo validarse. Inicia sesión nuevamente.';
  }

  if (status === 403) {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (status === 404) {
    return 'El recurso solicitado no existe.';
  }

  if (status >= 500) {
    return 'El servicio no está disponible en este momento.';
  }

  return 'No fue posible completar la solicitud.';
}

async function readErrorMessage(response: Response) {
  const fallback = getDefaultMessage(response.status);
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text || fallback;
  }

  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    error?: string;
  } | null;

  return payload?.message ?? payload?.error ?? fallback;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(
      await readErrorMessage(response),
      response.status,
      response.statusText,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function getAuthorizationHeader() {
  if (!azureConfig.apiScope) {
    throw new ApiError('VITE_AZURE_API_SCOPE no está configurado.');
  }

  const account =
    msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null;

  if (!account) {
    throw new ApiError('No hay una cuenta activa para obtener el token.', 401);
  }

  try {
    const result = await msalInstance.acquireTokenSilent(
      getApiTokenRequest(account),
    );
    return 'Bearer ' + result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      throw new ApiError(
        'La sesión requiere una nueva autenticación con Microsoft.',
        401,
        error,
      );
    }

    throw new ApiError(
      'No fue posible obtener un token de acceso válido.',
      401,
      error,
    );
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!azureConfig.apiBaseUrl) {
    throw new ApiError('VITE_API_BASE_URL no está configurado.');
  }

  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  }

  headers.set('Authorization', await getAuthorizationHeader());

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      headers,
    });

    return await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      'No fue posible conectarse al servicio. Intenta nuevamente más tarde.',
      undefined,
      error,
    );
  }
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
}
