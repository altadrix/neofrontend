<template>
  <div class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Panel administrativo</p>
        <h1>Control operativo NeoGaming</h1>
      </div>
      <button class="ghost-button" type="button" @click="loadAdminData">Recargar</button>
    </header>

    <div v-if="loading" class="status-card">Cargando panel administrativo...</div>
    <div v-else-if="error" class="status-card error">{{ error }}</div>

    <template v-else>
      <section class="stats-grid">
        <article class="stat-card">
          <Users :size="18" />
          <span>Usuarios</span>
          <strong>{{ summary.usuarios }}</strong>
        </article>
        <article class="stat-card">
          <Package :size="18" />
          <span>Productos activos</span>
          <strong>{{ summary.productos }}</strong>
        </article>
        <article class="stat-card">
          <ShoppingBag :size="18" />
          <span>Pedidos</span>
          <strong>{{ summary.pedidos }}</strong>
        </article>
        <article class="stat-card highlight">
          <BadgeDollarSign :size="18" />
          <span>Total vendido</span>
          <strong>{{ formatCurrency(summary.totalVentas) }}</strong>
        </article>
      </section>

      <AdminDashboard />

      <section class="panel-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Inventario</p>
            <h2>Stock por formato</h2>
          </div>
          <span>{{ lowStockCount }} registros con stock menor a 5</span>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Plataforma</th>
                <th>Formato</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in inventory" :key="row.id_vj_formato" :class="{ danger: row.lowStock }">
                <td>
                  <div class="product-cell">
                    <img :src="buildImageUrl(row.imagen_url, `https://picsum.photos/seed/${row.id_producto}/80/80`)" :alt="row.titulo" />
                    <div>
                      <strong>{{ row.titulo }}</strong>
                      <small>{{ row.genero || 'Genero pendiente' }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ row.plataforma || 'General' }}</td>
                <td>{{ row.formato }}</td>
                <td>{{ formatCurrency(row.precio) }}</td>
                <td>
                  <input
                    :value="stockDrafts[row.id_vj_formato] ?? row.stock"
                    class="stock-input"
                    min="0"
                    type="number"
                    @input="updateDraft(row.id_vj_formato, $event.target.value)"
                  />
                </td>
                <td>
                  <button class="table-button" type="button" @click="saveStock(row)">
                    Guardar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Pedidos</p>
            <h2>Confirmado a enviado</h2>
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Actualizar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pedido in orders" :key="pedido.id_pedido">
                <td>#{{ pedido.id_pedido }}</td>
                <td>{{ pedido.Cliente?.nombre }} {{ pedido.Cliente?.apellido }}</td>
                <td>{{ formatCurrency(pedido.total) }}</td>
                <td>
                  <select
                    :value="statusDrafts[pedido.id_pedido] ?? pedido.id_estado_pedido"
                    class="status-select"
                    @change="updateStatusDraft(pedido.id_pedido, $event.target.value)"
                  >
                    <option v-for="status in statusOptions" :key="status.id" :value="status.id">
                      {{ status.label }}
                    </option>
                  </select>
                </td>
                <td>
                  <button class="table-button" type="button" @click="saveOrderStatus(pedido)">Guardar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Moderacion</p>
            <h2>Resenas pendientes</h2>
          </div>
        </div>

        <div class="review-grid">
          <article v-for="resena in reviews" :key="resena.id_resena" class="review-card">
            <div class="review-top">
              <div>
                <strong>{{ resena.Producto?.titulo }}</strong>
                <p>{{ resena.Usuario?.nombre }} {{ resena.Usuario?.apellido }}</p>
              </div>
              <span class="review-state" :class="stateClass(resena.estado)">{{ resena.estado }}</span>
            </div>

            <p class="review-copy">{{ resena.comentario }}</p>

            <div class="review-actions">
              <button class="approve-button" type="button" @click="moderateReview(resena, 'Aprobada')">
                Aprobar
              </button>
              <button class="reject-button" type="button" @click="moderateReview(resena, 'Rechazada')">
                Rechazar
              </button>
            </div>
          </article>
        </div>
      </section>

      <p v-if="feedback" class="feedback">{{ feedback }}</p>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { BadgeDollarSign, Package, ShoppingBag, Users } from 'lucide-vue-next';
import { apiFetch, buildImageUrl, formatCurrency } from '../utils/api';
import { authHeaders } from '../utils/session';
import AdminDashboard from '../components/AdminDashboard.vue';

const summary = ref({
  usuarios: 0,
  productos: 0,
  pedidos: 0,
  totalVentas: 0,
  resenasPendientes: 0,
  itemsBajoStock: 0,
});
const inventory = ref([]);
const orders = ref([]);
const reviews = ref([]);
const loading = ref(true);
const error = ref('');
const feedback = ref('');
const stockDrafts = ref({});
const statusDrafts = ref({});

const statusOptions = [
  { id: 2, label: 'Confirmado' },
  { id: 4, label: 'Enviado' },
  { id: 5, label: 'Entregado' },
  { id: 6, label: 'Cancelado' },
];

const lowStockCount = computed(() => inventory.value.filter((row) => row.lowStock).length);

