<template>
  <div class="neo-container" v-if="game">
    <section class="game-header-section">
      <div class="hero-grid">
        <img :src="`http://localhost:3000${game.imagen_url}`" class="main-poster" />
        <div class="main-info">
          <h1 class="neo-title">{{ game.titulo }}</h1>
          <p class="description">{{ game.descripcion || 'Sin descripción.' }}</p>
          <div class="price-tag">RD$ {{ game.precio || '2,500' }}</div>
        </div>
      </div>
    </section>

    <section class="reviews-section">
      <div class="reviews-wrapper">
        <div class="flex-header">
          <h2 class="neon-text">RESEÑAS DE LA COMUNIDAD</h2>
          <button @click="showForm = !showForm" class="btn-neo">
            {{ showForm ? 'Cerrar' : 'Escribir Opinión' }}
          </button>
        </div>

        <div v-if="showForm" class="review-form">
          <div class="star-rating">
            <span v-for="i in 5" :key="i" @click="newReview.puntuacion = i"
                  class="star-btn" :class="{ 'active': i <= newReview.puntuacion }">
              <Star :size="22" />
            </span>
          </div>
          <textarea v-model="newReview.comentario" placeholder="¿Qué te pareció el juego?"></textarea>
          <button @click="enviarResena" class="btn-send">Publicar Transmisión</button>
        </div>

        <div class="reviews-list">
          <div v-if="!game.Resenas?.length" class="no-reviews">Aún no hay transmisiones para este juego.</div>
          
          <div v-for="res in game.Resenas" :key="res.id_resena" class="review-item">
            <div class="user-box">
              <img :src="`https://ui-avatars.com/api/?name=${res.Usuario.nombre}`" class="user-avatar" />
              <div>
                <span class="user-name">{{ res.Usuario.nombre }} {{ res.Usuario.apellido }}</span>
                <div class="stars-display">
                  <span v-for="i in 5" :key="i" class="s-mini" :class="{ 'on': i <= res.puntuacion }">
                    <Star :size="12" />
                  </span>
                </div>
              </div>
            </div>
            <p class="comment-text">{{ res.comentario }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Star } from 'lucide-vue-next';

const route = useRoute(); // Para capturar el ID de la URL
const game = ref(null);
const showForm = ref(false);
const newReview = ref({ puntuacion: 5, comentario: "" });

const loadData = async () => {
    // IMPORTANTE: Aquí usamos el ID que viene de la GameCard
    const res = await fetch(`http://localhost:3000/api/productos/${route.params.id}`);
    if (res.ok) {
        game.value = await res.json();
    }
};

const enviarResena = async () => {
    await fetch('http://localhost:3000/api/resenas', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
            id_producto: game.value.id_producto, 
            ...newReview.value 
        })
    });
    showForm.value = false;
    loadData(); // Recargar para ver el comentario nuevo
};

onMounted(loadData);
</script>

<style scoped>
/* Estética NeoGaming */
.neo-container { padding: 40px; max-width: 1200px; margin: auto; color: white; }
.hero-grid { display: grid; grid-template-columns: 350px 1fr; gap: 40px; margin-bottom: 60px; }
.main-poster { width: 100%; border-radius: 20px; box-shadow: 0 0 30px rgba(0,0,0,0.5); border: 1px solid #333; }
.neo-title { font-size: 3rem; font-weight: 800; color: #fff; }

.reviews-wrapper { background: rgba(255,255,255,0.02); padding: 40px; border-radius: 30px; border: 1px solid #222; }
.review-item { background: rgba(0,0,0,0.3); padding: 20px; border-radius: 15px; margin-bottom: 15px; border-left: 4px solid var(--primary); }
.user-avatar { width: 40px; border-radius: 50%; margin-right: 15px; }

/* Estrellas */
.star-btn { cursor: pointer; color: #222; font-size: 2rem; }
.star-btn.active { color: #ffca28; }
.s-mini { font-size: 14px; color: #111; display: inline-flex; }
.s-mini.on { color: #ffca28; }

textarea { width: 100%; background: #111; border: 1px solid #333; color: white; padding: 15px; border-radius: 10px; margin: 15px 0; }
.btn-neo { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
</style>