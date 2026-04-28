<template>
  <div :class="['app-shell', { dark: isDarkMode }]">
    <div class="aurora aurora-left"></div>
    <div class="aurora aurora-right"></div>

    <nav class="sticky-nav">
      <div class="nav-container">
        <div class="nav-content">
          <div class="nav-left">
            <RouterLink to="/" class="brand">
              <span class="brand-ring"></span>
              <span class="brand-text">NeoGaming</span>
            </RouterLink>

            <div class="nav-links">
              <RouterLink to="/" class="nav-link">Store</RouterLink>
              <RouterLink v-if="usuario" to="/carrito" class="nav-link nav-link-cart">
                Carrito
                <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
              </RouterLink>
              <RouterLink v-if="isAdmin" to="/admin" class="nav-link">Admin</RouterLink>
              <RouterLink v-if="isAdmin" to="/admin/usuarios" class="nav-link">Usuarios</RouterLink>
              <RouterLink v-if="isAdmin" to="/admin/productos" class="nav-link">Productos</RouterLink>
            </div>
          </div>

          <div class="nav-right">
            <button @click="toggleDarkMode" class="icon-button" type="button" :title="isDarkMode ? 'Modo claro' : 'Modo oscuro'">
              <Sun v-if="isDarkMode" :size="18" />
              <Moon v-else :size="18" />
            </button>

            <template v-if="usuario">
              <button class="icon-button cart-pill" type="button" @click="router.push('/carrito')">
                <ShoppingCart :size="18" />
                <span class="cart-count">{{ cartCount }}</span>
              </button>

              <button @click="cerrarSesion" class="icon-button logout-button" type="button" title="Cerrar sesion">
                <LogOut :size="18" />
              </button>

              <button class="profile-pill" type="button" @click="router.push('/editar-perfil')">
                <img
                  :src="avatarUrl"
                  :alt="usuario.nombre || 'Usuario'"
                  class="avatar-image"
                />
                <span class="profile-copy">
                  <strong>{{ usuario.nombre }}</strong>
                  <small>{{ roleLabel }}</small>
                </span>
              </button>
            </template>

            <template v-else>
              <RouterLink to="/login" class="ghost-link">Entrar</RouterLink>
              <RouterLink to="/registro" class="solid-link">Crear cuenta</RouterLink>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <main class="page-shell">
      <RouterView />
    </main>

    <footer class="main-footer">
      <div class="nav-container footer-content">
        <p>NeoGaming 2026. Checkout con ITBIS automatico y panel operativo listo para venta.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { LogOut, Moon, ShoppingCart, Sun } from 'lucide-vue-next';
import emitter from './utils/emitter';
import { apiFetch, buildImageUrl } from './utils/api';
import { clearSession, getStoredUser, getToken, isAdminUser, updateStoredUser } from './utils/session';
import { getStoredCartCount, syncCartCount } from './utils/cart';

const router = useRouter();
const usuario = ref(getStoredUser());
const isDarkMode = ref(localStorage.getItem('theme') !== 'light');
const cartCount = ref(getStoredCartCount());

