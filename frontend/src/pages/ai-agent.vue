<template>
  <q-page class="ai-agent-page">
    <div class="ai-agent-wrapper">
      <AIAgent />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import AIAgent from 'components/AIAgent.vue';
</script>

<style scoped>
.ai-agent-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.ai-agent-wrapper {
  padding: 20px;
}

/* Dark mode uyumu */
.body--dark .ai-agent-page {
  background: var(--q-dark);
}
</style> 