<template>
  <div class="product-admin-page">
    <section class="panel-card form-card">
      <p class="eyebrow">Catalogo</p>
      <h1>{{ editMode ? 'Editar producto' : 'Registrar producto' }}</h1>

      <div v-if="imagePreview" class="preview-shell">
        <img :src="imagePreview" alt="Vista previa del producto" />
      </div>

      <form class="product-form" @submit.prevent="handleSubmit">
        <label>
          Titulo
          <input v-model.trim="producto.titulo" type="text" required />
        </label>

        <label>
          Tipo de producto
          <select v-model.number="producto.id_tipo_producto" required>
            <option value="" disabled>Selecciona un tipo</option>
            <option
              v-for="type in catalogs.tiposProducto"
              :key="type.id_tipo_producto"
              :value="type.id_tipo_producto"
            >
              {{ type.nombre }}
            </option>
          </select>
        </label>

        <label>
          Fabricante
          <select v-model.number="producto.id_fabricante">
            <option :value="null">Sin fabricante</option>
            <option
              v-for="fabricante in catalogs.fabricantes"
              :key="fabricante.id_fabricante"
              :value="fabricante.id_fabricante"
            >
              {{ fabricante.nombre }}
            </option>
          </select>
        </label>

        <label>
          Precio base
          <input v-model.number="producto.precio" min="0" step="0.01" type="number" required />
        </label>

        <label>
          Stock general
          <input v-model.number="producto.stock" min="0" step="1" type="number" required />
        </label>

        <label class="full-width">
          Descripcion
          <textarea v-model.trim="producto.descripcion"></textarea>
        </label>

        <template v-if="selectedTypeSlug === 'videojuego'">
          <label>
            Genero
            <select v-model.number="producto.id_genero" required>
              <option value="" disabled>Selecciona un genero</option>
              <option v-for="genero in catalogs.generos" :key="genero.id_genero" :value="genero.id_genero">
                {{ genero.nombre }}
              </option>
            </select>
          </label>

          <label>
            Plataforma
            <select v-model.number="producto.id_plataforma" required>
              <option value="" disabled>Selecciona una plataforma</option>
              <option
                v-for="plataforma in catalogs.plataformas"
                :key="plataforma.id_plataforma"
                :value="plataforma.id_plataforma"
              >
                {{ plataforma.nombre }}
              </option>
            </select>
          </label>

          <label>
            Fecha de lanzamiento
            <input v-model="producto.fecha_lanzamiento" type="date" />
          </label>

          <label class="full-width">
            Formatos disponibles
            <div class="checkbox-grid">
              <label v-for="formato in catalogs.formatos" :key="formato.id_formato" class="checkbox-pill">
                <input
                  :checked="producto.formatos.includes(formato.id_formato)"
                  type="checkbox"
                  @change="toggleFormato(formato.id_formato)"
                />
                {{ formato.nombre }}
              </label>
            </div>
          </label>
        </template>

        <template v-else-if="selectedTypeSlug === 'accesorio'">
          <label class="full-width">
            Tipo de accesorio
            <select v-model.number="producto.id_tipo_accesorio" required>
              <option value="" disabled>Selecciona un tipo</option>
              <option
                v-for="tipo in catalogs.tiposAccesorio"
                :key="tipo.id_tipo_accesorio"
                :value="tipo.id_tipo_accesorio"
              >
                {{ tipo.nombre }}
              </option>
            </select>
          </label>
        </template>

        <template v-else-if="selectedTypeSlug === 'coleccionable'">
          <label class="full-width">
            Tipo de coleccionable
            <select v-model.number="producto.id_tipo_coleccionable" required>
              <option value="" disabled>Selecciona un tipo</option>
              <option
                v-for="tipo in catalogs.tiposColeccionable"
                :key="tipo.id_tipo_coleccionable"
                :value="tipo.id_tipo_coleccionable"
              >
                {{ tipo.nombre }}
              </option>
            </select>
          </label>
        </template>

        <label class="full-width">
          Imagen del producto
          <input type="file" accept="image/*" @change="handleFileUpload" />
        </label>

        <label class="switch-row full-width">
          <input v-model="producto.activo" type="checkbox" />
          Producto activo
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
        <button class="ghost-button" type="button" @click="loadAdminData">Recargar</button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Titulo</th>
              <th>Tipo</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in listaProductos" :key="item.id_producto">
              <td>
                <img
                  :src="buildImageUrl(item.imagen_url, `https://picsum.photos/seed/${item.id_producto}/80/80`)"
                  :alt="item.titulo"
                  class="thumb"
                />
              </td>
              <td>{{ item.titulo }}</td>
              <td>{{ item.tipo_producto_nombre || 'Sin tipo' }}</td>
              <td>{{ formatCurrency(item.precio) }}</td>
              <td>{{ item.stock }}</td>
              <td class="action-row">
                <button class="table-button" type="button" @click="prepararEdicion(item)">Editar</button>
                <button class="delete-button" type="button" @click="eliminarProducto(item.id_producto)">Desactivar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel-card catalog-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Catalogos</p>
          <h2>Datos base editables</h2>
        </div>
      </div>

      <div class="catalog-toolbar">
        <label>
          Catalogo
          <select v-model="selectedCatalogKey">
            <option v-for="catalog in catalogOptions" :key="catalog.key" :value="catalog.key">
              {{ catalog.label }}
            </option>
          </select>
        </label>
      </div>

      <form class="catalog-form" @submit.prevent="saveCatalogItem">
        <label>
          Nombre
          <input v-model.trim="catalogForm.nombre" type="text" required />
        </label>

        <label v-if="selectedCatalogKey === 'municipios'">
          Provincia
          <select v-model.number="catalogForm.id_provincia" required>
            <option value="" disabled>Selecciona una provincia</option>
            <option
              v-for="provincia in catalogs.provincias"
              :key="provincia.id_provincia"
              :value="provincia.id_provincia"
            >
              {{ provincia.nombre }}
            </option>
          </select>
        </label>

        <div class="actions">
          <button class="primary-button" type="submit">
            {{ editingCatalogItem ? 'Guardar catalogo' : 'Crear registro' }}
          </button>
          <button v-if="editingCatalogItem" class="ghost-button" type="button" @click="resetCatalogForm">
            Cancelar
          </button>
        </div>
      </form>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th v-if="selectedCatalogKey === 'municipios'">Provincia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in selectedCatalogItems" :key="catalogItemKey(item)">
              <td>{{ item.nombre }}</td>
              <td v-if="selectedCatalogKey === 'municipios'">
                {{ provinciaNombre(item.id_provincia) }}
              </td>
              <td>
                <button class="table-button" type="button" @click="editCatalogItem(item)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { apiFetch, buildImageUrl, formatCurrency } from '../utils/api';
