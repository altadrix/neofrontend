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

        <a
          v-if="orderConfirmed.factura_pdf_url"
          :href="orderConfirmed.factura_pdf_url"
          class="primary-link"
          target="_blank"
          rel="noreferrer"
        >
          Descargar factura PDF
        </a>

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

            <div class="coupon-panel">
              <label>
                Cupon
                <input v-model.trim="couponCode" type="text" placeholder="Ingresa tu codigo" />
              </label>

              <button class="ghost-link coupon-button" type="button" @click="validateCoupon">
                Aplicar cupon
              </button>
            </div>

            <p v-if="couponFeedback" class="coupon-feedback">{{ couponFeedback }}</p>

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
                <small v-if="selectedSavedAddress.sector">Sector: {{ selectedSavedAddress.sector }}</small>
                <small v-if="selectedSavedAddress.referencia">{{ selectedSavedAddress.referencia }}</small>
                <small v-if="selectedSavedAddress.detalle">{{ selectedSavedAddress.detalle }}</small>
              </div>
            </template>

            <template v-else>
              <SmartAddressForm
                v-model="form"
                :municipalities="catalogs.municipios"
                :provinces="catalogs.provincias"
                @error="feedback = $event"
              />

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
              <strong>{{ formatCurrency(summarySubtotal) }}</strong>
            </div>
            <div v-if="couponPreview" class="summary-row">
              <span>Descuento</span>
              <strong>-{{ formatCurrency(couponPreview.descuento) }}</strong>
            </div>
            <div class="summary-row">
              <span>ITBIS (18%)</span>
              <strong>{{ formatCurrency(summaryItbis) }}</strong>
            </div>
            <div class="summary-row total-row">
              <span>Total</span>
              <strong>{{ formatCurrency(summaryTotal) }}</strong>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import SmartAddressForm from '../components/SmartAddressForm.vue';
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
const couponFeedback = ref('');
const submitting = ref(false);
const orderConfirmed = ref(null);
const addressMode = ref('new');
const couponCode = ref('');
const couponPreview = ref(null);

const form = ref({
  id_metodo_pago: '',
  id_direccion: '',
  calle: '',
  numero_casa: '',
  sector: '',
  referencia: '',
  latitud: '',
  longitud: '',
  id_provincia: '',
  id_municipio: '',
  municipio_personalizado: '',
  use_custom_municipio: false,
  guardar_direccion: false,
});

const selectedSavedAddress = computed(
  () =>
    savedAddresses.value.find((address) => Number(address.id_direccion) === Number(form.value.id_direccion)) ||
    null,
);

const summarySubtotal = computed(() => couponPreview.value?.subtotal_con_descuento ?? cart.value.subtotal);
const summaryItbis = computed(() => couponPreview.value?.itbis ?? cart.value.itbis);
const summaryTotal = computed(() => couponPreview.value?.total ?? cart.value.total);

const shippingSummary = computed(() => {
  if (!orderConfirmed.value) return '';
  const address = orderConfirmed.value.ubicacion || orderConfirmed.value.Direccion || {};
  return [
    address.calle,
    address.numero_casa,
    address.sector,
    address.referencia,
    address.municipio_nombre,
    address.provincia_nombre,
  ]
    .filter(Boolean)
    .join(', ');
});

watch(couponCode, () => {
  couponPreview.value = null;
  couponFeedback.value = '';
});

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
    couponPreview.value = null;
    couponFeedback.value = '';
    couponCode.value = '';

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
  payload.sector = form.value.sector;
  payload.referencia = form.value.referencia;
  payload.latitud = form.value.latitud;
  payload.longitud = form.value.longitud;
  payload.id_provincia = form.value.id_provincia;
  payload.guardar_direccion = form.value.guardar_direccion;

  if (form.value.use_custom_municipio) {
    payload.municipio_personalizado = form.value.municipio_personalizado;
  } else {
    payload.id_municipio = form.value.id_municipio;
  }

  return payload;
};

const validateCoupon = async () => {
  couponFeedback.value = '';
  couponPreview.value = null;

  if (!couponCode.value) {
    couponFeedback.value = 'Escribe un cupon antes de validarlo.';
    return;
  }

  try {
    const result = await apiFetch('/cupones/validar', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ codigo_cupon: couponCode.value }),
    });

    couponPreview.value = result;
    couponFeedback.value = `Cupon ${result.cupon?.codigo_cupon || couponCode.value} aplicado correctamente.`;
  } catch (err) {
    couponFeedback.value = err.message || 'No se pudo validar el cupon.';
  }
};

const submitCheckout = async () => {
  feedback.value = '';
  submitting.value = true;

  try {
    const previousSubtotal = Number(cart.value.subtotal || 0);
    const codigoCupon = couponPreview.value?.cupon?.codigo_cupon || couponCode.value || '';
    const response = await apiFetch('/checkout', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ...buildCheckoutPayload(),
        codigo_cupon: codigoCupon,
      }),
    });

    orderConfirmed.value = response.pedido;
    cart.value = response.carrito;
    setStoredCartCount(response.carrito.cantidadItems);

    if (response.cupon) {
      couponPreview.value = {
        cupon: response.cupon,
        subtotal_con_descuento: response.pedido.subtotal,
        itbis: response.pedido.itbis,
        total: response.pedido.total,
        descuento: Math.max(previousSubtotal - Number(response.pedido.subtotal), 0),
      };
    }
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

.coupon-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.coupon-button {
  min-height: 48px;
  cursor: pointer;
}

.coupon-feedback,
.feedback {
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  background: rgba(14, 165, 233, 0.1);
  color: #0f172a;
}

.address-preview {
  display: grid;
  gap: 0.3rem;
  padding: 1rem;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.06);
}

.address-preview small {
  color: #475569;
}

.checkbox-row {
  display: flex !important;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-row input {
  min-height: auto;
}

.action-button {
  width: 100%;
}

.summary-panel {
  display: grid;
  gap: 18px;
}

.item-list {
  display: grid;
  gap: 14px;
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.06);
}

.summary-item strong,
.summary-item small {
  display: block;
}

.summary-item small {
  color: #64748b;
  margin-top: 0.2rem;
}

.total-box {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(14, 165, 233, 0.08);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.total-row {
  font-size: 1.08rem;
  font-weight: 800;
}

.summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 900px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-header,
  .coupon-panel,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
