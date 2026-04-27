<template>
  <div class="auth-page">
    <div class="auth-card">
      <p class="eyebrow">Acceso</p>
      <h1>Iniciar sesion en NeoGaming</h1>
      <p class="subtitle">El navbar y las rutas protegidas se sincronizan en cuanto la sesion queda guardada.</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <label>
          Email
          <input v-model.trim="credenciales.email" type="email" placeholder="ejemplo@correo.com" required />
        </label>

        <label>
          Contrasena
          <input v-model="credenciales.contrasena" type="password" placeholder="Tu clave" required />
        </label>

        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? 'Validando...' : 'Entrar' }}
        </button>
      </form>

      <p v-if="mensaje" :class="['feedback', { error: esError }]">{{ mensaje }}</p>

      <RouterLink to="/registro" class="ghost-link">Crear cuenta</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '../utils/api';
import { saveSession } from '../utils/session';
import { syncCartCount } from '../utils/cart';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const mensaje = ref('');
const esError = ref(false);

const credenciales = ref({
  email: '',
  contrasena: '',
});

const handleLogin = async () => {
  loading.value = true;
  mensaje.value = '';
  esError.value = false;

  try {
    const data = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify(credenciales.value),
    });

    saveSession(data);
    await syncCartCount();

    mensaje.value = 'Sesion iniciada correctamente.';
    router.replace(String(route.query.redirect || '/'));
  } catch (error) {
    esError.value = true;
    mensaje.value = error.message || 'No se pudo iniciar sesion.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
}

.auth-card {
  width: min(460px, 100%);
  padding: 2rem;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(22px);
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.auth-card h1,
.subtitle {
  margin: 0;
}

.subtitle {
  margin-top: 0.7rem;
  color: var(--muted-light);
  line-height: 1.6;
}

.auth-form {
  display: grid;
  gap: 14px;
  margin-top: 1.5rem;
}

.auth-form label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

.auth-form input {
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
  padding: 0 1rem;
  color: inherit;
}

.primary-button,
.ghost-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-radius: 16px;
  text-decoration: none;
  font-weight: 700;
  border: none;
}

.primary-button {
  color: white;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  cursor: pointer;
}

.ghost-link {
  width: 100%;
  margin-top: 0.9rem;
  background: rgba(15, 23, 42, 0.08);
  color: inherit;
}

.feedback {
  margin: 1rem 0 0;
  color: #0284c7;
  font-weight: 600;
}

.feedback.error {
  color: #be123c;
}

:global(.dark) .auth-card,
:global(.dark) .auth-form input {
  background: rgba(7, 14, 34, 0.78);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

:global(.dark) .subtitle {
  color: var(--muted-dark);
}

:global(.dark) .ghost-link {
  background: rgba(148, 163, 184, 0.08);
}
</style>
