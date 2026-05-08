<template>
  <section class="smart-address">
    <header class="smart-address__header">
      <div>
        <p class="smart-address__eyebrow">Dirección de entrega</p>
        <h3>Completa dónde quieres recibir tu pedido</h3>
        <small>Puedes usar tu ubicación actual y ajustar los datos antes de confirmar.</small>
      </div>

      <button
        class="detect-button"
        type="button"
        :disabled="geoBusy || !geoSupported"
        @click="detectLocation"
      >
        {{ geoBusy ? 'Detectando...' : 'Usar mi ubicación' }}
      </button>
    </header>

    <p v-if="geoStatus" class="geo-status">{{ geoStatus }}</p>

    <div class="smart-address__grid">
      <label>
        Calle
        <input v-model.trim="localAddress.calle" type="text" required />
      </label>

      <label>
        Número de casa
        <input v-model.trim="localAddress.numero_casa" type="text" required />
      </label>

      <label>
        Sector
        <input v-model.trim="localAddress.sector" type="text" />
      </label>

      <label class="full-width">
        Referencia
        <textarea v-model.trim="localAddress.referencia" rows="3"></textarea>
      </label>

      <label>
        Latitud
        <input v-model.number="localAddress.latitud" step="0.00000001" type="number" />
      </label>

      <label>
        Longitud
        <input v-model.number="localAddress.longitud" step="0.00000001" type="number" />
      </label>

      <label>
        Provincia
        <select v-model.number="localAddress.id_provincia" @change="handleProvinceChange" required>
          <option value="" disabled>Selecciona una provincia</option>
          <option
            v-for="province in provinces"
            :key="province.id_provincia"
            :value="province.id_provincia"
          >
            {{ province.nombre }}
          </option>
        </select>
      </label>

      <label class="checkbox-row">
        <input v-model="localAddress.use_custom_municipio" type="checkbox" />
        No encuentro mi municipio en la lista
      </label>

      <label v-if="!localAddress.use_custom_municipio">
        Municipio
        <select v-model.number="localAddress.id_municipio" required>
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
        <input v-model.trim="localAddress.municipio_personalizado" type="text" required />
      </label>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

defineOptions({
  name: 'SmartAddressForm',
});

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  provinces: {
    type: Array,
    default: () => [],
  },
  municipalities: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'error', 'detected']);

const createDraft = (value = {}) => ({
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
  ...value,
});

const normalize = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const localAddress = ref(createDraft(props.modelValue));
const geoStatus = ref('');
const geoBusy = ref(false);
const geoSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

const filteredMunicipios = computed(() =>
  props.municipalities.filter(
    (municipio) => Number(municipio.id_provincia) === Number(localAddress.value.id_provincia),
  ),
);

watch(
  () => props.modelValue,
  (value) => {
    localAddress.value = createDraft(value);
  },
  { deep: true, immediate: true },
);

watch(
  localAddress,
  (value) => {
    emit('update:modelValue', createDraft(value));
  },
  { deep: true },
);

const handleProvinceChange = () => {
  localAddress.value.id_municipio = '';
  localAddress.value.municipio_personalizado = '';
};

const findProvince = (name) =>
  props.provinces.find((province) => normalize(province.nombre) === normalize(name)) || null;

const updateFromReverseGeo = (payload) => {
  const address = payload?.address || {};
  const provinceName = address.state || address.region || address.state_district || '';
  const municipalityName =
    address.city || address.town || address.village || address.municipality || address.county || '';
  const street = address.road || address.pedestrian || address.neighbourhood || '';
  const sector = address.suburb || address.neighbourhood || address.quarter || '';
  const reference = payload.display_name || [street, municipalityName, provinceName].filter(Boolean).join(', ');

  if (street) {
    localAddress.value.calle = street;
  }
  if (address.house_number) {
    localAddress.value.numero_casa = address.house_number;
  }
  if (sector) {
    localAddress.value.sector = sector;
  }
  if (reference) {
    localAddress.value.referencia = reference;
  }

  const province = findProvince(provinceName);
  if (province) {
    localAddress.value.id_provincia = province.id_provincia;
  }

  if (provinceName) {
    const municipiosForProvince = props.municipalities.filter(
      (municipio) => Number(municipio.id_provincia) === Number(province?.id_provincia || localAddress.value.id_provincia),
    );
    const municipality =
      municipiosForProvince.find((item) => normalize(item.nombre) === normalize(municipalityName)) || null;

    if (municipality) {
      localAddress.value.use_custom_municipio = false;
      localAddress.value.id_municipio = municipality.id_municipio;
      localAddress.value.municipio_personalizado = '';
    } else if (municipalityName) {
      localAddress.value.use_custom_municipio = true;
      localAddress.value.municipio_personalizado = municipalityName;
      localAddress.value.id_municipio = '';
    }
  }
};

const detectLocation = async () => {
  geoStatus.value = '';

  if (!geoSupported) {
    geoStatus.value = 'La geolocalización no está disponible en este navegador.';
    emit('error', geoStatus.value);
    return;
  }

  geoBusy.value = true;

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 300000,
      });
    });

    const lat = Number(position.coords.latitude.toFixed(8));
    const lon = Number(position.coords.longitude.toFixed(8));
    localAddress.value.latitud = lat;
    localAddress.value.longitud = lon;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=es`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('No se pudo consultar la geocodificación inversa.');
    }

    const payload = await response.json();
    updateFromReverseGeo(payload);

    geoStatus.value = 'Ubicación detectada. Puedes corregir cualquier campo antes de guardar.';
    emit('detected', createDraft(localAddress.value));
  } catch (error) {
    geoStatus.value = error.message || 'No se pudo detectar la ubicación.';
    emit('error', geoStatus.value);
  } finally {
    geoBusy.value = false;
  }
};
</script>

<style scoped>
.smart-address {
  display: grid;
  gap: 16px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(14, 165, 233, 0.08));
}

.smart-address__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.smart-address__header h3,
.smart-address__header p,
.smart-address__header small {
  margin: 0;
}

.smart-address__eyebrow {
  color: #0284c7;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 0.35rem !important;
}

.smart-address__header small {
  color: #64748b;
}

.detect-button {
  min-height: 44px;
  border: none;
  border-radius: 14px;
  padding: 0 1rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  cursor: pointer;
}

.detect-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.geo-status {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(14, 165, 233, 0.12);
  color: #075985;
  font-weight: 600;
}

.smart-address__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.smart-address__grid label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

.smart-address__grid input,
.smart-address__grid select,
.smart-address__grid textarea {
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.82);
  padding: 0 0.9rem;
}

.smart-address__grid textarea {
  min-height: 92px;
  padding: 0.9rem;
  resize: vertical;
}

.full-width {
  grid-column: 1 / -1;
}

.checkbox-row {
  display: flex !important;
  align-items: center;
  gap: 0.65rem;
}

.checkbox-row input {
  min-height: auto;
}

@media (max-width: 720px) {
  .smart-address__header,
  .smart-address__grid {
    grid-template-columns: 1fr;
  }

  .smart-address__header {
    flex-direction: column;
  }

  .smart-address__grid {
    display: grid;
  }
}
</style>