import { authHeaders } from '../utils/session';

const listaProductos = ref([]);
const catalogs = ref({
  tiposProducto: [],
  fabricantes: [],
  generos: [],
  plataformas: [],
  formatos: [],
  provincias: [],
  municipios: [],
  tiposAccesorio: [],
  tiposColeccionable: [],
});
const mensaje = ref('');
const esError = ref(false);
const editMode = ref(false);
const productoActualId = ref(null);
const selectedFile = ref(null);
const imagePreview = ref('');
const selectedCatalogKey = ref('fabricantes');
const editingCatalogItem = ref(null);
const catalogForm = ref({
  nombre: '',
  id_provincia: '',
});

const catalogOptions = [
  { key: 'fabricantes', label: 'Fabricantes' },
  { key: 'generos', label: 'Generos' },
  { key: 'plataformas', label: 'Plataformas' },
  { key: 'formatos', label: 'Formatos' },
  { key: 'tiposAccesorio', label: 'Tipos de accesorio' },
  { key: 'tiposColeccionable', label: 'Tipos de coleccionable' },
  { key: 'provincias', label: 'Provincias' },
  { key: 'municipios', label: 'Municipios' },
  { key: 'metodosPago', label: 'Metodos de pago' },
];

const emptyProduct = () => ({
  id_tipo_producto: '',
  titulo: '',
  id_fabricante: null,
  descripcion: '',
  precio: 0,
  stock: 0,
  activo: true,
  id_genero: '',
  id_plataforma: '',
  fecha_lanzamiento: '',
  formatos: [],
  id_tipo_accesorio: '',
  id_tipo_coleccionable: '',
});

