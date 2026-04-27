<template>
  <section class="reports-card">
    <div class="reports-header">
      <div>
        <p class="eyebrow">Reportes</p>
        <h2>Ventas NeoGaming</h2>
      </div>
      <div class="filters">
        <button
          v-for="option in filterOptions"
          :key="option.value"
          :class="['filter-btn', { active: selectedPeriod === option.value }]"
          type="button"
          @click="changePeriod(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="status">Cargando reportes...</div>
    <div v-else-if="error" class="status error">{{ error }}</div>

    <div v-else class="charts-grid">
      <article class="chart-panel">
        <h3>Ventas diarias</h3>
        <Line :data="lineChartData" :options="lineChartOptions" />
      </article>

      <article class="chart-panel">
        <h3>Ventas por categoria</h3>
        <Pie :data="pieChartData" :options="pieChartOptions" />
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { Line, Pie } from 'vue-chartjs';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiFetch, formatCurrency } from '../utils/api';
import { authHeaders } from '../utils/session';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
);

const filterOptions = [
  { value: '7d', label: 'Ultimos 7 dias' },
  { value: 'month', label: 'Mes actual' },
  { value: 'year', label: 'Ano' },
];

const selectedPeriod = ref('month');
const loading = ref(false);
const error = ref('');
const dailySales = ref([]);
const categorySales = ref([]);

const gamingPalette = ['#22d3ee', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6'];

const lineChartData = computed(() => ({
  labels: dailySales.value.map((row) => formatDate(row.fecha, selectedPeriod.value)),
  datasets: [
    {
      label: 'Ventas (DOP)',
      data: dailySales.value.map((row) => Number(row.total) || 0),
      borderColor: '#22d3ee',
      backgroundColor: 'rgba(34, 211, 238, 0.2)',
      tension: 0.28,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
    },
  ],
}));

const pieChartData = computed(() => ({
  labels: categorySales.value.map((row) => row.categoria),
  datasets: [
    {
      data: categorySales.value.map((row) => Number(row.total) || 0),
      backgroundColor: categorySales.value.map((_, index) => gamingPalette[index % gamingPalette.length]),
      borderColor: '#0f172a',
      borderWidth: 1,
    },
  ],
}));

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#e2e8f0' },
    },
    tooltip: {
      callbacks: {
        label: (context) => formatCurrency(context.parsed.y),
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
    },
    y: {
      ticks: {
        color: '#94a3b8',
        callback: (value) => formatCurrency(value),
      },
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
    },
  },
};

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#e2e8f0' },
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`,
      },
    },
  },
};

const formatDate = (value, period) => {
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return period === 'year' ? format(date, 'MMM', { locale: es }) : format(date, 'dd MMM', { locale: es });
};

const loadReports = async () => {
  loading.value = true;
  error.value = '';
  try {
    const payload = await apiFetch(`/admin/reports?period=${selectedPeriod.value}`, {
      headers: authHeaders(),
    });
    dailySales.value = payload.dailySales || [];
    categorySales.value = payload.categorySales || [];
  } catch (err) {
    error.value = err.message || 'No se pudieron cargar los reportes.';
  } finally {
    loading.value = false;
  }
};

const changePeriod = async (period) => {
  if (selectedPeriod.value === period) return;
  selectedPeriod.value = period;
  await loadReports();
};

onMounted(loadReports);
</script>

<style scoped>
.reports-card {
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94));
  padding: 22px;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: #22d3ee;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h2,
h3 {
  margin: 0;
  color: #f8fafc;
}

.filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  min-height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  padding: 0 0.9rem;
  cursor: pointer;
  font-weight: 700;
}

.filter-btn.active {
  border-color: transparent;
  background: linear-gradient(135deg, #06b6d4, #7c3aed);
  color: #fff;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.chart-panel {
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.72);
  padding: 1rem;
  min-height: 320px;
}

.chart-panel :deep(canvas) {
  height: 260px !important;
}

.status {
  color: #cbd5e1;
}

.status.error {
  color: #fda4af;
}

@media (max-width: 920px) {
  .reports-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
