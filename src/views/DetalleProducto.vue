<template>
  <div class="detail-page">
    <div v-if="loading" class="status-card">Sincronizando detalles del juego...</div>
    <div v-else-if="error" class="status-card error">{{ error }}</div>

    <template v-else-if="game">
      <section class="hero-card">
        <div class="hero-grid">
          <div class="image-shell">
            <img :src="gameImage" :alt="game.titulo" class="main-image" />
          </div>

          <div class="info-shell">
            <span class="eyebrow">Ficha de producto</span>
            <h1>{{ game.titulo }}</h1>
            <p class="description">
              {{ game.descripcion || 'Sin descripcion registrada para este producto.' }}
            </p>

            <div class="meta-grid">
              <div class="meta-card">
                <strong>{{ game.plataforma_nombre || 'General' }}</strong>
                <span>Plataforma</span>
              </div>
              <div class="meta-card">
                <strong>{{ game.formato_nombre || 'General' }}</strong>
                <span>Formato</span>
              </div>
              <div class="meta-card">
                <strong>{{ game.stock_disponible ?? 'N/D' }}</strong>
                <span>Stock</span>
              </div>
            </div>

            <div class="purchase-card">
              <div>
                <small>Precio final antes de checkout</small>
                <strong class="price">{{ formatCurrency(game.precio) }}</strong>
              </div>

              <div class="action-row">
                <button class="ghost-button" type="button" @click="router.push('/carrito')">Ver carrito</button>
                <button class="primary-button" type="button" :disabled="adding" @click="addToCart">
                  {{ adding ? 'Agregando...' : 'Agregar al carrito' }}
                </button>
              </div>
            </div>

            <p v-if="feedback" class="feedback">{{ feedback }}</p>
          </div>
        </div>
      </section>

      <section class="reviews-card">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Comunidad</span>
            <h2>Resenas aprobadas</h2>
          </div>
          <button class="ghost-button" type="button" @click="showForm = !showForm">
            {{ showForm ? 'Cerrar' : 'Escribir resena' }}
          </button>
        </div>

        <div v-if="showForm" class="review-form">
          <div class="rating-input">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="star-button"
              :class="{ active: star <= newReview.puntuacion }"
              @click="newReview.puntuacion = star"
            >
              <Star :size="18" />
            </button>
          </div>

          <textarea v-model.trim="newReview.comentario" placeholder="Comparte tu experiencia con este juego."></textarea>
          <button class="primary-button" type="button" :disabled="postingReview" @click="postReview">
            {{ postingReview ? 'Enviando...' : 'Enviar a moderacion' }}
          </button>
        </div>

        <div v-if="!game.Resenas?.length" class="empty-reviews">
          Todavia no hay resenas aprobadas para este juego.
        </div>

        <div v-else class="reviews-list">
          <article v-for="resena in game.Resenas" :key="resena.id_resena" class="review-item">
            <div class="review-head">
              <img
                :src="reviewAvatar(resena)"
                :alt="resena.Usuario?.nombre || 'Usuario'"
                class="review-avatar"
              />
              <div>
                <strong>{{ resena.Usuario?.nombre }} {{ resena.Usuario?.apellido }}</strong>
                <div class="stars-display">
                  <span
                    v-for="star in 5"
                    :key="star"
                    class="star-icon"
                    :class="{ active: star <= resena.puntuacion }"
                  >
                    <Star :size="15" />
                  </span>
                </div>
              </div>
            </div>

            <p>{{ resena.comentario }}</p>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Star } from 'lucide-vue-next';
import { apiFetch, buildImageUrl, formatCurrency } from '../utils/api';
import { setStoredCartCount } from '../utils/cart';
import { authHeaders, getToken } from '../utils/session';

const route = useRoute();
const router = useRouter();

const game = ref(null);
const loading = ref(true);
const error = ref('');
const feedback = ref('');
const adding = ref(false);
const showForm = ref(false);
const postingReview = ref(false);
const newReview = ref({
  puntuacion: 5,
  comentario: '',
});

const gameImage = computed(() =>
  buildImageUrl(game.value?.imagen_url, `https://picsum.photos/seed/${route.params.id}/900/700`),
);

const fetchProductData = async () => {
  loading.value = true;
  error.value = '';
  feedback.value = '';

  try {
    game.value = await apiFetch(`/productos/${route.params.id}`);
  } catch (err) {
    error.value = err.message || 'No se pudo cargar el producto.';
    game.value = null;
  } finally {
    loading.value = false;
  }
};

