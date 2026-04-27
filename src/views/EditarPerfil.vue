<template>
  <div class="profile-page">
    <div class="profile-card">
      <p class="eyebrow">Perfil</p>
      <h1>Configurar cuenta</h1>

      <div class="avatar-shell">
        <img :src="avatarUrl" alt="Avatar" class="avatar-image" />
        <label class="upload-button">
          <Camera :size="18" />
          <input type="file" hidden accept="image/*" @change="handleFile" />
        </label>
      </div>

      <form class="profile-form" @submit.prevent="saveChanges">
        <label>
          Nombre
          <input v-model.trim="userForm.nombre" type="text" />
        </label>

        <label>
          Apellido
          <input v-model.trim="userForm.apellido" type="text" />
        </label>

        <label class="full-width">
          Telefono
          <input v-model.trim="userForm.telefono" type="text" />
        </label>

        <div class="actions full-width">
          <button class="ghost-button" type="button" @click="router.push('/')">Cancelar</button>
          <button class="primary-button" type="submit" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </form>

      <p v-if="feedback" :class="['feedback', { error: isError }]">{{ feedback }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Camera } from 'lucide-vue-next';
import { buildImageUrl } from '../utils/api';
import { authHeaders, getStoredUser, updateStoredUser } from '../utils/session';

const router = useRouter();
const storedUser = getStoredUser();

const userForm = ref({
  nombre: '',
  apellido: '',
  telefono: '',
  avatar_url: '',
});

const selectedFile = ref(null);
const previewUrl = ref('');
const loading = ref(false);
const feedback = ref('');
const isError = ref(false);

onMounted(() => {
  if (storedUser) {
    userForm.value = {
      nombre: storedUser.nombre || '',
      apellido: storedUser.apellido || '',
      telefono: storedUser.telefono || '',
      avatar_url: storedUser.avatar_url || '',
    };
  }
});

const avatarUrl = computed(() =>
  previewUrl.value ||
  buildImageUrl(
    userForm.value.avatar_url,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(`${userForm.value.nombre} ${userForm.value.apellido}`.trim() || 'Neo')}&background=0f172a&color=fff`,
  ),
);

const handleFile = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
};

const saveChanges = async () => {
  loading.value = true;
  feedback.value = '';
  isError.value = false;

  const formData = new FormData();
  formData.append('nombre', userForm.value.nombre);
  formData.append('apellido', userForm.value.apellido);
  formData.append('telefono', userForm.value.telefono);

  if (selectedFile.value) {
    formData.append('avatar', selectedFile.value);
  }

  try {
    const response = await fetch('http://localhost:3000/api/perfil', {
      method: 'PUT',
      headers: authHeaders(),
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'No se pudo actualizar el perfil.');
    }

    updateStoredUser(payload);
    feedback.value = 'Perfil actualizado correctamente.';
    router.push('/');
  } catch (error) {
    isError.value = true;
    feedback.value = error.message || 'No se pudo actualizar el perfil.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
}

.profile-card {
  width: min(560px, 100%);
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

.profile-card h1 {
  margin: 0;
}

.avatar-shell {
  position: relative;
  width: 132px;
  height: 132px;
  margin: 1.4rem auto;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 28px;
  object-fit: cover;
}

.upload-button {
  position: absolute;
  right: -4px;
  bottom: -4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
  cursor: pointer;
}

.profile-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.profile-form label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

.profile-form input {
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
  padding: 0 1rem;
  color: inherit;
}

.full-width {
  grid-column: 1 / -1;
}

.actions {
  display: flex;
  gap: 14px;
}

.ghost-button,
.primary-button {
  flex: 1;
  min-height: 48px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 700;
}

.ghost-button {
  background: rgba(15, 23, 42, 0.08);
}

.primary-button {
  color: white;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.feedback {
  margin: 1rem 0 0;
  color: #0284c7;
  font-weight: 600;
}

.feedback.error {
  color: #be123c;
}

:global(.dark) .profile-card,
:global(.dark) .profile-form input {
  background: rgba(7, 14, 34, 0.78);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

:global(.dark) .ghost-button {
  background: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

@media (max-width: 720px) {
  .profile-form {
    grid-template-columns: 1fr;
  }
}
</style>
