<script setup lang="ts">
const projectName = "{{PROJECT_NAME}}";
</script>

<template>
  <div class="app">
    <h1>{{ projectName }}</h1>
    <p>Built with Vue + Vite + TypeScript</p>
  </div>
</template>

<style scoped>
.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
</style>
