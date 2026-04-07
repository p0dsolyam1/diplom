<template>
  <div class="app">
    <header class="app-header">
      <div class="logo">🎯 Стрелок</div>
      <div class="header-meta" v-if="store.exerciseId">
        Упражнение #{{ store.exerciseId }}
      </div>
    </header>

    <main class="app-main">
      <!-- Левая колонка: камера -->
      <section class="panel panel-camera">
        <CameraView />
        <Controls class="mt-16" />
      </section>

      <!-- Правая колонка: результаты / заглушка -->
      <section class="panel panel-results">
        <ResultsView v-if="store.view === 'results'" />
        <div v-else class="placeholder">
          <p>Здесь появятся результаты после завершения упражнения</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import CameraView from './components/CameraView.vue'
import Controls from './components/Controls.vue'
import ResultsView from './components/ResultsView.vue'
import { useExerciseStore } from './stores/exercise.js'

const store = useExerciseStore()
</script>

<style>
/* Глобальные стили */
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --muted: #8b949e;
  --accent: #58a6ff;
}

body {
  background: var(--bg);
  color: var(--text);
}

.mt-16 { margin-top: 16px; }
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: 56px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.header-meta {
  font-size: 13px;
  color: var(--muted);
}

.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 20px;
  padding: 20px 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.panel {
  display: flex;
  flex-direction: column;
}

.panel-results {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  overflow-y: auto;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
  padding: 40px;
}

@media (max-width: 900px) {
  .app-main {
    grid-template-columns: 1fr;
  }
}
</style>
