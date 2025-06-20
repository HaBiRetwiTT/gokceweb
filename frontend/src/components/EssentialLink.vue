<template>
  <q-item
    clickable
    :tag="isExternalLink ? 'a' : 'div'"
    :target="isExternalLink ? '_blank' : undefined"
    :href="isExternalLink ? link : undefined"
    @click="!isExternalLink && handleInternalLink()"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

export interface EssentialLinkProps {
  title: string;
  caption?: string;
  link?: string;
  icon?: string;
};

const props = withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
});

const router = useRouter();

const isExternalLink = computed(() => {
  return props.link?.startsWith('http') || props.link?.startsWith('https');
});

function handleInternalLink() {
  if (props.link && props.link !== '#') {
    void router.push(props.link);
  }
}
</script>