const avatarUrl = computed(() =>
  buildImageUrl(
    usuario.value?.avatar_url,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.value?.nombre || 'Neo')}&background=0f172a&color=fff`,
  ),
);

const isAdmin = computed(() => isAdminUser(usuario.value));

const roleLabel = computed(() => {
  if (Number(usuario.value?.id_rol) === 3) return 'Administrador';
  if (Number(usuario.value?.id_rol) === 2) return 'Gerente de operaciones';
  return 'Cliente';
});

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
};

const cargarSesion = async () => {
  const token = getToken();

  if (!token) {
    usuario.value = null;
    cartCount.value = 0;
    return;
  }

  try {
    const perfil = await apiFetch('/perfil', {
      headers: { Authorization: `Bearer ${token}` },
    });
    usuario.value = perfil;
    updateStoredUser(perfil);
  } catch {
    clearSession();
    usuario.value = null;
  }

  cartCount.value = await syncCartCount();
};

const cerrarSesion = () => {
  clearSession();
  usuario.value = null;
  cartCount.value = 0;
  router.push('/login');
};

let offSession;
let offCart;

onMounted(async () => {
  offSession = emitter.on('session-changed', (payload) => {
    usuario.value = payload;
  });

  offCart = emitter.on('cart-updated', (payload) => {
    cartCount.value = Number(payload) || 0;
  });

  await cargarSesion();
});

onUnmounted(() => {
  offSession?.();
  offCart?.();
});
</script>

<style>
:root {
  --primary: #31c6ff;
  --primary-strong: #0ea5e9;
  --surface-light: rgba(255, 255, 255, 0.82);
  --surface-dark: rgba(4, 9, 24, 0.78);
  --surface-dark-strong: rgba(6, 13, 34, 0.92);
  --border-light: rgba(255, 255, 255, 0.35);
  --border-dark: rgba(148, 163, 184, 0.12);
  --text-light: #eff6ff;
  --text-dark: #081121;
  --muted-light: #51607a;
  --muted-dark: #94a3b8;
  --danger: #fb7185;
  --success: #34d399;
  --shadow-glow: 0 18px 50px rgba(14, 165, 233, 0.18);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(49, 198, 255, 0.12), transparent 32%),
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 28%),
    linear-gradient(180deg, #eef6ff 0%, #dfeaf7 100%);
  color: var(--text-dark);
  overflow-x: hidden;
}

.app-shell.dark {
  background:
    radial-gradient(circle at top left, rgba(49, 198, 255, 0.16), transparent 32%),
    radial-gradient(circle at top right, rgba(34, 211, 238, 0.12), transparent 30%),
    linear-gradient(180deg, #030713 0%, #081226 55%, #040812 100%);
  color: var(--text-light);
}

.aurora {
  position: fixed;
  inset: auto;
  width: 28rem;
  height: 28rem;
  border-radius: 999px;
  filter: blur(90px);
  opacity: 0.45;
  pointer-events: none;
  z-index: 0;
}

.aurora-left {
  top: -6rem;
  left: -8rem;
  background: rgba(14, 165, 233, 0.24);
}

.aurora-right {
  top: 4rem;
  right: -10rem;
  background: rgba(99, 102, 241, 0.18);
}

.sticky-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(22px);
  background: var(--surface-light);
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.dark .sticky-nav {
  background: var(--surface-dark);
  border-bottom-color: var(--border-dark);
}

.nav-container,
.page-shell,
.footer-content {
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 76px;
}

.nav-left,
.nav-right,
.nav-links {
  display: flex;
  align-items: center;
}

.nav-left {
  gap: 1.5rem;
}

.nav-links {
  gap: 0.9rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.brand-ring {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(49, 198, 255, 0.85);
  box-shadow: 0 0 0 5px rgba(49, 198, 255, 0.14);
}

.brand-text {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.nav-link,
.ghost-link,
.solid-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.nav-link {
  color: inherit;
  background: transparent;
}

.nav-link:hover,
.router-link-active.nav-link {
  background: rgba(49, 198, 255, 0.12);
  transform: translateY(-1px);
}

.ghost-link {
  color: inherit;
}

.solid-link {
  color: white;
  background: linear-gradient(135deg, var(--primary-strong), #2563eb);
  box-shadow: var(--shadow-glow);
}

.nav-right {
  gap: 0.75rem;
}

.icon-button,
.profile-pill {
  border: 1px solid transparent;
  cursor: pointer;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.62);
  color: inherit;
}

.dark .icon-button {
  background: rgba(15, 23, 42, 0.7);
  border-color: rgba(49, 198, 255, 0.08);
}

.cart-pill {
  width: auto;
  padding: 0 0.9rem;
  gap: 0.45rem;
}

.cart-count,
.cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee, #2563eb);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
}

.cart-badge {
  position: absolute;
  top: -0.2rem;
  right: -0.15rem;
}

.profile-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.3rem 0.75rem 0.3rem 0.35rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.6);
  color: inherit;
}

.dark .profile-pill {
  background: rgba(15, 23, 42, 0.75);
  border-color: rgba(49, 198, 255, 0.08);
}

.avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  object-fit: cover;
}

.profile-copy {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.profile-copy small {
  opacity: 0.7;
}

.logout-button:hover {
  color: var(--danger);
}

.page-shell {
  position: relative;
  z-index: 1;
  padding: 28px 0 56px;
}

.main-footer {
  position: relative;
  z-index: 1;
  padding: 1rem 0 2rem;
}

.footer-content {
  padding: 1rem 1.25rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.26);
  color: var(--muted-light);
}

.dark .footer-content {
  background: rgba(8, 16, 35, 0.72);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--muted-dark);
}

@media (max-width: 920px) {
  .nav-content {
    flex-direction: column;
    align-items: stretch;
    padding: 14px 0;
  }

  .nav-left,
  .nav-right,
  .nav-links {
    flex-wrap: wrap;
  }

  .nav-right {
    justify-content: space-between;
  }

  .profile-copy {
    display: none;
  }
}
</style>
