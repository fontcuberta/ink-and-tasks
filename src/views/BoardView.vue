<script setup>
import { onMounted } from 'vue';
import { useProjects } from '../composables/useProjects.js';
import KanbanBoard from '../components/KanbanBoard.vue';

const { projects, loading, load } = useProjects();

onMounted(load);
</script>

<template>
  <div class="view-board">
    <div v-if="loading" class="view-loading">
      <i class="ph-thin ph-circle-notch spin"></i>
      Loading projects...
    </div>
    <KanbanBoard v-else />
  </div>
</template>

<style scoped>
.view-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.view-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 4rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
