<template>
  <div class="checkout-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Checkout</p>
        <h1>Cerrar pedido con direccion normalizada</h1>
      </div>
      <RouterLink to="/carrito" class="ghost-link">Volver al carrito</RouterLink>
    </header>

    <div v-if="loading" class="status-card">Cargando resumen del pedido...</div>
    <div v-else-if="error" class="status-card error">{{ error }}</div>

    <template v-else>
      <div v-if="orderConfirmed" class="success-card">
        <p class="eyebrow">Pedido confirmado</p>
        <h2>Orden #{{ orderConfirmed.id_pedido }}</h2>
        <p>
          El pedido quedo en estado {{ orderConfirmed.Estado?.nombre?.toLowerCase() || 'confirmado' }}
          y el inventario ya fue descontado del stock general del producto.
        </p>

        <div class="summary-grid">
          <div>
            <small>Total</small>
            <strong>{{ formatCurrency(orderConfirmed.total) }}</strong>
          </div>
          <div>
            <small>ITBIS</small>
            <strong>{{ formatCurrency(orderConfirmed.itbis) }}</strong>
          </div>
          <div>
            <small>Metodo de pago</small>
            <strong>{{ orderConfirmed.MetodoPago?.nombre || 'No definido' }}</strong>
          </div>
          <div>
            <small>Entrega</small>
            <strong>{{ shippingSummary }}</strong>
          </div>
        </div>

        <RouterLink to="/" class="primary-link">Volver a la tienda</RouterLink>
      </div>

      <div v-else class="checkout-layout">
        <section class="form-panel">
          <h2>Entrega y pago</h2>

          <form class="checkout-form" @submit.prevent="submitCheckout">
            <div class="mode-tabs">
              <button
                type="button"
                class="mode-button"
                :class="{ active: addressMode === 'saved' }"
                :disabled="!savedAddresses.length"
                @click="addressMode = 'saved'"
              >
                Direccion guardada
              </button>
              <button
                type="button"
                class="mode-button"
                :class="{ active: addressMode === 'new' }"
                @click="addressMode = 'new'"
              >
                Nueva direccion
              </button>
            </div>

            <label>
              Metodo de pago
              <select v-model.number="form.id_metodo_pago" required>
                <option value="" disabled>Selecciona un metodo</option>
                <option
                  v-for="method in catalogs.metodosPago"
                  :key="method.id_metodo_pago"
                  :value="method.id_metodo_pago"
                >
                  {{ method.nombre }}
                </option>
              </select>
            </label>

            <template v-if="addressMode === 'saved' && savedAddresses.length">
              <label>
                Direccion guardada
                <select v-model.number="form.id_direccion">
                  <option v-for="address in savedAddresses" :key="address.id_direccion" :value="address.id_direccion">
                    {{ address.calle }}, {{ address.numero_casa }} - {{ address.municipio_nombre }}
                  </option>
                </select>
              </label>

              <div v-if="selectedSavedAddress" class="address-preview">
                <strong>{{ selectedSavedAddress.calle }}, {{ selectedSavedAddress.numero_casa }}</strong>
                <small>
                  {{ selectedSavedAddress.municipio_nombre }},
                  {{ selectedSavedAddress.provincia_nombre }}
                </small>
                <small v-if="selectedSavedAddress.detalle">{{ selectedSavedAddress.detalle }}</small>
              </div>
            </template>

            <template v-else>
              <label>
                Calle
                <input v-model.trim="form.calle" type="text" required />
              </label>

              <label>
                Numero o referencia
                <input v-model.trim="form.numero_casa" type="text" required />
              </label>

              <label class="full-width">
                Detalle adicional
                <textarea v-model.trim="form.detalle" rows="3"></textarea>
              </label>

              <label>
                Provincia
                <select v-model.number="form.id_provincia" required @change="handleProvinceChange">
                  <option value="" disabled>Selecciona una provincia</option>
                  <option
                    v-for="province in catalogs.provincias"
                    :key="province.id_provincia"
                    :value="province.id_provincia"
                  >
                    {{ province.nombre }}
                  </option>
                </select>
              </label>

              <label class="checkbox-row">
                <input v-model="form.use_custom_municipio" type="checkbox" />
                No encuentro mi municipio en la lista
              </label>

              <label v-if="!form.use_custom_municipio">
                Municipio
                <select v-model.number="form.id_municipio" required>
                  <option value="" disabled>Selecciona un municipio</option>
                  <option
                    v-for="municipio in filteredMunicipios"
                    :key="municipio.id_municipio"
                    :value="municipio.id_municipio"
                  >
                    {{ municipio.nombre }}
                  </option>
                </select>
              </label>

              <label v-else>
                Municipio personalizado
                <input v-model.trim="form.municipio_personalizado" type="text" required />
              </label>

              <label class="checkbox-row">
                <input v-model="form.guardar_direccion" type="checkbox" />
                Guardar esta direccion en mi perfil
              </label>
            </template>

            <button class="primary-link action-button" type="submit" :disabled="submitting || !cart.items.length">
              {{ submitting ? 'Procesando pedido...' : 'Confirmar pedido' }}
            </button>
          </form>

          <p v-if="feedback" class="feedback">{{ feedback }}</p>
        </section>

        <aside class="summary-panel">
          <h2>Resumen</h2>

          <div class="item-list">
            <article v-for="item in cart.items" :key="item.id_carrito_detalle" class="summary-item">
              <div>
                <strong>{{ item.titulo }}</strong>
                <small>{{ item.cantidad }} x {{ formatCurrency(item.precio_unitario) }}</small>
              </div>
              <strong>{{ formatCurrency(item.total_linea) }}</strong>
            </article>
          </div>

          <div class="total-box">
            <div class="summary-row">
              <span>Subtotal</span>
              <strong>{{ formatCurrency(cart.subtotal) }}</strong>
            </div>
            <div class="summary-row">
              <span>ITBIS (18%)</span>
              <strong>{{ formatCurrency(cart.itbis) }}</strong>
            </div>
            <div class="summary-row total-row">
              <span>Total</span>
              <strong>{{ formatCurrency(cart.total) }}</strong>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { apiFetch, formatCurrency } from '../utils/api';
