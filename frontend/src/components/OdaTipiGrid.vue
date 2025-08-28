<!-- OdaTipiGrid.vue -->
<template>
  <div class="oda-tipi-grid">
    <q-table
      :rows="roomTypes"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :rows-per-page-options="[0]"
      hide-pagination
      class="room-table"
    >
      <!-- Header with "Select All" checkbox -->
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th class="checkbox-column">
            <q-checkbox
              v-model="selectAll"
              @update:model-value="toggleSelectAll"
              :indeterminate="isIndeterminate"
              size="xs"
              color="primary"
            />
          </q-th>
          <q-th key="type" :props="props" class="type-column">
            Oda Tipi
          </q-th>
        </q-tr>
      </template>

      <!-- Body rows with individual checkboxes -->
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td class="checkbox-column">
            <q-checkbox
              v-model="selectedTypes"
              :val="props.row.value"
              @update:model-value="onSelectionChange"
              size="xs"
              color="primary"
            />
          </q-td>
          <q-td key="type" :props="props" class="type-column">
            <div class="type-item">
              <q-icon :name="props.row.icon" size="xs" class="q-mr-sm" :color="props.row.color" />
              <span class="type-label">{{ props.row.label }}</span>
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { 
  AccommodationType, 
  AccommodationSelectionEvent 
} from '../types/accommodation'
import { ROOM_TYPES } from '../types/accommodation'

// Props
interface Props {
  modelValue?: string[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  disabled: false
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: string[]): void
  (e: 'selection-changed', value: AccommodationSelectionEvent): void
}

const emit = defineEmits<Emits>()

// Data
const roomTypes = ref<AccommodationType[]>(ROOM_TYPES)

const columns = [
  {
    name: 'checkbox',
    label: '',
    field: 'checkbox',
    align: 'center' as const,
    style: 'width: 60px'
  },
  {
    name: 'type',
    label: 'Oda Tipi',
    field: 'label',
    align: 'left' as const
  }
]

// Reactive state
const selectedTypes = ref<string[]>(roomTypes.value.map(type => type.value))

// Computed
const selectAll = computed({
  get: () => selectedTypes.value.length === roomTypes.value.length,
  set: (val: boolean) => {
    if (val) {
      selectedTypes.value = roomTypes.value.map(type => type.value)
    } else {
      selectedTypes.value = []
    }
  }
})

const isIndeterminate = computed(() => {
  const selected = selectedTypes.value.length
  return selected > 0 && selected < roomTypes.value.length
})

const selectedTypeLabels = computed(() => {
  return selectedTypes.value.map(value => {
    const type = roomTypes.value.find(t => t.value === value)
    return type?.label || value
  })
})

// Methods
const toggleSelectAll = (value: boolean) => {
  if (props.disabled) return
  
  if (value) {
    selectedTypes.value = roomTypes.value.map(type => type.value)
  } else {
    selectedTypes.value = []
  }
  onSelectionChange()
}

const onSelectionChange = () => {
  if (props.disabled) return
  
  emit('update:modelValue', [...selectedTypes.value])
  emit('selection-changed', {
    selected: [...selectedTypes.value],
    labels: selectedTypeLabels.value
  })
}

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  selectedTypes.value = [...newVal]
}, { deep: true })

// Public methods (exposed to parent)
defineExpose({
  getSelectedTypes: () => selectedTypes.value,
  getSelectedLabels: () => selectedTypeLabels.value,
  selectAll: () => toggleSelectAll(true),
  isAllSelected: () => selectAll.value
})
</script>

<style scoped>
.oda-tipi-grid {
  width: 100%;
  max-width: 300px;
}

.room-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.room-table :deep(.q-table__top) {
  padding: 0;
}

.room-table :deep(.q-table thead th) {
  background-color: #f8fafc;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  padding: 8px 12px;
}

.room-table :deep(.q-table tbody td) {
  padding: 4px 6px;
  border-bottom: 1px solid #f3f4f6;
}

.room-table :deep(.q-table tbody tr:last-child td) {
  border-bottom: none;
}

.room-table :deep(.q-table tbody tr:hover) {
  background-color: #f9fafb;
}

.checkbox-column {
  width: 60px !important;
  text-align: center;
}

.type-column {
  text-align: left;
}

.type-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}

.type-label {
  color: #374151;
}

/* Dark mode support */
.body--dark .room-table :deep(.q-table thead th) {
  background-color: #374151;
  color: #f9fafb;
  border-bottom: 2px solid #4b5563;
}

.body--dark .room-table :deep(.q-table tbody td) {
  border-bottom: 1px solid #4b5563;
}

.body--dark .room-table :deep(.q-table tbody tr:hover) {
  background-color: #374151;
}

.body--dark .type-label {
  color: #f9fafb;
}

/* Responsive design */
@media (max-width: 480px) {
  .oda-tipi-grid {
    max-width: 100%;
  }
  
  .room-table :deep(.q-table thead th),
  .room-table :deep(.q-table tbody td) {
    padding: 8px 12px;
  }
  
  .type-item {
    font-size: 13px;
  }
}
</style>