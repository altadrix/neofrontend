<template>
  <section class="users-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Gestion de usuarios</p>
        <h1>Panel de usuarios NeoGaming</h1>
      </div>
      <button class="ghost-button" type="button" @click="loadUsers">
        <RefreshCw :size="16" />
        Recargar
      </button>
    </header>

    <div v-if="loading" class="status-card">Cargando usuarios...</div>
    <div v-else-if="error" class="status-card error">{{ error }}</div>

    <template v-else>
      <section class="filters-card">
        <label>
          Buscar
          <input v-model.trim="search" type="text" placeholder="Nombre, apellido o email" />
        </label>

        <label>
          Rol
          <select v-model="roleFilter">
            <option value="all">Todos</option>
            <option value="1">Usuarios</option>
            <option v-if="!isManager" value="2">Administradores</option>
            <option v-if="!isManager" value="3">Gerentes</option>
          </select>
        </label>

        <label>
          Estado
          <select v-model="statusFilter">
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </label>
      </section>

      <section class="table-card">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Contacto</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id_usuario">
                <td>
                  <div class="user-cell">
                    <img
                      :src="buildImageUrl(user.avatar_url, `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || 'Neo')}&background=0f172a&color=fff`)"
                      :alt="user.nombre || 'Usuario'"
                    />
                    <div>
                      <strong>{{ user.nombre }} {{ user.apellido }}</strong>
                      <small>#{{ user.id_usuario }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span>{{ user.email }}</span>
                  <small>{{ user.telefono || 'Sin telefono' }}</small>
                </td>
                <td>{{ roleLabel(user.id_rol) }}</td>
                <td>
                  <span class="status-pill" :class="{ inactive: user.activo === false }">
                    {{ user.activo === false ? 'Inactivo' : 'Activo' }}
                  </span>
                </td>
                <td>
                  <button class="table-button" type="button" @click="openEditor(user)">
                    <Pencil :size="15" />
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <div v-if="editingUser" class="editor-overlay">
      <article class="editor-card">
        <header>
          <h2>Editar usuario</h2>
          <button class="icon-ghost" type="button" @click="closeEditor">
            <X :size="18" />
          </button>
        </header>

        <form class="editor-grid" @submit.prevent="saveUser">
          <label>
            Nombre
            <input v-model.trim="editorForm.nombre" required type="text" />
          </label>
          <label>
            Apellido
            <input v-model.trim="editorForm.apellido" required type="text" />
          </label>
          <label>
            Email
            <input v-model.trim="editorForm.email" required type="email" />
          </label>
          <label>
            Telefono
            <input v-model.trim="editorForm.telefono" type="text" />
          </label>
          <label class="full-width">
            Rol
            <select v-model.number="editorForm.id_rol" :disabled="isManager">
              <option value="1">Usuario</option>
              <option v-if="!isManager" value="2">Administrador</option>
              <option v-if="!isManager" value="3">Gerente</option>
            </select>
          </label>
          <label class="full-width check-row">
            <input v-model="editorForm.activo" type="checkbox" />
            Cuenta activa
          </label>

          <div class="action-row full-width">
            <button class="ghost-button" type="button" @click="closeEditor">Cancelar</button>
            <button class="primary-button" :disabled="saving" type="submit">
              <Save :size="16" />
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </article>
    </div>

    <p v-if="feedback" class="feedback">{{ feedback }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { Pencil, RefreshCw, Save, X } from 'lucide-vue-next';
import { apiFetch, buildImageUrl } from '../utils/api';
import { authHeaders, getStoredUser } from '../utils/session';

const users = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const feedback = ref('');
const search = ref('');
const roleFilter = ref('all');
const statusFilter = ref('all');
const editingUser = ref(null);
const editorForm = ref({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  id_rol: 1,
  activo: true,
});

const currentUser = getStoredUser();
const isManager = computed(() => Number(currentUser?.id_rol) === 3);

const loadUsers = async () => {
  loading.value = true;
  error.value = '';
  feedback.value = '';
  try {
    users.value = await apiFetch('/admin/usuarios', { headers: authHeaders() });
  } catch (err) {
    error.value = err.message || 'No se pudo cargar la lista de usuarios.';
  } finally {
    loading.value = false;
  }
};

const roleLabel = (idRol) => {
  if (Number(idRol) === 2) return 'Administrador';
  if (Number(idRol) === 3) return 'Gerente';
  return 'Usuario';
};

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    if (roleFilter.value !== 'all' && Number(user.id_rol) !== Number(roleFilter.value)) return false;

    if (statusFilter.value === 'active' && user.activo === false) return false;
    if (statusFilter.value === 'inactive' && user.activo !== false) return false;

    const searchTerm = search.value.toLowerCase();
    if (!searchTerm) return true;

    return [user.nombre, user.apellido, user.email].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(searchTerm),
    );
  }),
);

