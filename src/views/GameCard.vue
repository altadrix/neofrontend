<template>
  <article class="game-card">
    <button class="card-image-wrapper" type="button" @click="goToDetail">
      <img :src="imageUrl" :alt="game.titulo" class="card-image" />
      <div class="card-overlay">
        <span>Ver detalles</span>
      </div>
    </button>

    <div class="card-info">
      <div class="top-row">
        <div>
          <h3 class="game-title">{{ game.titulo }}</h3>
          <p class="game-meta">{{ game.plataforma_nombre || 'Plataforma pendiente' }}</p>
        </div>
        <span class="format-pill">{{ game.formato_nombre || 'General' }}</span>
      </div>

      <p class="game-description">
        {{ game.descripcion || 'Este titulo ya esta listo para entrar al checkout de NeoGaming.' }}
      </p>

      <div class="card-footer">
        <div>
          <strong class="game-price">{{ formatCurrency(game.precio) }}</strong>
          <small class="stock-copy">
            {{ stockLabel }}
          </small>
        </div>

        <div class="card-actions">
          <button class="ghost-button" type="button" @click="goToDetail">Ficha</button>
          <button class="primary-button" type="button" :disabled="adding" @click="addToCart(false)">
            {{ adding ? 'Agregando...' : 'Agregar' }}
          </button>
          <button class="checkout-button" type="button" :disabled="adding" @click="addToCart(true)">
            <Zap :size="17" />
          </button>
        </div>
      </div>

      <p v-if="feedback" class="feedback">{{ feedback }}</p>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Zap } from 'lucide-vue-next';
import { apiFetch, buildImageUrl, formatCurrency } from '../utils/api';
import { setStoredCartCount } from '../utils/cart';
import { authHeaders, getToken } from '../utils/session';

const props = defineProps({
  game: {
    type: Object,
    required: true,
  },
});

const router = useRouter();
const adding = ref(false);
const feedback = ref('');

const imageUrl = computed(() =>
  buildImageUrl(props.game.imagen_url, `https://picsum.photos/seed/${props.game.id_producto}/640/480`),
);

const stockLabel = computed(() => {
  if (props.game.stock_disponible == null) return 'Inventario a confirmar';
  return `${props.game.stock_disponible} en stock`;
});

const goToDetail = () => {
  router.push(`/producto/${props.game.id_producto}`);
};

const addToCart = async (redirectToCheckout) => {
  feedback.value = '';

  if (!getToken()) {
    router.push({
      name: 'Login',
      query: { redirect: redirectToCheckout ? '/checkout' : `/producto/${props.game.id_producto}` },
    });
    return;
  }

  adding.value = true;

  try {
    const cart = await apiFetch('/carrito', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        id_producto: props.game.id_producto,
        cantidad: 1,
      }),
    });

    setStoredCartCount(cart.cantidadItems);
    feedback.value = 'Juego agregado al carrito.';

    if (redirectToCheckout) {
      router.push('/checkout');
    }
  } catch (error) {
    feedback.value = error.message || 'No se pudo agregar el producto.';
  } finally {
    adding.value = false;
  }
};
</script>

<style scoped>
.game-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(22px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 50px rgba(14, 165, 233, 0.18);
}

.card-image-wrapper {
  position: relative;
  border: none;
  padding: 0;
  cursor: pointer;
  background: transparent;
}

.card-image {
  width: 100%;
  aspect-ratio: 16 / 11;
  object-fit: cover;
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, transparent, rgba(2, 6, 23, 0.6));
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card-image-wrapper:hover .card-overlay {
  opacity: 1;
}

.card-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.1rem;
}

.top-row,
.card-footer,
.card-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.game-title {
  margin: 0;
  font-size: 1.1rem;
  color: black;
}

.game-meta,
.game-description,
.stock-copy {
  margin: 0;
  color: var(--muted-light);
}

.game-description {
  flex: 1;
  line-height: 1.5;
}

.format-pill {
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 700;
}

.game-price {
  display: block;
  font-size: 1.25rem;
}

.stock-copy {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.82rem;
}

.card-actions {
  justify-content: flex-end;
}

.ghost-button,
.primary-button,
.checkout-button {
  min-height: 42px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
}

.ghost-button {
  min-width: 64px;
  background: rgba(15, 23, 42, 0.08);
}

.primary-button {
  min-width: 92px;
  padding: 0 1rem;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
}

.checkout-button {
  width: 42px;
  background: rgba(14, 165, 233, 0.14);
  color: #0284c7;
}

.feedback {
  margin: 0;
  font-size: 0.82rem;
  color: #0284c7;
}

:global(.dark) .game-card {
  background: rgba(7, 14, 34, 0.78);
  border-color: rgba(148, 163, 184, 0.08);
}

:global(.dark) .game-meta,
:global(.dark) .game-description,
:global(.dark) .stock-copy {
  color: var(--muted-dark);
}

:global(.dark) .ghost-button {
  background: rgba(148, 163, 184, 0.1);
  color: var(--text-light);
}
</style>