import { setStoredCartCount } from '../utils/cart';
import { authHeaders } from '../utils/session';

defineOptions({
  name: 'CheckoutPage',
});

const cart = ref({
  items: [],
  subtotal: 0,
  itbis: 0,
  total: 0,
  cantidadItems: 0,
});
const catalogs = ref({
  metodosPago: [],
  provincias: [],
  municipios: [],
});
const savedAddresses = ref([]);
const loading = ref(true);
const error = ref('');
const feedback = ref('');
const submitting = ref(false);
const orderConfirmed = ref(null);
const addressMode = ref('new');

const form = ref({
  id_metodo_pago: '',
  id_direccion: '',
  calle: '',
  numero_casa: '',
  detalle: '',
  id_provincia: '',
  id_municipio: '',
  municipio_personalizado: '',
  use_custom_municipio: false,
  guardar_direccion: false,
});

const filteredMunicipios = computed(() =>
  catalogs.value.municipios.filter(
    (municipio) => Number(municipio.id_provincia) === Number(form.value.id_provincia),
  ),
);

const selectedSavedAddress = computed(() =>
  savedAddresses.value.find((address) => Number(address.id_direccion) === Number(form.value.id_direccion)) || null,
);

const shippingSummary = computed(() => {
  if (!orderConfirmed.value) return '';
  return [
    orderConfirmed.value.calle_envio,
    orderConfirmed.value.numero_casa_envio,
    orderConfirmed.value.municipio_envio,
    orderConfirmed.value.provincia_envio,
  ]
    .filter(Boolean)
    .join(', ');
});

const handleProvinceChange = () => {
  form.value.id_municipio = '';
  form.value.municipio_personalizado = '';
};

const loadCheckoutData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const headers = authHeaders();
    const [cartPayload, addressesPayload, catalogsPayload] = await Promise.all([
      apiFetch('/carrito', { headers }),
      apiFetch('/direcciones', { headers }),
      apiFetch('/catalogos'),
    ]);

    cart.value = cartPayload;
    savedAddresses.value = addressesPayload;
    catalogs.value = {
      metodosPago: catalogsPayload.metodosPago || [],
      provincias: catalogsPayload.provincias || [],
      municipios: catalogsPayload.municipios || [],
    };

    const principalAddress =
      addressesPayload.find((address) => address.es_principal) || addressesPayload[0] || null;

    form.value.id_metodo_pago = catalogs.value.metodosPago[0]?.id_metodo_pago || '';
    form.value.id_direccion = principalAddress?.id_direccion || '';
    addressMode.value = principalAddress ? 'saved' : 'new';

    if (!cartPayload.items.length) {
      feedback.value = 'Tu carrito esta vacio. Agrega productos antes de procesar el checkout.';
    }
  } catch (err) {
    error.value = err.message || 'No se pudo cargar el checkout.';
  } finally {
    loading.value = false;
  }
};

