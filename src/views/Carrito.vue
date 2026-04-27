<template>
  <div class="cart-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Carrito sincronizado</p>
        <h1>Tu carrito de NeoGaming</h1>
      </div>
      <RouterLink v-if="cart.items.length" to="/checkout" class="checkout-link">Ir a checkout</RouterLink>
    </header>

    <div v-if="loading" class="status-card">Cargando carrito...</div>
    <div v-else-if="error" class="status-card error">{{ error }}</div>

    <div v-else class="cart-layout">
      <section class="items-panel">
        <div v-if="!cart.items.length" class="empty-card">
          <ShoppingCart class="empty-icon" :size="40" />
          <h2>Tu carrito esta vacio</h2>
          <p>Agrega un juego y el navbar reaccionara automaticamente con la nueva cantidad.</p>
          <RouterLink to="/" class="checkout-link">Volver al catalogo</RouterLink>
        </div>

        <div v-else class="items-list">
          <article v-for="item in cart.items" :key="item.id_carrito_detalle" class="item-card">
            <img :src="buildImageUrl(item.imagen_url, `https://picsum.photos/seed/${item.id_producto}/360/360`)" :alt="item.titulo" class="item-image" />

            <div class="item-copy">
              <h3>{{ item.titulo }}</h3>
              <p>{{ item.plataforma || item.formato }}</p>
              <small>{{ formatCurrency(item.precio_unitario) }} por unidad</small>
            </div>

            <div class="quantity-control">
              <button type="button" @click="updateQuantity(item, item.cantidad - 1)" :disabled="item.cantidad <= 1 || mutating">
                <Minus :size="16" />
              </button>
              <span>{{ item.cantidad }}</span>
              <button type="button" @click="updateQuantity(item, item.cantidad + 1)" :disabled="mutating">
                <Plus :size="16" />
              </button>
            </div>

            <strong class="line-total">{{ formatCurrency(item.total_linea) }}</strong>

            <button class="remove-button" type="button" @click="removeItem(item.id_carrito_detalle)" :disabled="mutating">
              <Trash2 :size="18" />
            </button>
          </article>
        </div>
      </section>

      <aside class="summary-panel">
        <div class="summary-card">
          <h2>Resumen fiscal</h2>

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

          <button class="checkout-button" type="button" :disabled="!cart.items.length" @click="goToCheckout">
            Finalizar compra
          </button>

          <p v-if="feedback" class="feedback">{{ feedback }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-vue-next';
import { apiFetch, buildImageUrl, formatCurrency } from '../utils/api';
import { setStoredCartCount } from '../utils/cart';
import { authHeaders } from '../utils/session';

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
const mutating = ref(false);

const applyCartPayload = (payload) => {
  cart.value = payload;
  setStoredCartCount(payload.cantidadItems);
};

const fetchCart = async () => {
  loading.value = true;
  error.value = '';

  try {
    const payload = await apiFetch('/carrito', {
      headers: authHeaders(),
    });
    applyCartPayload(payload);
  } catch (err) {
    error.value = err.message || 'No se pudo cargar el carrito.';
  } finally {
    loading.value = false;
  }
};

const updateQuantity = async (item, cantidad) => {
  feedback.value = '';
  mutating.value = true;

  try {
    const payload = await apiFetch(`/carrito/${item.id_carrito_detalle}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ cantidad }),
    });
    applyCartPayload(payload);
  } catch (err) {
    feedback.value = err.message || 'No se pudo actualizar la cantidad.';
  } finally {
    mutating.value = false;
  }
};

const removeItem = async (idDetalle) => {
  feedback.value = '';
  mutating.value = true;

  try {
    const payload = await apiFetch(`/carrito/${idDetalle}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    applyCartPayload(payload);
  } catch (err) {
    feedback.value = err.message || 'No se pudo eliminar el item.';
  } finally {
    mutating.value = false;
  }
};

const goToCheckout = () => {
  router.push('/checkout');
};

onMounted(fetchCart);
</script>

<style scoped>
.cart-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header,
.cart-layout {
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

.page-header h1 {
  margin: 0;
}

.checkout-link,
.checkout-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 1.2rem;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  text-decoration: none;
  color: white;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.status-card,
.items-panel,
.summary-card,
.empty-card {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(22px);
}

.status-card {
  padding: 1.1rem 1.2rem;
}

.status-card.error {
  color: #be123c;
}

.cart-layout {
  grid-template-columns: 1.55fr 0.8fr;
  align-items: start;
}

.items-panel {
  padding: 18px;
}

.items-list {
  display: grid;
  gap: 14px;
}

.item-card {
  display: grid;
  grid-template-columns: 92px 1fr auto auto auto;
  align-items: center;
  gap: 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.22);
  padding: 0.95rem;
}

.item-image {
  width: 92px;
  height: 92px;
  border-radius: 18px;
  object-fit: cover;
}

.item-copy {
  color: black; /*solo con el fin de letras negras*/
}

.item-copy h3,
.item-copy p,
.item-copy small {
  margin: 0;
}

.item-copy p,
.item-copy small,
.feedback,
.empty-card p {
  color: var(--muted-light);
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
}

.quantity-control button,
.remove-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.line-total {
  min-width: 120px;
  text-align: right;
  color: black;
}

.remove-button {
  color: #ef4444;
}

.summary-card {
  position: sticky;
  top: 94px;
  padding: 1.4rem;
}

.summary-card h2 {
  margin-top: 0;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}

.total-row {
  padding-top: 0.9rem;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.checkout-button {
  width: 100%;
  margin-top: 1rem;
}

.feedback {
  margin-bottom: 0;
}

.empty-card {
  display: grid;
  place-items: center;
  gap: 0.8rem;
  padding: 2rem;
  text-align: center;
}

.empty-icon {
  color: #0284c7;
}

:global(.dark) .status-card,
:global(.dark) .items-panel,
:global(.dark) .summary-card,
:global(.dark) .empty-card,
:global(.dark) .item-card {
  background: rgba(7, 14, 34, 0.75);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

:global(.dark) .item-copy p,
:global(.dark) .item-copy small,
:global(.dark) .feedback,
:global(.dark) .empty-card p {
  color: var(--muted-dark);
}

:global(.dark) .quantity-control {
  background: rgba(148, 163, 184, 0.08);
}

@media (max-width: 980px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .item-card {
    grid-template-columns: 92px 1fr;
  }

  .line-total,
  .remove-button,
  .quantity-control {
    justify-self: start;
  }
}
</style>