const producto = ref(emptyProduct());

const selectedType = computed(
  () =>
    catalogs.value.tiposProducto.find(
      (type) => Number(type.id_tipo_producto) === Number(producto.value.id_tipo_producto),
    ) || null,
);

const selectedTypeSlug = computed(() =>
  selectedType.value?.nombre?.toLowerCase().replace(/\s+/g, '') || '',
);

const selectedCatalogItems = computed(() => catalogs.value[selectedCatalogKey.value] || []);

const mostrarMensaje = (texto, error = false) => {
  mensaje.value = texto;
  esError.value = error;
};

const provinciaNombre = (idProvincia) =>
  catalogs.value.provincias.find((provincia) => Number(provincia.id_provincia) === Number(idProvincia))?.nombre ||
  'Sin provincia';

const catalogItemKey = (item) =>
  Object.values(item).find((value) => typeof value === 'number') || JSON.stringify(item);

const catalogMeta = () =>
  ({
    fabricantes: { idField: 'id_fabricante' },
    generos: { idField: 'id_genero' },
    plataformas: { idField: 'id_plataforma' },
    formatos: { idField: 'id_formato' },
    provincias: { idField: 'id_provincia' },
    municipios: { idField: 'id_municipio' },
    tiposAccesorio: { idField: 'id_tipo_accesorio' },
    tiposColeccionable: { idField: 'id_tipo_coleccionable' },
    metodosPago: { idField: 'id_metodo_pago' },
  })[selectedCatalogKey.value];

const handleFileUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  selectedFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
};

const toggleFormato = (idFormato) => {
  const next = new Set(producto.value.formatos);
  if (next.has(idFormato)) {
    next.delete(idFormato);
  } else {
    next.add(idFormato);
  }
  producto.value.formatos = [...next];
};

const loadAdminData = async () => {
  try {
    const headers = authHeaders();
    const [products, catalogPayload] = await Promise.all([
      apiFetch('/productos'),
      apiFetch('/admin/catalogos', { headers }),
    ]);

    listaProductos.value = products;
    catalogs.value = {
      tiposProducto: catalogPayload.tiposProducto || [],
      fabricantes: catalogPayload.fabricantes || [],
      generos: catalogPayload.generos || [],
      plataformas: catalogPayload.plataformas || [],
      formatos: catalogPayload.formatos || [],
      provincias: catalogPayload.provincias || [],
      municipios: catalogPayload.municipios || [],
      tiposAccesorio: catalogPayload.tiposAccesorio || [],
      tiposColeccionable: catalogPayload.tiposColeccionable || [],
      metodosPago: catalogPayload.metodosPago || [],
    };
  } catch (error) {
    mostrarMensaje(error.message || 'No se pudieron cargar los datos administrativos.', true);
  }
};

const handleSubmit = async () => {
  const formData = new FormData();
  formData.append('id_tipo_producto', producto.value.id_tipo_producto);
  formData.append('titulo', producto.value.titulo);
  formData.append('descripcion', producto.value.descripcion || '');
  formData.append('precio', producto.value.precio || 0);
  formData.append('stock', producto.value.stock || 0);
  formData.append('activo', producto.value.activo);

  if (producto.value.id_fabricante) {
    formData.append('id_fabricante', producto.value.id_fabricante);
  }

  if (selectedTypeSlug.value === 'videojuego') {
    formData.append('id_genero', producto.value.id_genero);
    formData.append('id_plataforma', producto.value.id_plataforma);
    formData.append('fecha_lanzamiento', producto.value.fecha_lanzamiento || '');
    formData.append('formatos', JSON.stringify(producto.value.formatos));
  }

  if (selectedTypeSlug.value === 'accesorio') {
    formData.append('id_tipo_accesorio', producto.value.id_tipo_accesorio);
  }

  if (selectedTypeSlug.value === 'coleccionable') {
    formData.append('id_tipo_coleccionable', producto.value.id_tipo_coleccionable);
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
    await loadAdminData();
  } catch (error) {
    mostrarMensaje(error.message || 'No se pudo guardar el producto.', true);
  }
};