const addToCart = async () => {
  feedback.value = '';

  if (!getToken()) {
    router.push({
      name: 'Login',
      query: { redirect: route.fullPath },
    });
    return;
  }

  adding.value = true;

  try {
    const cart = await apiFetch('/carrito', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        id_producto: game.value.id_producto,
        cantidad: 1,
      }),
    });

    setStoredCartCount(cart.cantidadItems);
    feedback.value = 'Producto agregado. La burbuja del navbar ya fue actualizada.';
  } catch (err) {
    feedback.value = err.message || 'No se pudo agregar al carrito.';
  } finally {
    adding.value = false;
  }
};

const postReview = async () => {
  if (!newReview.value.comentario) {
    feedback.value = 'La resena necesita un comentario.';
    return;
  }

  if (!getToken()) {
    router.push({
      name: 'Login',
      query: { redirect: route.fullPath },
    });
    return;
  }

  postingReview.value = true;
  feedback.value = '';

  try {
    await apiFetch('/resenas', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        id_producto: game.value.id_producto,
        puntuacion: newReview.value.puntuacion,
        comentario: newReview.value.comentario,
      }),
    });

    newReview.value = { puntuacion: 5, comentario: '' };
    showForm.value = false;
    feedback.value = 'Tu resena fue enviada y quedo pendiente de moderacion.';
  } catch (err) {
    feedback.value = err.message || 'No se pudo publicar la resena.';
  } finally {
    postingReview.value = false;
  }
};

const reviewAvatar = (resena) =>
  buildImageUrl(
    resena.Usuario?.avatar_url,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(resena.Usuario?.nombre || 'Neo')}&background=0f172a&color=fff`,
  );

watch(
  () => route.params.id,
  async () => {
    await fetchProductData();
  },
);

onMounted(fetchProductData);
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.status-card,
.hero-card,
.reviews-card {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(22px);
  padding: 28px;
}

.status-card.error {
  color: #be123c;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(280px, 380px) 1fr;
  gap: 28px;
}

.main-image {
  width: 100%;
  border-radius: 24px;
  object-fit: cover;
  box-shadow: 0 24px 40px rgba(15, 23, 42, 0.18);
}

.eyebrow {
  display: inline-block;
  margin-bottom: 0.6rem;
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.info-shell h1,
.section-heading h2 {
  margin: 0;
}

.description {
  color: var(--muted-light);
  line-height: 1.7;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 1.25rem 0;
}

.meta-card,
.purchase-card,
.review-form,
.review-item {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.meta-card {
  padding: 1rem;
}

.meta-card strong {
  display: block;
  margin-bottom: 0.35rem;
}

.meta-card span {
  color: var(--muted-light);
  font-size: 0.82rem;
}

.purchase-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem;
}

.purchase-card small {
  display: block;
  color: var(--muted-light);
}

.price {
  display: block;
  margin-top: 0.35rem;
  font-size: 2rem;
}

.action-row,
.section-heading,
.review-head,
.stars-display,
.rating-input {
  display: flex;
  align-items: center;
}

.action-row,
.section-heading {
  justify-content: space-between;
  gap: 0.8rem;
}

.ghost-button,
.primary-button,
.star-button {
  min-height: 46px;
  border: none;
  cursor: pointer;
}

.ghost-button,
.primary-button {
  border-radius: 16px;
  padding: 0 1rem;
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
  color: #0284c7;
  font-weight: 600;
}

.review-form {
  margin-top: 1.2rem;
  padding: 1rem;
}

.rating-input {
  gap: 0.35rem;
}

.star-button {
  width: 46px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.08);
  color: #64748b;
}

.star-button.active {
  color: #facc15;
}

textarea {
  width: 100%;
  min-height: 130px;
  margin: 0.9rem 0;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.7);
  padding: 1rem;
  color: inherit;
  resize: vertical;
}

.empty-reviews {
  margin-top: 1.1rem;
  color: var(--muted-light);
}

.reviews-list {
  display: grid;
  gap: 14px;
  margin-top: 1.2rem;
}

.review-item {
  padding: 1rem 1.1rem;
}

.review-head {
  gap: 0.9rem;
  margin-bottom: 0.7rem;
}

.review-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  object-fit: cover;
}

.stars-display {
  gap: 0.15rem;
  color: #94a3b8;
}

.star-icon {
  display: inline-flex;
}

.stars-display .active {
  color: #facc15;
}

:global(.dark) .status-card,
:global(.dark) .hero-card,
:global(.dark) .reviews-card,
:global(.dark) .meta-card,
:global(.dark) .purchase-card,
:global(.dark) .review-form,
:global(.dark) .review-item,
:global(.dark) textarea {
  background: rgba(7, 14, 34, 0.74);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

:global(.dark) .description,
:global(.dark) .meta-card span,
:global(.dark) .purchase-card small,
:global(.dark) .empty-reviews {
  color: var(--muted-dark);
}

:global(.dark) .ghost-button,
:global(.dark) .star-button {
  background: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

@media (max-width: 900px) {
  .hero-grid,
  .meta-grid,
  .purchase-card,
  .section-heading {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
