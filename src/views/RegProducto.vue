<template>
  <div class="product-admin-page">
    <section class="panel-card form-card">
      <p class="eyebrow">Catalogo</p>
      <h1>{{ editMode ? 'Editar producto' : 'Registrar producto' }}</h1>

      <div v-if="imagePreview" class="preview-shell">
        <img :src="imagePreview" alt="Preview" />
      </div>

      <form class="product-form" @submit.prevent="handleSubmit">
        <label>
          Titulo
          <input v-model.trim="producto.titulo" type="text" required />
        </label>

        <label>
          Tipo de producto
          <input v-model.number="producto.id_tipo_producto" min="1" type="number" required />
        </label>

        <label>
          Fabricante
          <input v-model.number="producto.id_fabricante" min="1" type="number" />
        </label>

        <label>
          Precio base
          <input v-model.number="producto.precio" min="0" step="0.01" type="number" />
        </label>

        <label class="full-width">
          Descripcion
          <textarea v-model.trim="producto.descripcion"></textarea>
        </label>

        <label class="full-width">
          Imagen del producto
          <input type="file" accept="image/*" @change="handleFileUpload" />
        </label>

        <div class="actions full-width">
          <button class="primary-button" type="submit">
            {{ editMode ? 'Guardar cambios' : 'Registrar producto' }}
          </button>
          <button v-if="editMode" class="ghost-button" type="button" @click="resetForm">Cancelar</button>
        </div>
      </form>

      <p v-if="mensaje" :class="['feedback', { error: esError }]">{{ mensaje }}</p>
    </section>

    <section class="panel-card table-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Gestion</p>
          <h2>Productos registrados</h2>
        </div>
        <button class="ghost-button" type="button" @click="obtenerProductos">Recargar</button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Titulo</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in listaProductos" :key="item.id_producto">
              <td>
                <img :src="buildImageUrl(item.imagen_url, `https://picsum.photos/seed/${item.id_producto}/80/80`)" :alt="item.titulo" class="thumb" />
              </td>
              <td>{{ item.titulo }}</td>
              <td>{{ formatCurrency(item.precio) }}</td>
              <td class="action-row">
                <button class="table-button" type="button" @click="prepararEdicion(item)">Editar</button>
                <button class="delete-button" type="button" @click="eliminarProducto(item.id_producto)">Desactivar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiFetch, buildImageUrl, formatCurrency } from '../utils/api';
import { authHeaders } from '../utils/session';

const listaProductos = ref([]);
const mensaje = ref('');
const esError = ref(false);
const editMode = ref(false);
const productoActualId = ref(null);
const selectedFile = ref(null);
const imagePreview = ref('');

const emptyProduct = () => ({
  id_tipo_producto: 1,
  titulo: '',
  id_fabricante: null,
  descripcion: '',
  precio: 0,
});

const producto = ref(emptyProduct());

const mostrarMensaje = (texto, error = false) => {
  mensaje.value = texto;
  esError.value = error;
};

const handleFileUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  selectedFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
};

const obtenerProductos = async () => {
  try {
    listaProductos.value = await apiFetch('/productos');
  } catch (error) {
    mostrarMensaje(error.message || 'No se pudieron cargar los productos.', true);
  }
};

const handleSubmit = async () => {
  const formData = new FormData();
  formData.append('id_tipo_producto', producto.value.id_tipo_producto);
  formData.append('titulo', producto.value.titulo);
  formData.append('descripcion', producto.value.descripcion || '');
  formData.append('precio', producto.value.precio || 0);

  if (producto.value.id_fabricante) {
    formData.append('id_fabricante', producto.value.id_fabricante);
  }

  if (selectedFile.value) {
    formData.append('imagen', selectedFile.value);
  }

  try {
    const endpoint = editMode.value ? `/productos/${productoActualId.value}` : '/productos';
    const response = await fetch(`http://localhost:3000/api${endpoint}`, {
      method: editMode.value ? 'PUT' : 'POST',
      headers: authHeaders(),
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'No se pudo guardar el producto.');
    }

    mostrarMensaje(editMode.value ? 'Producto actualizado.' : 'Producto registrado.');
    resetForm();
    await obtenerProductos();
  } catch (error) {
    mostrarMensaje(error.message || 'No se pudo guardar el producto.', true);
  }
};

const prepararEdicion = (item) => {
  editMode.value = true;
  productoActualId.value = item.id_producto;
  producto.value = {
    id_tipo_producto: item.id_tipo_producto || 1,
    titulo: item.titulo || '',
    id_fabricante: item.id_fabricante || null,
    descripcion: item.descripcion || '',
    precio: Number(item.precio || 0),
  };
  imagePreview.value = buildImageUrl(item.imagen_url);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const eliminarProducto = async (idProducto) => {
  try {
    await apiFetch(`/productos/${idProducto}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    mostrarMensaje('Producto desactivado.');
    await obtenerProductos();
  } catch (error) {
    mostrarMensaje(error.message || 'No se pudo desactivar el producto.', true);
  }
};

const resetForm = () => {
  editMode.value = false;
  productoActualId.value = null;
  producto.value = emptyProduct();
  selectedFile.value = null;
  imagePreview.value = '';
};

onMounted(obtenerProductos);
</script>

<style scoped>
.product-admin-page {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
}

.panel-card {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(22px);
  padding: 22px;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.form-card h1,
.table-card h2 {
  margin-top: 0;
}

.preview-shell {
  margin: 1rem 0;
  border-radius: 22px;
  overflow: hidden;
}

.preview-shell img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.product-form {
  display: grid;
  gap: 14px;
}

.product-form label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

.product-form input,
.product-form textarea {
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
  padding: 0 1rem;
  color: black; /*previo inherit*/
}

.product-form textarea {
  min-height: 120px;
  padding: 1rem;
  resize: vertical;
}

.full-width {
  width: 100%;
}

.actions,
.section-heading,
.action-row {
  display: flex;
  gap: 12px;
}

.section-heading {
  justify-content: space-between;
  align-items: center;
}

.primary-button,
.ghost-button,
.table-button,
.delete-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button,
.table-button {
  padding: 0 1rem;
  color: white;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.ghost-button {
  padding: 0 1rem;
  background: rgba(15, 23, 42, 0.08);
}

.delete-button {
  padding: 0 1rem;
  background: rgba(244, 63, 94, 0.12);
  color: #be123c;
}

.feedback {
  margin-bottom: 0;
  color: #0284c7;
  font-weight: 600;
}

.feedback.error {
  color: #be123c;
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
  padding: 0.95rem 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  text-align: left;
}

th {
  color: var(--muted-light);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.thumb {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  object-fit: cover;
}

:global(.dark) .panel-card,
:global(.dark) .product-form input,
:global(.dark) .product-form textarea {
  background: rgba(7, 14, 34, 0.78);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

:global(.dark) th {
  color: var(--muted-dark);
}

:global(.dark) .ghost-button {
  background: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

@media (max-width: 1020px) {
  .product-admin-page {
    grid-template-columns: 1fr;
  }
}
</style>