const prepararEdicion = (item) => {
  editMode.value = true;
  productoActualId.value = item.id_producto;
  producto.value = {
    id_tipo_producto: item.id_tipo_producto || '',
    titulo: item.titulo || '',
    id_fabricante: item.id_fabricante || null,
    descripcion: item.descripcion || '',
    precio: Number(item.precio || 0),
    stock: Number(item.stock || 0),
    activo: item.activo !== false,
    id_genero: item.VideoJuego?.id_genero || '',
    id_plataforma: item.VideoJuego?.id_plataforma || '',
    fecha_lanzamiento: item.VideoJuego?.fecha_lanzamiento || '',
    formatos: (item.formatos_disponibles || []).map((formato) => formato.id_formato),
    id_tipo_accesorio: item.Accesorio?.id_tipo_accesorio || '',
    id_tipo_coleccionable: item.Coleccionable?.id_tipo_coleccionable || '',
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
    await loadAdminData();
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

const resetCatalogForm = () => {
  editingCatalogItem.value = null;
  catalogForm.value = {
    nombre: '',
    id_provincia: '',
  };
};

const editCatalogItem = (item) => {
  editingCatalogItem.value = item;
  catalogForm.value = {
    nombre: item.nombre || '',
    id_provincia: item.id_provincia || '',
  };
};

const saveCatalogItem = async () => {
  try {
    const headers = authHeaders();
    const meta = catalogMeta();
    const payload = {
      nombre: catalogForm.value.nombre,
    };

    if (selectedCatalogKey.value === 'municipios') {
      payload.id_provincia = catalogForm.value.id_provincia;
    }

    if (editingCatalogItem.value) {
      await apiFetch(
        `/admin/catalogos/${selectedCatalogKey.value}/${editingCatalogItem.value[meta.idField]}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        },
      );
      mostrarMensaje('Catalogo actualizado.');
    } else {
      await apiFetch(`/admin/catalogos/${selectedCatalogKey.value}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      mostrarMensaje('Registro creado.');
    }

    resetCatalogForm();
    await loadAdminData();
  } catch (error) {
    mostrarMensaje(error.message || 'No se pudo guardar el catalogo.', true);
  }
};

onMounted(loadAdminData);
</script>

<style scoped>
.product-admin-page {
  display: grid;
  grid-template-columns: minmax(320px, 420px) 1fr;
  gap: 24px;
}

.panel-card {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(22px);
  padding: 22px;
}

.catalog-card {
  grid-column: 1 / -1;
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
.table-card h2,
.catalog-card h2 {
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

.product-form,
.catalog-form {
  display: grid;
  gap: 14px;
}

.product-form {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.product-form label,
.catalog-form label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

.product-form input,
.product-form textarea,
.product-form select,
.catalog-form input,
.catalog-form select {
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
  padding: 0 1rem;
  color: black;
}

.product-form textarea {
  min-height: 120px;
  padding: 1rem;
  resize: vertical;
}

.full-width {
  grid-column: 1 / -1;
}

.switch-row {
  display: flex !important;
  align-items: center;
  gap: 0.7rem;
}

.switch-row input {
  min-height: auto;
  width: auto;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.checkbox-pill {
  display: inline-flex !important;
  align-items: center;
  gap: 0.6rem;
  min-height: 44px;
  padding: 0 0.85rem;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.06);
}

.checkbox-pill input {
  min-height: auto;
  width: auto;
}

.actions,
.section-heading,
.action-row,
.catalog-toolbar {
  display: flex;
  gap: 12px;
}

.section-heading {
  justify-content: space-between;
  align-items: center;
}

.catalog-toolbar {
  margin-bottom: 1rem;
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
:global(.dark) .product-form textarea,
:global(.dark) .product-form select,
:global(.dark) .catalog-form input,
:global(.dark) .catalog-form select,
:global(.dark) .checkbox-pill {
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

@media (max-width: 1100px) {
  .product-admin-page,
  .product-form {
    grid-template-columns: 1fr;
  }
}
</style>