const openEditor = (user) => {
  editingUser.value = user;
  editorForm.value = {
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    email: user.email || '',
    telefono: user.telefono || '',
    id_rol: Number(user.id_rol || 1),
    activo: user.activo !== false,
  };
};

const closeEditor = () => {
  editingUser.value = null;
};

const saveUser = async () => {
  if (!editingUser.value) return;
  saving.value = true;
  feedback.value = '';
  try {
    const payload = {
      ...editorForm.value,
      id_rol: isManager.value ? 1 : Number(editorForm.value.id_rol),
    };

    const result = await apiFetch(`/admin/usuarios/${editingUser.value.id_usuario}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    users.value = users.value.map((item) =>
      item.id_usuario === editingUser.value.id_usuario ? result.user : item,
    );
    feedback.value = 'Usuario actualizado correctamente.';
    closeEditor();
  } catch (err) {
    feedback.value = err.message || 'No se pudo actualizar el usuario.';
  } finally {
    saving.value = false;
  }
};

onMounted(loadUsers);
</script>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header,
.filters-card,
.user-cell,
.action-row {
  display: flex;
  align-items: center;
}

.page-header,
.action-row {
  justify-content: space-between;
}

.page-header h1,
.editor-card h2 {
  margin: 0;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ghost-button,
.table-button,
.primary-button,
.icon-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  justify-content: center;
  min-height: 40px;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
}

.ghost-button,
.icon-ghost {
  background: rgba(15, 23, 42, 0.08);
}

.table-button,
.primary-button {
  color: white;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.status-card,
.filters-card,
.table-card,
.editor-card {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(22px);
}

.status-card,
.filters-card,
.table-card,
.editor-card {
  padding: 1rem;
}

.status-card.error {
  color: #be123c;
}

.filters-card {
  gap: 0.8rem;
  flex-wrap: wrap;
}

.filters-card label,
.editor-grid label {
  display: grid;
  gap: 0.35rem;
}

.filters-card input,
.filters-card select,
.editor-grid input,
.editor-grid select {
  min-height: 40px;
  min-width: 220px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.8);
  padding: 0 0.75rem;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  text-align: left;
  padding: 0.75rem;
}

.user-cell {
  gap: 0.7rem;
}

.user-cell img {
  width: 42px;
  height: 42px;
  border-radius: 12px;
}

.user-cell strong,
.user-cell small,
td small {
  display: block;
}

.status-pill {
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.16);
  color: #166534;
  padding: 0.25rem 0.65rem;
}

.status-pill.inactive {
  background: rgba(244, 63, 94, 0.18);
  color: #be123c;
}

.editor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.5);
  display: grid;
  place-items: center;
  z-index: 40;
}

.editor-card {
  width: min(560px, calc(100% - 24px));
}

.editor-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.full-width {
  grid-column: 1 / -1;
}

.check-row {
  display: flex !important;
  align-items: center;
  gap: 0.6rem;
}

.check-row input {
  min-width: auto;
}

.feedback {
  margin: 0;
  color: #0284c7;
  font-weight: 600;
}

::global(.dark) .status-card,
::global(.dark) .filters-card,
::global(.dark) .table-card,
::global(.dark) .editor-card,
::global(.dark) .filters-card input,
::global(.dark) .filters-card select,
::global(.dark) .editor-grid input,
::global(.dark) .editor-grid select {
  background: rgba(7, 14, 34, 0.78);
  border-color: rgba(148, 163, 184, 0.1);
  color: var(--text-light);
}

::global(.dark) .ghost-button,
::global(.dark) .icon-ghost {
  background: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}
</style>
