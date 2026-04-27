import emitter from './emitter';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';

export const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

export const saveSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  emitter.emit('session-changed', user || null);
};

export const updateStoredUser = (user) => {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    emitter.emit('session-changed', null);
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitter.emit('session-changed', user);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.setItem('cart-count', '0');
  emitter.emit('session-changed', null);
  emitter.emit('cart-updated', 0);
};

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const isAdminUser = (user) => [2, 3].includes(Number(user?.id_rol));
