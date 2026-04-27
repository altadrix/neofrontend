<template>
  <div class="home-page">
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">Bienvenido a</p>
        <h1 class="hero-title">NeoGaming, tus mejores momentos de diversión</h1>
        <p class="hero-text">
          ¡Descubre videojuegos, accesorios, periféricos y obtén los coleccionables más peculiares del mundo del gaming!
        </p>

        <div class="hero-actions">
          <button class="primary-action" type="button" @click="scrollToCatalogo">Explorar catalogo</button>
          <RouterLink v-if="!usuario" to="/login" class="secondary-action">Iniciar sesion</RouterLink>
          <RouterLink v-else to="/carrito" class="secondary-action">
            Continuar compra
          </RouterLink>
        </div>

        <div v-if="usuario" class="welcome-banner">
          Sesion activa como {{ usuario.nombre }} {{ usuario.apellido }}.
        </div>
      </div>

      <div class="hero-metrics">
        <div class="metric-card">
          <strong>{{ games.length }}</strong>
          <span>productos activos</span>
        </div>
        <div class="metric-card">
          <strong>18%</strong>
          <span>ITBIS calculado automaticamente</span>
        </div>
        <div class="metric-card">
          <strong>Realtime</strong>
          <span>carrito sincronizado con navbar</span>
        </div>
      </div>
    </section>

    <section class="filters-panel">
      <div class="filter-field search-field">
        <label>Buscar</label>
        <input v-model.trim="searchQuery" type="text" placeholder="Halo, Zelda, Spider-Man..." />
      </div>

      <div class="filter-field">
        <label>Genero</label>
        <select v-model="selectedGenre">
          <option value="">Todos</option>
          <option v-for="genre in genreOptions" :key="genre" :value="genre">{{ genre }}</option>
        </select>
      </div>

      <div class="filter-field">
        <label>Plataforma</label>
        <select v-model="selectedPlatform">
          <option value="">Todas</option>
          <option v-for="platform in platformOptions" :key="platform" :value="platform">
            {{ platform }}
          </option>
        </select>
      </div>

      <div class="filter-field price-field">
        <label>Precio maximo: {{ formatCurrency(maxPrice) }}</label>
        <input v-model.number="maxPrice" type="range" min="0" max="5000" step="100" />
      </div>

      <button class="reset-button" type="button" @click="resetFilters">Limpiar filtros</button>
    </section>

    <section ref="catalogSection" class="catalog-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Catalogo sincronizado</p>
          <h2>Juegos destacados</h2>
        </div>
        <span>{{ filteredGames.length }} resultados</span>
      </div>

      <div v-if="loading" class="status-box">Cargando catalogo desde NeoGaming...</div>
      <div v-else-if="error" class="status-box error-box">{{ error }}</div>
      <div v-else-if="filteredGames.length === 0" class="status-box">No encontramos juegos con esos filtros.</div>

      <div v-else class="card-grid">
        <GameCard
          v-for="game in filteredGames"
          :key="game.id_producto"
          :game="game"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import GameCard from './GameCard.vue';
import emitter from '../utils/emitter';
import { apiFetch, formatCurrency } from '../utils/api';
import { getStoredUser } from '../utils/session';

const usuario = ref(getStoredUser());
const games = ref([]);
const loading = ref(true);
const error = ref('');
const catalogSection = ref(null);

const searchQuery = ref('');
const selectedGenre = ref('');
const selectedPlatform = ref('');
const maxPrice = ref(5000);

const fetchProducts = async () => {
  loading.value = true;
  error.value = '';

  try {
    games.value = await apiFetch('/productos');
  } catch (err) {
    error.value = err.message || 'No se pudo cargar el catalogo.';
  } finally {
    loading.value = false;
  }
};

const genreOptions = computed(() =>
  [...new Set(games.value.map((game) => game.genero_nombre).filter(Boolean))].sort(),
);

const platformOptions = computed(() =>
  [...new Set(games.value.map((game) => game.plataforma_nombre).filter(Boolean))].sort(),
);

const filteredGames = computed(() =>
  games.value.filter((game) => {
    const searchSource = `${game.titulo} ${game.descripcion || ''}`.toLowerCase();
    const matchesSearch = !searchQuery.value || searchSource.includes(searchQuery.value.toLowerCase());
    const matchesGenre = !selectedGenre.value || game.genero_nombre === selectedGenre.value;
    const matchesPlatform = !selectedPlatform.value || game.plataforma_nombre === selectedPlatform.value;
    const matchesPrice = Number(game.precio || 0) <= maxPrice.value;

    return matchesSearch && matchesGenre && matchesPlatform && matchesPrice;
  }),
);

