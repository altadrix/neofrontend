import emitter from './emitter';
import { apiFetch } from './api';
import { authHeaders, getToken } from './session';

const CART_COUNT_KEY = 'cart-count';

export const getStoredCartCount = () => Number(localStorage.getItem(CART_COUNT_KEY) || 0);

export const setStoredCartCount = (count) => {
  const safeCount = Number(count) || 0;
  localStorage.setItem(CART_COUNT_KEY, String(safeCount));
  emitter.emit('cart-updated', safeCount);
  return safeCount;
};

export const syncCartCount = async () => {
  if (!getToken()) {
    return setStoredCartCount(0);
  }

  try {
    const cart = await apiFetch('/carrito', {
      headers: authHeaders(),
    });

    return setStoredCartCount(cart.cantidadItems);
  } catch {
    return getStoredCartCount();
  }
};
