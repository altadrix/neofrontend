import emitter from './emitter';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const CART_KEY = 'cart-count';

const decodeBase64Url = (value) => {
  if (!value) return '';

  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4 || 4)) % 4), '=');

    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(padded);
    }

    return '';
  } catch {
    return '';
  }
};

const readTokenPayload = (token) => {
  if (!token) return null;

  const [, payloadPart] = String(token).split('.');
  if (!payloadPart) return null;

  const rawPayload = decodeBase64Url(payloadPart);
  if (!rawPayload) return null;

  try {
    return JSON.parse(rawPayload);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = readTokenPayload(token);
  const exp = Number(payload?.exp || 0);

  if (!exp) return false;

  return Date.now() >= exp * 1000;
};

const normalizeStoredUser = (user) => {
  if (!user) return null;

  const role = user.Rol || {};
  const nivelJerarquia = Number(role.nivel_jerarquia ?? user.nivel_jerarquia ?? 0);

  return {
    ...user,
    nivel_jerarquia: nivelJerarquia,
    Rol: {
      ...role,
      nivel_jerarquia: nivelJerarquia,
    },
  };
};

export const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY) || '';
  if (!token) return '';

  if (isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(CART_KEY, '0');
    emitter.emit('session-changed', null);
    emitter.emit('cart-updated', 0);
    return '';
  }

  return token;
};

export const getStoredUser = () => {
  try {
    if (!getToken()) {
      return null;
    }

    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? normalizeStoredUser(JSON.parse(rawUser)) : null;
  } catch {
    return null;
  }
};

export const saveSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(normalizeStoredUser(user)));
  }

  emitter.emit('session-changed', normalizeStoredUser(user));
};

export const updateStoredUser = (user) => {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    emitter.emit('session-changed', null);
    return;
  }

  const normalizedUser = normalizeStoredUser(user);
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  emitter.emit('session-changed', normalizedUser);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.setItem(CART_KEY, '0');
  emitter.emit('session-changed', null);
  emitter.emit('cart-updated', 0);
};

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getUserHierarchyLevel = (user) =>
  Number(user?.Rol?.nivel_jerarquia ?? user?.nivel_jerarquia ?? 0);

export const isAdminUser = (user) => getUserHierarchyLevel(user) >= 2;