const resetFilters = () => {
  searchQuery.value = '';
  selectedGenre.value = '';
  selectedPlatform.value = '';
  maxPrice.value = 5000;
};

const scrollToCatalogo = () => {
  catalogSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

let offSession;

onMounted(async () => {
  offSession = emitter.on('session-changed', (payload) => {
    usuario.value = payload;
  });

  await fetchProducts();
});

onUnmounted(() => {
  offSession?.();
});
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-panel,
.filters-panel,
.catalog-panel {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(24px);
  box-shadow: 0 25px 70px rgba(15, 23, 42, 0.14);
}

.hero-panel {
  display: grid;
  grid-template-columns: 1.45fr 0.8fr;
  gap: 24px;
  padding: 36px;
  background:
    linear-gradient(135deg, rgba(2, 132, 199, 0.24), rgba(37, 99, 235, 0.08)),
    rgba(255, 255, 255, 0.58);
}

.hero-panel::after {
  content: '';
  position: absolute;
  inset: auto -80px -120px auto;
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: rgba(49, 198, 255, 0.12);
  filter: blur(20px);
}

.eyebrow {
  margin: 0 0 0.6rem;
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  font-size: clamp(2.2rem, 4vw, 4rem);
  line-height: 1;
}

.hero-text {
  max-width: 640px;
  margin: 1rem 0 0;
  color: var(--muted-light);
  font-size: 1.05rem;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-top: 1.5rem;
}

.primary-action,
.secondary-action,
.reset-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 1.25rem;
  border-radius: 16px;
  font-weight: 700;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.primary-action {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.28);
}

.secondary-action {
  background: rgba(255, 255, 255, 0.48);
  color: black; /*antes inherit*/
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.primary-action:hover,
.secondary-action:hover,
.reset-button:hover {
  transform: translateY(-1px);
}

.welcome-banner {
  display: inline-flex;
  margin-top: 1.2rem;
  padding: 0.8rem 1rem;
  border-radius: 16px;
  background: rgba(14, 165, 233, 0.12);
  color: darkslategrey; /*previo #0369a1*/
  font-weight: 600;
}

.hero-metrics {
  display: grid;
  gap: 14px;
}

.metric-card {
  padding: 1.2rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.32);
}

.metric-card strong {
  display: block;
  font-size: 1.8rem;
  margin-bottom: 0.3rem;
}

.filters-panel {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr)) auto;
  gap: 16px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.52);
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-field label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-light);
}

.filter-field input,
.filter-field select {
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.7);
  padding: 0 1rem;
  color: black; /*antes inherit*/
}

.price-field input {
  padding: 0;
}

.reset-button {
  align-self: end;
  background: rgba(15, 23, 42, 0.08);
  color: inherit;
}

.catalog-panel {
  padding: 24px;
  background: rgba(255, 255, 255, 0.46);
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-heading h2 {
  margin: 0;
  font-size: 1.7rem;
}

.status-box {
  padding: 1.2rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.52);
  color: var(--muted-light);
}

.error-box {
  color: #be123c;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.2rem;
}

:global(.dark) .hero-panel,
:global(.dark) .filters-panel,
:global(.dark) .catalog-panel {
  border-color: rgba(148, 163, 184, 0.1);
}

:global(.dark) .hero-panel {
  background:
    linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(15, 23, 42, 0.1)),
    rgba(4, 10, 24, 0.74);
}

:global(.dark) .filters-panel,
:global(.dark) .catalog-panel {
  background: rgba(6, 13, 34, 0.72);
}

:global(.dark) .hero-text,
:global(.dark) .filter-field label,
:global(.dark) .status-box {
  color: var(--muted-dark);
}

:global(.dark) .secondary-action,
:global(.dark) .metric-card,
:global(.dark) .filter-field input,
:global(.dark) .filter-field select,
:global(.dark) .status-box {
  background: rgba(15, 23, 42, 0.62);
  border-color: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

:global(.dark) .welcome-banner {
  color: #7dd3fc;
  background: rgba(14, 165, 233, 0.14);
}

:global(.dark) .reset-button {
  background: rgba(148, 163, 184, 0.08);
  color: var(--text-light);
}

@media (max-width: 960px) {
  .hero-panel,
  .filters-panel {
    grid-template-columns: 1fr;
  }
}
</style>
