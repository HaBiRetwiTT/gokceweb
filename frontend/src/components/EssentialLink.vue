<template>
  <q-item
    clickable
    :tag="isExternalLink ? 'a' : 'div'"
    :target="isExternalLink ? '_blank' : undefined"
    :href="isExternalLink ? link : undefined"
    @click="handleClick"
    :class="{ 'active-menu-item': isActive }"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon" />
      <q-tooltip v-if="mini" style="min-width: 250px; text-align: center; font-size: 1em; color:cyan;">{{ title }}</q-tooltip>
    </q-item-section>

    <q-item-section v-if="!mini">
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export interface EssentialLinkProps {
  title: string;
  caption?: string;
  link?: string;
  icon?: string;
  action?: string | undefined;
  mini?: boolean;
};

const props = withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
  mini: false,
});

const router = useRouter();
const route = useRoute();

const isExternalLink = computed(() => {
  return props.link?.startsWith('http') || props.link?.startsWith('https');
});

// Aktif menü öğesini kontrol et
const isActive = computed(() => {
  if (!props.link || props.link === '#') return false;
  return route.path === props.link;
});

const emit = defineEmits(['action']);

function handleInternalLink() {
  if (props.link && props.link !== '#') {
    void router.push(props.link);
  }
}

function handleClick() {
  if (props.action) {
    emit('action', props.action);
  } else if (!isExternalLink.value) {
    handleInternalLink();
  }
}
</script>

<style scoped>
/* Aktif menü öğesi stilleri */
.active-menu-item {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(30, 136, 229, 0.15) 100%);
  border-left: 4px solid #1976d2;
  font-weight: 600;
}

/* Dark mode için aktif menü öğesi stilleri */
.body--dark .active-menu-item {
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.2) 0%, rgba(144, 202, 249, 0.2) 100%);
  border-left: 4px solid #64b5f6;
}

/* Aktif menü öğesi hover efekti */
.active-menu-item:hover {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.25) 0%, rgba(30, 136, 229, 0.25) 100%);
}

.body--dark .active-menu-item:hover {
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.3) 0%, rgba(144, 202, 249, 0.3) 100%);
}

/* Aktif menü öğesi ikonu için özel renk */
.active-menu-item .q-icon {
  color: #1976d2;
}

.body--dark .active-menu-item .q-icon {
  color: #64b5f6;
}

/* Aktif menü öğesi metni için özel renk */
.active-menu-item .q-item-label {
  color: #1565c0;
  font-weight: 600;
}

.body--dark .active-menu-item .q-item-label {
  color: #90caf9;
  font-weight: 600;
}

/* Normal menü öğeleri için hover efekti */
.q-item:not(.active-menu-item):hover {
  background: rgba(0, 0, 0, 0.04);
}

.body--dark .q-item:not(.active-menu-item):hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Transition efektleri */
.q-item {
  transition: all 0.3s ease;
  border-radius: 0 24px 24px 0;
  margin: 4px 8px 4px 0;
}

.q-item .q-icon {
  transition: color 0.3s ease;
}

.q-item .q-item-label {
  transition: color 0.3s ease;
}

.wide-tooltip {
  min-width: 180px;
  text-align: center;
  font-size: 1.15em; /* veya 16px, 18px gibi */
}
</style>
