import { createRouter, createWebHistory } from 'vue-router';
import { apiFetch } from '../utils/api';
import { clearSession, getStoredUser, getToken, isAdminUser, updateStoredUser } from '../utils/session';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue'),
    },
    {
      path: '/login',
      alias: ['/Login'],
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/registro',
      alias: ['/RegistroUsuario'],
      name: 'RegistroUsuario',
      component: () => import('../views/RegistroUsuario.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/producto/:id',
      name: 'DetalleProducto',
      component: () => import('../views/DetalleProducto.vue'),
      props: true,
    },
    {
      path: '/carrito',
      alias: ['/Carrito'],
      name: 'Carrito',
      component: () => import('../views/Carrito.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/checkout',
      name: 'Checkout',
      component: () => import('../views/Checkout.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/editar-perfil',
      alias: ['/EditarPerfil'],
      name: 'EditarPerfil',
      component: () => import('../views/EditarPerfil.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      alias: ['/dashboard'],
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/productos',
      alias: ['/RegProducto'],
      name: 'RegProducto',
      component: () => import('../views/RegProducto.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/usuarios',
      name: 'AdminUsuarios',
      component: () => import('../views/UserManagement.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const token = getToken();
  let user = getStoredUser();

  if (token && !user) {
    try {
      user = await apiFetch('/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      });
      updateStoredUser(user);
    } catch {
      clearSession();
      user = null;
    }
  }

  if (to.meta.guestOnly && token) {
    return { name: 'home' };
  }

  if (to.meta.requiresAuth && !token) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath },
    };
  }

  if (to.meta.requiresAdmin && !isAdminUser(user)) {
    return { name: 'home' };
  }

  return true;
});

export default router;
