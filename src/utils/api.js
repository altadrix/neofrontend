import { clearSession, getToken } from './session';

const configuredUrl = [
  import.meta.env.VITE_API_URL,
  import.meta.env.VITE_SERVER_URL,
  import.meta.env.VITE_BACKEND_URL,
]
  .find((value) => typeof value === 'string' && value.trim())
  ?.trim();

const fallbackBaseUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : '';

const normalizedConfiguredUrl = (configuredUrl || '').replace(/\/+$/, '');

export const API_BASE_URL = (normalizedConfiguredUrl || fallbackBaseUrl).replace(/\/api$/i, '');
export const API_URL = /\/api$/i.test(normalizedConfiguredUrl)
  ? normalizedConfiguredUrl
  : `${API_BASE_URL}/api`;
export const ITBIS_RATE = 0.18;

const currencyFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

export const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

export const calculateItbis = (subtotal) => roundMoney((Number(subtotal) || 0) * ITBIS_RATE);

export const buildImageUrl = (relativePath, fallback = '') => {
  if (!relativePath) {
    return fallback;
  }

  if (/^https?:\/\//i.test(relativePath)) {
    return relativePath;
  }

  return `${API_BASE_URL}${relativePath}`;
};

export async function apiFetch(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestOptions = {
    method: options.method || 'GET',
    headers,
    body: options.body,
    mode: 'cors',
    credentials: options.credentials || 'same-origin',
  };

  if (!(options.body instanceof FormData) && options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
  const contentType = response.headers.get('content-type') || '';

  let payload = null;

  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }

    const fallbackMessage =
      response.status === 401
        ? 'Tu sesion ha expirado. Inicia sesion de nuevo.'
        : response.status === 403
          ? 'No tienes permisos para realizar esta accion.'
          : 'No se pudo completar la solicitud.';

    const error = new Error(payload?.error || payload?.message || fallbackMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