const loadAdminData = async () => {
  loading.value = true;
  error.value = '';
  feedback.value = '';

  try {
    const headers = authHeaders();

    const [summaryPayload, inventoryPayload, ordersPayload, reviewsPayload] = await Promise.all([
      apiFetch('/admin/dashboard', { headers }),
      apiFetch('/admin/inventario', { headers }),
      apiFetch('/pedidos', { headers }),
      apiFetch('/admin/resenas', { headers }),
    ]);

    summary.value = summaryPayload;
    inventory.value = inventoryPayload;
    orders.value = ordersPayload;
    reviews.value = reviewsPayload;
    stockDrafts.value = Object.fromEntries(inventoryPayload.map((row) => [row.id_vj_formato, row.stock]));
    statusDrafts.value = Object.fromEntries(ordersPayload.map((order) => [order.id_pedido, order.id_estado_pedido]));
  } catch (err) {
    error.value = err.message || 'No se pudo cargar el panel admin.';
  } finally {
    loading.value = false;
  }
};

const updateDraft = (idVjFormato, value) => {
  stockDrafts.value = {
    ...stockDrafts.value,
    [idVjFormato]: Number(value),
  };
};

const saveStock = async (row) => {
  feedback.value = '';

  try {
    await apiFetch(`/admin/inventario/${row.id_vj_formato}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ stock: Number(stockDrafts.value[row.id_vj_formato]) }),
    });

    await loadAdminData();
    feedback.value = `Stock actualizado para ${row.titulo}.`;
  } catch (err) {
    feedback.value = err.message || 'No se pudo actualizar el stock.';
  }
};

const updateStatusDraft = (idPedido, value) => {
  statusDrafts.value = {
    ...statusDrafts.value,
    [idPedido]: Number(value),
  };
};

const saveOrderStatus = async (pedido) => {
  feedback.value = '';

  try {
    await apiFetch(`/admin/pedidos/${pedido.id_pedido}/estado`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ id_estado_pedido: Number(statusDrafts.value[pedido.id_pedido]) }),
    });

    await loadAdminData();
    feedback.value = `Pedido #${pedido.id_pedido} actualizado.`;
  } catch (err) {
    feedback.value = err.message || 'No se pudo actualizar el pedido.';
  }
};

const moderateReview = async (resena, estado) => {
  feedback.value = '';

  try {
    await apiFetch(`/admin/resenas/${resena.id_resena}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ estado }),
    });

    await loadAdminData();
    feedback.value = `Resena marcada como ${estado.toLowerCase()}.`;
  } catch (err) {
    feedback.value = err.message || 'No se pudo moderar la resena.';
  }
};

const stateClass = (estado) => ({
  pending: estado === 'Pendiente',
  approved: estado === 'Aprobada',
  rejected: estado === 'Rechazada',
});

onMounted(loadAdminData);
</script>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header,
.stats-grid,
.section-heading,
.review-top,
.review-actions,
.product-cell {
  display: flex;
}

.page-header,
.section-heading,
.review-top,
.review-actions {
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1,
.section-heading h2 {
  margin: 0;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ghost-button,
.table-button,
.approve-button,
.reject-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
}

.ghost-button,
.table-button {
  padding: 0 1rem;
}

.ghost-button {
  background: rgba(15, 23, 42, 0.08);
}

.table-button,
.approve-button {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
}

.reject-button {
  padding: 0 1rem;
  background: rgba(244, 63, 94, 0.12);
  color: #be123c;
}

.status-card,
.panel-card,
.stat-card,
.review-card {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(22px);
}

.status-card,
.panel-card {
  padding: 22px;
}

.status-card.error {
  color: #be123c;
}

.stats-grid {
  gap: 14px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 180px;
  padding: 1.2rem;
}

.stat-card svg {
  margin-bottom: 0.5rem;
  color: #0369a1;
}

.stat-card span {
  display: block;
  color: var(--muted-light);
  margin-bottom: 0.45rem;
}

.stat-card strong {
  font-size: 1.65rem;
}

.highlight {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.32), rgba(37, 99, 235, 0.4));
  color: white;
}

.highlight span {
  color: rgba(255, 255, 255, 0.8);
}

.highlight svg {
  color: white;
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

tr.danger {
  background: rgba(244, 63, 94, 0.08);
}

.product-cell {
  align-items: center;
  gap: 0.9rem;
}

.product-cell img {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  object-fit: cover;
}

.product-cell strong,
.product-cell small {
  display: block;
}

.product-cell small,
.feedback {
  color: var(--muted-light);
}

.stock-input,
.status-select {
  min-height: 42px;
  min-width: 110px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.74);
  padding: 0 0.8rem;
  color: black; /*Inherit*/
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.review-card {
  padding: 1rem;
}

.review-top p,
.review-copy {
  margin: 0.35rem 0 0;
  color: var(--muted-light);
}

.review-state {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.review-state.pending {
  background: rgba(250, 204, 21, 0.18);
  color: #a16207;
}

.review-state.approved {
  background: rgba(52, 211, 153, 0.16);
  color: #047857;
}

.review-state.rejected {
  background: rgba(244, 63, 94, 0.16);
  color: #be123c;
}

.review-actions {
  margin-top: 1rem;
}

:global(.dark) .status-card,
:global(.dark) .panel-card,
:global(.dark) .stat-card,
:global(.dark) .review-card,
:global(.dark) .stock-input,
:global(.dark) .status-select {
  background: rgba(7, 14, 34, 0.78);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

:global(.dark) th,
:global(.dark) .stat-card span,
:global(.dark) .product-cell small,
:global(.dark) .review-top p,
:global(.dark) .review-copy,
:global(.dark) .feedback {
  color: var(--muted-dark);
}

:global(.dark) .ghost-button {
  background: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

@media (max-width: 920px) {
  .page-header,
  .section-heading,
  .review-top,
  .review-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