const buildCheckoutPayload = () => {
  const payload = {
    id_metodo_pago: form.value.id_metodo_pago,
  };

  if (addressMode.value === 'saved' && form.value.id_direccion) {
    payload.id_direccion = form.value.id_direccion;
    return payload;
  }

  payload.calle = form.value.calle;
  payload.numero_casa = form.value.numero_casa;
  payload.detalle = form.value.detalle;
  payload.id_provincia = form.value.id_provincia;
  payload.guardar_direccion = form.value.guardar_direccion;

  if (form.value.use_custom_municipio) {
    payload.municipio_personalizado = form.value.municipio_personalizado;
  } else {
    payload.id_municipio = form.value.id_municipio;
  }

  return payload;
};

const submitCheckout = async () => {
  feedback.value = '';
  submitting.value = true;

  try {
    const response = await apiFetch('/checkout', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(buildCheckoutPayload()),
    });

    orderConfirmed.value = response.pedido;
    cart.value = response.carrito;
    setStoredCartCount(response.carrito.cantidadItems);
  } catch (err) {
    feedback.value = err.message || 'No se pudo confirmar el pedido.';
  } finally {
    submitting.value = false;
  }
};

onMounted(loadCheckoutData);
</script>

<style scoped>
.checkout-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header,
.checkout-layout,
.summary-grid,
.mode-tabs {
  display: grid;
  gap: 24px;
}

.page-header {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-header h1,
.success-card h2 {
  margin: 0;
}

.ghost-link,
.primary-link,
.mode-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 1.2rem;
  border-radius: 16px;
  text-decoration: none;
  font-weight: 700;
  border: none;
}

.ghost-link,
.mode-button {
  background: rgba(15, 23, 42, 0.08);
  color: inherit;
}

.primary-link,
.mode-button.active {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
}

.status-card,
.form-panel,
.summary-panel,
.success-card {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(22px);
  padding: 24px;
  color: black;
}

.status-card.error {
  color: #be123c;
}

.checkout-layout {
  grid-template-columns: 1.1fr 0.9fr;
}

.checkout-form {
  display: grid;
  gap: 14px;
}

.checkout-form label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

.checkout-form input,
.checkout-form select,
.checkout-form textarea {
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.7);
  padding: 0 1rem;
  color: black;
}

.checkout-form textarea {
  min-height: 96px;
  padding: 1rem;
  resize: vertical;
}

.full-width {
  width: 100%;
}

.checkbox-row {
  display: flex !important;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-row input {
  min-height: auto;
  width: auto;
}

.action-button {
  width: 100%;
  cursor: pointer;
}

.feedback {
  color: #0284c7;
  font-weight: 600;
}

.summary-panel h2,
.form-panel h2 {
  margin-top: 0;
}

.item-list {
  display: grid;
  gap: 10px;
  color: black;
}

.summary-item,
.total-box,
.summary-grid > div,
.address-preview {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
}

.summary-item strong,
.summary-item small,
.address-preview strong,
.address-preview small {
  display: block;
}

.summary-item small,
.success-card p,
.address-preview small {
  color: var(--muted-light);
}

.address-preview {
  padding: 1rem;
}

.total-box {
  margin-top: 1rem;
  padding: 1rem;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  color: black;
}

.total-row {
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 1rem 0;
}

.summary-grid > div {
  padding: 1rem;
}

.summary-grid small {
  display: block;
  color: var(--muted-light);
  margin-bottom: 0.25rem;
}

:global(.dark) .status-card,
:global(.dark) .form-panel,
:global(.dark) .summary-panel,
:global(.dark) .success-card,
:global(.dark) .summary-item,
:global(.dark) .total-box,
:global(.dark) .summary-grid > div,
:global(.dark) .checkout-form input,
:global(.dark) .checkout-form select,
:global(.dark) .checkout-form textarea,
:global(.dark) .address-preview {
  background: rgba(7, 14, 34, 0.75);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

:global(.dark) .ghost-link,
:global(.dark) .mode-button {
  background: rgba(148, 163, 184, 0.08);
}

:global(.dark) .summary-item small,
:global(.dark) .success-card p,
:global(.dark) .summary-grid small,
:global(.dark) .address-preview small {
  color: var(--muted-dark);
}

@media (max-width: 940px) {
  .page-header,
  .checkout-layout,
  .summary-grid,
  .mode-tabs {
    grid-template-columns: 1fr;
  }
}
</style>
