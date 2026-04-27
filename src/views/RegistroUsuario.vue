<template>
  <div class="auth-page">
    <div class="auth-card">
      <p class="eyebrow">Registro</p>
      <h1>Crear cuenta de cliente</h1>
      <p class="subtitle">Las nuevas cuentas se crean con rol cliente y ya quedan listas para comprar.</p>

      <form class="auth-form" @submit.prevent="registrarUsuario">
        <label>
          Nombre
          <input v-model.trim="usuario.nombre" type="text" required />
        </label>

        <label>
          Apellido
          <input v-model.trim="usuario.apellido" type="text" required />
        </label>

        <label>
          Email
          <input v-model.trim="usuario.email" type="email" required />
        </label>

        <label>
          Telefono
          <input v-model.trim="usuario.telefono" type="text" />
        </label>

        <label>
          Contrasena
          <input v-model="usuario.contrasena" type="password" required />
        </label>

        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? 'Registrando...' : 'Crear cuenta' }}
        </button>
      </form>

      <p v-if="mensaje" :class="['feedback', { error: esError }]">{{ mensaje }}</p>
      <RouterLink to="/login" class="ghost-link">Ya tengo cuenta</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '../utils/api';

const router = useRouter();
const loading = ref(false);
const mensaje = ref('');
const esError = ref(false);

const usuario = ref({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  contrasena: '',
});

const registrarUsuario = async () => {
  loading.value = true;
  mensaje.value = '';
  esError.value = false;

  try {
    await apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario.value),
    });

    mensaje.value = 'Cuenta creada. Ahora puedes iniciar sesion.';
    router.push('/login');
  } catch (error) {
    esError.value = true;
    mensaje.value = error.message || 'No se pudo registrar el usuario.';
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
  width: min(520px, 100%);
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
