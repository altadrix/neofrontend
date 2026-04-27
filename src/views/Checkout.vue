<template>
  <div class="checkout-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Checkout</p>
        <h1>Cerrar venta con ITBIS automatico</h1>
      </div>
      <RouterLink to="/carrito" class="ghost-link">Volver al carrito</RouterLink>
    </header>

    <div v-if="loading" class="status-card">Cargando resumen del pedido...</div>
    <div v-else-if="error" class="status-card error">{{ error }}</div>

    <template v-else>
      <div v-if="orderConfirmed" class="success-card">
        <p class="eyebrow">Pedido confirmado</p>
        <h2>Orden #{{ orderConfirmed.id_pedido }}</h2>
        <p>El carrito fue vaciado, el stock se desconto y el pedido quedo en estado confirmado.</p>
        <div class="summary-grid">
          <div>
            <small>Total</small>
            <strong>{{ formatCurrency(orderConfirmed.total) }}</strong>
          </div>
          <div>
            <small>ITBIS</small>
            <strong>{{ formatCurrency(orderConfirmed.itbis) }}</strong>
          </div>
        </div>
        <RouterLink to="/" class="primary-link">Volver a la tienda</RouterLink>
      </div>

      <div v-else class="checkout-layout">
        <section class="form-panel">
          <h2>Direccion de envio</h2>

          <form class="checkout-form" @submit.prevent="submitCheckout">
            <label>
              Calle
              <input v-model.trim="form.calle_envio" type="text" required />
            </label>

            <label>
              Numero o referencia de vivienda
              <input v-model.trim="form.numero_casa_envio" type="text" />
            </label>

            <label>
              Municipio
              <input v-model.trim="form.municipio_envio" type="text" required />
            </label>

            <label>
              Provincia
              <input v-model.trim="form.provincia_envio" type="text" />
            </label>

            <button class="primary-link action-button" type="submit" :disabled="submitting || !cart.items.length">
              {{ submitting ? 'Procesando pago...' : 'Confirmar pedido' }}
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
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch, formatCurrency } from '../utils/api';
import { setStoredCartCount } from '../utils/cart';
import { authHeaders, getStoredUser } from '../utils/session';

const router = useRouter();

const cart = ref({
  items: [],
  subtotal: 0,
  itbis: 0,
  total: 0,
  cantidadItems: 0,
});
const loading = ref(true);
const error = ref('');
const feedback = ref('');
const submitting = ref(false);
const orderConfirmed = ref(null);

const storedUser = getStoredUser();
const form = ref({
  calle_envio: '',
  numero_casa_envio: '',
  municipio_envio: '',
  provincia_envio: '',
});

const loadCart = async () => {
  loading.value = true;
  error.value = '';

  try {
    cart.value = await apiFetch('/carrito', {
      headers: authHeaders(),
    });

    if (!cart.value.items.length) {
      feedback.value = 'Tu carrito esta vacio. Agrega productos antes de procesar el checkout.';
    }
  } catch (err) {
    error.value = err.message || 'No se pudo cargar el checkout.';
  } finally {
    loading.value = false;
  }
};

const submitCheckout = async () => {
  feedback.value = '';
  submitting.value = true;

  try {
    const response = await apiFetch('/checkout', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(form.value),
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

onMounted(async () => {
  form.value = {
    calle_envio: '',
    numero_casa_envio: '',
    municipio_envio: storedUser?.municipio_envio || '',
    provincia_envio: '',
  };

  await loadCart();
});
</script>

<style scoped>
.checkout-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header,
.checkout-layout,
.summary-grid {
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
.primary-link {
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

.ghost-link {
  background: rgba(15, 23, 42, 0.08);
  color: inherit;
}

.primary-link {
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

.checkout-form input {
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.7);
  padding: 0 1rem;
  color: black; /*Previo inherit*/
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
  color: black; /*lista de items letra negra*/
}

.summary-item,
.total-box,
.summary-grid > div {
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
.summary-item small {
  display: block;
}

.summary-item small,
.success-card p {
  color: var(--muted-light);
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
  color: black; /*Letras negras para el resumen de la compra */
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
:global(.dark) .checkout-form input {
  background: rgba(7, 14, 34, 0.75);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

:global(.dark) .ghost-link {
  background: rgba(148, 163, 184, 0.08);
}

:global(.dark) .summary-item small,
:global(.dark) .success-card p,
:global(.dark) .summary-grid small {
  color: var(--muted-dark);
}

@media (max-width: 940px) {
  .page-header,
  .checkout-layout,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
