import emitter from './emitter';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

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

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';

export const getStoredUser = () => {
  try {
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
  localStorage.setItem('cart-count', '0');
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
